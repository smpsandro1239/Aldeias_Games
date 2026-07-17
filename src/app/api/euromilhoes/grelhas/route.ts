import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getOfficialTime, getNextFriday, getBloqueioData } from "@/lib/time";
import { getFullUserFromRequest } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/checkPermission";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jogoId = url.searchParams.get("jogoId");

    const where: Record<string, unknown> = {};
    if (jogoId) {
      where.jogoId = jogoId;
    }

    const grelhas = await prisma.grelhaEuromilhoes.findMany({
      where,
      orderBy: { numero: "desc" },
    });

    return NextResponse.json({ success: true, data: grelhas });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Error listing grelhas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

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

    const usedNumeros = new Set(existingGrelhas.map((g: { numero: number }) => g.numero));
    let nextNumero = 1;
    while (usedNumeros.has(nextNumero)) {
      nextNumero++;
    }

    const horaOficial = await getOfficialTime();
    const sorteioData = getNextFriday(horaOficial);
    const bloqueioData = getBloqueioData(sorteioData);

    const grelha = await prisma.grelhaEuromilhoes.create({
      data: {
        jogoId,
        numero: nextNumero,
        estado: "aberta",
        numerosOcupados: "[]",
        premioDescricao: premioDescricao || null,
        premioValor: premioValor || null,
        sorteioData,
        bloqueioData,
      },
    });

    return NextResponse.json({ success: true, data: grelha }, { status: 201 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Error creating grelha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
