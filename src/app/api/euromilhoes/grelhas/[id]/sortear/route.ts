import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { TipoNotificacao } from "@prisma/client";

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

        // Credit prize to winner's wallet
        const premioValor = grelha.premioValor ?? 0;
        if (premioValor > 0 && participacao.userId) {
          await prisma.user.update({
            where: { id: participacao.userId },
            data: { saldo: { increment: premioValor } },
          });

          await prisma.transacao.create({
            data: {
              valor: premioValor,
              tipo: "premio_dinheiro",
              descricao: `Prémio Euromilhões - Grelha #${grelha.numero}`,
              referencia: `SORTEIO-${id.slice(0, 8)}`,
              estado: "concluido",
              userId: participacao.userId,
            },
          });

          const jogo = await prisma.jogo.findUnique({
            where: { id: grelha.jogoId },
            select: { nome: true },
          });

          await prisma.notificacao.create({
            data: {
              tipo: TipoNotificacao.premio,
              titulo: "Parabéns! Ganhaste o Euromilhões!",
              mensagem: `Ganhaste ${premioValor}€ no ${jogo?.nome ?? "Euromilhões"} com o número sorteado ${String(grelha.numeroSorteado)}. O prémio já foi creditado na tua carteira.`,
              userId: participacao.userId,
            },
          });
        }
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
