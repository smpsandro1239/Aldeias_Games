import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");
    const jogoId = searchParams.get("jogoId");

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
        jogo: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: apostass });
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
    const { jogoId, numeros, jogador, vendedorId, pago } = body;

    if (!jogoId || !numeros || !numeros.length || !jogador || !jogador.nome) {
      return NextResponse.json(
        { error: "Dados inválidos. É necessário jogoId, números e nome do jogador." },
        { status: 400 }
      );
    }

    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
    });

    if (!jogo) {
      return NextResponse.json(
        { error: "Jogo não encontrado" },
        { status: 404 }
      );
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
        pago: pago || false,
      },
    });

    return NextResponse.json({ data: aposta }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar aposta:", error);
    return NextResponse.json(
      { error: "Erro ao criar aposta" },
      { status: 500 }
    );
  }
}
