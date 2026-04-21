import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getFullUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

function getSimpleAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      return JSON.parse(atob(token));
    } catch (e) {
      return null;
    }
  }
  const userParam = request.nextUrl.searchParams.get("user");
  if (userParam) {
    try {
      return JSON.parse(atob(userParam));
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const jogoId = searchParams.get("jogoId");

    const user = getSimpleAuthUser(request);
    const userRole = user?.role || null;
    const userId = user?.id || null;
    const userAldeiaId = user?.aldeiaId || null;

    const where: any = {};
    
    if (tipo) {
      where.jogo = { tipo: tipo as any };
    }
    
    if (jogoId) {
      where.jogoId = jogoId;
    }

    const apostass = await prisma.aposta.findMany({
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

    const apostassNumeros = apostass.map((a: any) => ({
      ...a,
      numeros: JSON.parse(a.numeros || "[]"),
    }));

    let filteredApostas = apostassNumeros;
    
    if (userRole === "super_admin") {
      filteredApostas = apostassNumeros;
    } else if (userRole === "admin" || userRole === "aldeia_admin") {
      if (userAldeiaId) {
        filteredApostas = apostassNumeros.filter((a: any) => 
          a.jogo.evento && a.jogo.evento.aldeiaId === userAldeiaId
        );
      } else {
        filteredApostas = apostassNumeros;
      }
    } else if (userRole === "vendedor") {
      filteredApostas = apostassNumeros;
    } else {
      filteredApostas = apostassNumeros.map((a: any) => ({
        ...a,
        jogadorNome: a.jogadorNome === user?.nome ? a.jogadorNome : null,
        jogadorTelefone: undefined,
        jogadorEmail: undefined,
        vendedorId: undefined,
      }));
    }

    const ApostasComNumeros = filteredApostas.map((a: any) => ({
      ...a,
      isPropria: userRole !== "super_admin" && userRole !== "admin" && userRole !== "aldeia_admin" && userRole !== "vendedor" 
        ? a.jogadorNome === user?.nome 
        : undefined,
    }));

    return NextResponse.json({ data: ApostasComNumeros });
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

    // Get authenticated user for saldo payment processing
    const user = await getFullUserFromRequest(request) as any;
    const custoTotal = numeros.length * (jogo.preco || jogo.custoQuadrado || 5);

    // Handle saldo payment
    if (usarSaldo && user) {
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
          descricao: `Poio da Vaca - ${numeros.length} números`,
          referencia: jogoId,
        },
      });
    }

    const apostasExistentes = await prisma.aposta.findMany({
      where: { jogoId },
    });

    const numerosOcupados = new Set(
      apostasExistentes.flatMap((a: any) => {
        try {
          return JSON.parse(a.numeros || "[]");
        } catch (e) {
          return [];
        }
      })
    );

    const numerosIndisponiveis = numeros.filter((n: number) => 
      numerosOcupados.has(n)
    );

    if (numerosIndisponiveis.length > 0) {
      return NextResponse.json(
        { error: `Os seguintes números já estão ocupados: ${numerosIndisponiveis.join(", ")}` },
        { status: 409 }
      );
    }

    const aposta = await prisma.aposta.create({
      data: {
        jogoId,
        numeros: JSON.stringify(numeros),
        jogadorNome: jogador.nome,
        jogadorTelefone: jogador.telefone || null,
        jogadorEmail: jogador.email || null,
        vendedorId: vendedorId || null,
        pago: pago || usarSaldo || false,
      },
    });

    // Give cashback for saldo payments
    if (usarSaldo && user) {
      const cashbackPercent = 0.05;
      const cashbackValor = custoTotal * cashbackPercent;

      await prisma.user.update({
        where: { id: user.id },
        data: { saldo: { increment: cashbackValor } },
      });

      await prisma.transacao.create({
        data: {
          userId: user.id,
          valor: cashbackValor,
          tipo: "cashback",
          descricao: `Cashback Poio da Vaca`,
          referencia: jogoId,
        },
      });
    }

    return NextResponse.json({ data: aposta }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar aposta:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro ao criar aposta: " + errorMessage },
      { status: 500 }
    );
  }
}
