import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFullUserFromRequest, verifyToken } from "@/lib/auth";
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

    const where: any = {};
    
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

    const mappedApostas = apostas.map((a: any) => {
      const nums = typeof a.numeros === 'string' ? JSON.parse(a.numeros || "[]") : a.numeros;

      // Filtragem de dados sensíveis para utilizadores normais
      if (userRole === "super_admin" || userRole === "aldeia_admin" || userRole === "admin" || userRole === "vendedor") {
        return { ...a, numeros: nums };
      }

      const isPropria = payload?.userId === a.userId || (a.jogadorNome === payload?.email); // Fallback logic

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
    const { jogoId, numeros, jogador, vendedorId, pago, usarSaldo } = body;

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
    const custoTotal = numeros.length * (jogo.preco || jogo.custoQuadrado || 5);

    // Handle saldo payment
    if (usarSaldo) {
      if (!user) {
        return NextResponse.json({ error: "Deve estar autenticado para pagar com saldo" }, { status: 401 });
      }
      if ((user.saldo || 0) < custoTotal) {
        return NextResponse.json(
          { error: "Saldo insuficiente" },
          { status: 400 }
        );
      }

      // Deduct from user saldo and create transaction
      await prisma.user.update({
        where: { id: user.id },
        data: { saldo: { decrement: custoTotal } },
      });

      await prisma.transacao.create({
        data: {
          userId: user.id,
          valor: -custoTotal,
          tipo: "pagamento_jogo",
          descricao: `Poio da Vaca - ${numeros.length} números (${jogo.nome})`,
          referencia: jogoId,
        },
      });
    }

    // Verificar se números já estão ocupados (Race condition protection)
    const result = await prisma.$transaction(async (tx) => {
      const apostasExistentes = await tx.aposta.findMany({
        where: { jogoId },
      });

      const numerosOcupados = new Set(
        apostasExistentes.flatMap((a: any) => {
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

      const aposta = await tx.aposta.create({
        data: {
          jogoId,
          numeros: JSON.stringify(numeros),
          jogadorNome: escapeHtml(String(jogador.nome)),
          jogadorTelefone: jogador.telefone || null,
          jogadorEmail: jogador.email || null,
          vendedorId: vendedorId || user?.id || null,
          pago: pago || usarSaldo || false,
        },
      });

      // Give cashback for saldo payments (5%)
      if (usarSaldo && user) {
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
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar aposta:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar aposta" },
      { status: error.message?.includes("ocupados") ? 409 : 500 }
    );
  }
}
