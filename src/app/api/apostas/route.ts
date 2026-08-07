import { NextRequest, NextResponse } from "next/server";
import { Prisma } from '@prisma/client';
import { prisma } from "@/lib/db";
import { getFullUserFromRequest, verifyToken } from "@/lib/auth";
import { resolvePermissions } from '@/lib/rbac/resolvePermissions';
import { executeWithRetry } from '@/lib/transaction-retry';
import { escapeHtml } from "@/lib/utils";

async function getAuthFromHeader(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return await verifyToken(token);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const jogoId = searchParams.get("jogoId");

    const payload = await getAuthFromHeader(request);
    const userRole = payload?.role || null;
    const userAldeiaId = payload?.aldeiaId || null;

    const where: Prisma.ApostaWhereInput = {};
    
    if (tipo) {
      where.jogo = { tipo: tipo as any };
    }
    
    if (jogoId) {
      where.jogoId = jogoId;
    }

    const apostas = await prisma.aposta.findMany({
      where,
      include: {
        jogo: {
          include: {
            evento: {
              include: {
                aldeia: true
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedApostas = apostas.map((a: (typeof apostas)[number]) => {
      const nums = typeof a.numeros === 'string' ? JSON.parse(a.numeros || "[]") : a.numeros;

      // Filtragem de dados sensíveis para utilizadores normais
      if (userRole === "super_admin" || userRole === "aldeia_admin" || userRole === "admin" || userRole === "vendedor") {
        return { ...a, numeros: nums };
      }

      const isPropria = payload?.userId === (a as any).userId || (a.jogadorNome === payload?.email);

      return {
        id: a.id,
        numeros: nums,
        jogadorNome: a.jogadorNome,
        pago: a.pago,
        jogoId: a.jogoId,
        createdAt: a.createdAt,
        isPropria
      };
    });

    return NextResponse.json({ data: mappedApostas });
  } catch (error) {
    console.error("Erro ao buscar apostas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar apostas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jogoId, numeros, jogador, pago, usarSaldo } = body;

    if (!jogoId || !numeros || !numeros.length || !jogador || !jogador.nome) {
      return NextResponse.json(
        { error: "Dados inválidos. É necessário jogoId, números e nome do jogador." },
        { status: 400 }
      );
    }

    // Buscar jogo para obter o preço
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
    });

    if (!jogo) {
      return NextResponse.json(
        { error: "Jogo não encontrado" },
        { status: 404 }
      );
    }

    // Get authenticated user
    const user = await getFullUserFromRequest(request) as any;

    // Todas as apostas exigem sessão autenticada (bloqueia drenagem via API direta)
    if (!user) {
      return NextResponse.json(
        { error: "Deve estar autenticado para registar apostas" },
        { status: 401 }
      );
    }

    // Para poio_da_vaca, usar custoQuadrado (preço por quadrado); para outros, usar preco
    const precoJogo = jogo.tipo === 'poio_da_vaca'
      ? (jogo.custoQuadrado || jogo.preco || 5)
      : (jogo.preco || 5);
    const custoTotal = numeros.length * precoJogo;

    const permResult = user ? await resolvePermissions(user.id, user.aldeiaId ?? undefined) : null;
    const canExecuteVenda = permResult?.hasPermission('EXECUTE_VENDA' as any) ?? false;

    const isSaldoPayment = Boolean(usarSaldo);
    const isCashSale = Boolean(pago) && !isSaldoPayment;

    // Segurança: vendas em dinheiro (pago sem saldo) exigem vendedor autenticado.
    // Impede apostas "pago" sem rasto financeiro e drenagem gratuita do tabuleiro.
    if (isCashSale && !canExecuteVenda) {
      return NextResponse.json(
        { error: "Pagamento em dinheiro apenas disponível para vendedores autenticados." },
        { status: 403 }
      );
    }

    if (isSaldoPayment) {
      if (!user) {
        return NextResponse.json({ error: "Deve estar autenticado para pagar com saldo" }, { status: 401 });
      }
      if ((user.saldo || 0) < custoTotal) {
        return NextResponse.json(
          { error: "Saldo insuficiente" },
          { status: 400 }
        );
      }
    }

    // Verificação de números ocupados + dedução de saldo + cashback DENTRO da transação
    // (atomicidade financeira — evita debitar saldo se a aposta falhar)
    const result = await executeWithRetry(() => prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const apostasExistentes = await tx.aposta.findMany({
        where: { jogoId },
      });

      const numerosOcupados = new Set(
        apostasExistentes.flatMap((a: (typeof apostasExistentes)[number]) => {
          try {
            return typeof a.numeros === 'string' ? JSON.parse(a.numeros || "[]") : a.numeros;
          } catch (e) {
            return [];
          }
        })
      );

      const numerosIndisponiveis = numeros.filter((n: number) =>
        numerosOcupados.has(n)
      );

      if (numerosIndisponiveis.length > 0) {
        throw new Error(`Números ocupados: ${numerosIndisponiveis.join(", ")}`);
      }

      // Pagamento com saldo: debita a carteira DENTRO da transação
      if (isSaldoPayment && user) {
        await tx.user.update({
          where: { id: user.id },
          data: { saldo: { decrement: custoTotal } },
        });

        await tx.transacao.create({
          data: {
            userId: user.id,
            valor: -custoTotal,
            tipo: "pagamento_jogo",
            descricao: `Poio da Vaca - ${numeros.length} números (${jogo.nome})`,
            referencia: jogoId,
          },
        });
      }

      // vendedorId é SEMPRE o utilizador autenticado (não confiar no body)
      const vendedorAssociado = canExecuteVenda ? user.id : (user?.id || null);

      const aposta = await tx.aposta.create({
        data: {
          jogoId,
          numeros: JSON.stringify(numeros),
          jogadorNome: escapeHtml(String(jogador.nome)),
          jogadorTelefone: jogador.telefone || null,
          jogadorEmail: jogador.email || null,
          vendedorId: vendedorAssociado,
          pago: isSaldoPayment || (isCashSale && canExecuteVenda),
        },
      });

      // Give cashback for saldo payments (5%)
      if (isSaldoPayment && user) {
        const cashbackPercent = 0.05;
        const cashbackValor = custoTotal * cashbackPercent;

        await tx.user.update({
          where: { id: user.id },
          data: { saldo: { increment: cashbackValor } },
        });

        await tx.transacao.create({
          data: {
            userId: user.id,
            valor: cashbackValor,
            tipo: "cashback",
            descricao: `Cashback Poio da Vaca: ${jogo.nome}`,
            referencia: jogoId,
          },
        });
      }

      return aposta;
    }));

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Erro ao criar aposta:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar aposta" },
      { status: error.message?.includes("ocupados") ? 409 : 500 }
    );
  }
}
