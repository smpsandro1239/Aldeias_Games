import { NextRequest, NextResponse } from "next/server";
import { Prisma } from '@prisma/client';
import { prisma } from "@/lib/db";
import { getFullUserFromRequest } from "@/lib/auth";
import { resolvePermissions } from '@/lib/rbac/resolvePermissions';
import { executeWithRetry } from '@/lib/transaction-retry';
import { escapeHtml } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const jogoId = searchParams.get("jogoId");
    const user = await getFullUserFromRequest(request);

    // A consulta pública é necessária para mostrar números ocupados, mas nunca
    // deve devolver nome, telefone, email ou a relação completa do jogo.
    const canViewPlayerData = Boolean(user);
    const filters: Prisma.ApostaWhereInput[] = [];

    if (tipo) filters.push({ jogo: { tipo: tipo as any } });
    if (jogoId) filters.push({ jogoId });

    if (user) {
      switch (user.role) {
        case "super_admin":
          break;
        case "aldeia_admin":
          if (!user.aldeiaId) {
            return NextResponse.json({ error: "Aldeia não associada" }, { status: 403 });
          }
          filters.push({ jogo: { evento: { aldeiaId: user.aldeiaId } } });
          break;
        case "vendedor":
        case "user":
          // O modelo legado Aposta usa vendedorId para registar o utilizador
          // autenticado que criou a aposta (não existe coluna userId).
          filters.push({ vendedorId: user.id });
          break;
        default:
          return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
      }
    }

    const apostas = await prisma.aposta.findMany({
      where: filters.length > 0 ? { AND: filters } : {},
      select: {
        id: true,
        numeros: true,
        pago: true,
        jogoId: true,
        createdAt: true,
        ...(canViewPlayerData
          ? {
              jogadorNome: true,
              jogadorTelefone: true,
              jogadorEmail: true,
              vendedorId: true,
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    const data = apostas.map((aposta) => {
      let numeros: number[] = [];
      try {
        const parsed = typeof aposta.numeros === "string"
          ? JSON.parse(aposta.numeros || "[]")
          : aposta.numeros;
        if (Array.isArray(parsed)) {
          numeros = parsed.filter((numero): numero is number =>
            typeof numero === "number" && Number.isInteger(numero)
          );
        }
      } catch {
        // Um registo legado malformado não deve derrubar a listagem.
      }

      return {
        id: aposta.id,
        numeros,
        pago: aposta.pago,
        jogoId: aposta.jogoId,
        createdAt: aposta.createdAt,
        ...(canViewPlayerData
          ? {
              jogadorNome: aposta.jogadorNome,
              jogadorTelefone: aposta.jogadorTelefone,
              jogadorEmail: aposta.jogadorEmail,
              vendedorId: aposta.vendedorId,
            }
          : {}),
      };
    });

    return NextResponse.json({ data });
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

    if (
      typeof jogoId !== "string" ||
      !Array.isArray(numeros) ||
      numeros.length === 0 ||
      !numeros.every((numero: unknown) => typeof numero === "number" && Number.isInteger(numero) && numero > 0) ||
      new Set(numeros).size !== numeros.length ||
      !jogador ||
      typeof jogador.nome !== "string" ||
      !jogador.nome.trim()
    ) {
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

    // Normalizar e limitar os dados pessoais antes de os guardar.
    const jogadorNome = escapeHtml(jogador.nome.trim().slice(0, 100));
    const jogadorTelefone = typeof jogador.telefone === "string"
      ? jogador.telefone.replace(/[^+0-9]/g, "").slice(0, 20)
      : null;
    const jogadorEmail = typeof jogador.email === "string"
      ? jogador.email.trim().toLowerCase().slice(0, 254)
      : null;

    if (jogadorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(jogadorEmail)) {
      return NextResponse.json({ error: "Email do jogador inválido" }, { status: 400 });
    }
    if (jogador.telefone && (!jogadorTelefone || jogadorTelefone.replace(/\D/g, "").length < 9)) {
      return NextResponse.json({ error: "Telefone do jogador inválido" }, { status: 400 });
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
        const debited = await tx.user.updateMany({
          where: { id: user.id, saldo: { gte: custoTotal } },
          data: { saldo: { decrement: custoTotal } },
        });
        if (debited.count === 0) throw new Error('SALDO_INSUFICIENTE');

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
          jogadorNome,
          jogadorTelefone,
          jogadorEmail,
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
      { status: error.message?.includes("ocupados") ? 409 : (error.message === 'SALDO_INSUFICIENTE' ? 400 : 500) }
    );
  }
}
