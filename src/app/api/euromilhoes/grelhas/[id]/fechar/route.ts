import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getOfficialTime } from "@/lib/time";
import { getFullUserFromRequest } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/checkPermission";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

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

    // Se bloqueioData já passou, o fecho manual pode ser feito mesmo assim
    // (o bloqueio só impede novas participações)

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
      await any.update({
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
