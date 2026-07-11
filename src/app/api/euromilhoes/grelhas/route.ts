import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jogoId = url.searchParams.get("jogoId");

    if (!jogoId) {
      return NextResponse.json({ error: "jogoId é obrigatório" }, { status: 400 });
    }

    const grelhas = await prisma.grelhaEuromilhoes.findMany({
      where: { jogoId },
      orderBy: { numero: "desc" },
    });

    return NextResponse.json({ success: true, data: grelhas });
  } catch (error) {
    console.error("Error listing grelhas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== "aldeia_admin" && session.user.role !== "super_admin")
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { jogoId, premioDescricao, premioValor } = body;

    if (!jogoId) {
      return NextResponse.json({ error: "jogoId é obrigatório" }, { status: 400 });
    }

    const jogo = await prisma.jogo.findUnique({ where: { id: jogoId } });
    if (!jogo) {
      return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
    }

    // Find the next available numero (first gap starting from 1)
    const existingGrelhas = await prisma.grelhaEuromilhoes.findMany({
      where: { jogoId },
      select: { numero: true },
      orderBy: { numero: "asc" },
    });

    const usedNumeros = new Set(existingGrelhas.map((g) => g.numero));
    let nextNumero = 1;
    while (usedNumeros.has(nextNumero)) {
      nextNumero++;
    }

    const grelha = await prisma.grelhaEuromilhoes.create({
      data: {
        jogoId,
        numero: nextNumero,
        estado: "aberta",
        numerosOcupados: "[]",
        premioDescricao: premioDescricao || null,
        premioValor: premioValor || null,
      },
    });

    return NextResponse.json({ success: true, data: grelha }, { status: 201 });
  } catch (error) {
    console.error("Error creating grelha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
