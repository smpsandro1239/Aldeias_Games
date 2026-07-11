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

    const grelha = await prisma.grelhaEuromilhoes.findUnique({ where: { id } });

    if (!grelha) {
      return NextResponse.json({ error: "Grelha não encontrada" }, { status: 404 });
    }

    if (grelha.estado !== "preenchida") {
      return NextResponse.json(
        { error: "Só é possível sortear grelhas com estado 'preenchida'" },
        { status: 400 }
      );
    }

    const numerosOcupados: number[] = JSON.parse(grelha.numerosOcupados);
    if (numerosOcupados.length === 0) {
      return NextResponse.json(
        { error: "Grelha sem números vendidos" },
        { status: 400 }
      );
    }

    // Generate random winning number between 1 and 50
    const numeroSorteado = Math.floor(Math.random() * 50) + 1;

    // Check if the drawn number was sold
    const isVendido = numerosOcupados.includes(numeroSorteado);

    let vencedorId: string | null = null;

    if (isVendido) {
      // Find the participation that has this number
      const participacao = await prisma.participacao.findFirst({
        where: {
          grelhaId: grelha.id,
          numerosSelecionados: { contains: String(numeroSorteado) },
        },
        orderBy: { createdAt: "asc" },
      });

      if (participacao) {
        vencedorId = participacao.userId;

        // Mark the participation as winner
        await prisma.participacao.update({
          where: { id: participacao.id },
          data: { ganhador: true },
        });
      }
    }

    const updated = await prisma.grelhaEuromilhoes.update({
      where: { id },
      data: {
        estado: "sorteada",
        numeroSorteado,
        dataSorteio: new Date(),
        vencedorId,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      sorteio: {
        numeroSorteado,
        isVendido,
        vencedorId,
      },
    });
  } catch (error) {
    console.error("Error drawing grelha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
