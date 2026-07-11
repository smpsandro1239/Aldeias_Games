import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== "aldeia_admin" && session.user.role !== "super_admin")
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const grelha = await prisma.grelhaEuromilhoes.findUnique({
      where: { id },
      include: { jogo: true },
    });

    if (!grelha) {
      return NextResponse.json({ error: "Grelha não encontrada" }, { status: 404 });
    }

    if (grelha.estado !== "aberta") {
      return NextResponse.json(
        { error: "Só é possível fechar grelhas com estado 'aberta'" },
        { status: 400 }
      );
    }

    const updated = await prisma.grelhaEuromilhoes.update({
      where: { id },
      data: {
        estado: "preenchida",
        dataFecho: new Date(),
      },
    });

    // Mark the parent jogo as finalizado if all grelhas are closed
    const remainingAbertas = await prisma.grelhaEuromilhoes.count({
      where: { jogoId: grelha.jogoId, estado: "aberta" },
    });

    if (remainingAbertas === 0 && !grelha.jogo.isFinalizado) {
      await prisma.jogo.update({
        where: { id: grelha.jogoId },
        data: { isFinalizado: true },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error closing grelha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
