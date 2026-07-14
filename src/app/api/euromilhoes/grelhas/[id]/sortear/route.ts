import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
// @ts-ignore - @prisma/client types generated at build time
import { TipoNotificacao } from "@prisma/client";
import { getOfficialTime } from "@/lib/time";
import { getLatestFirstNumber } from "@/lib/euromillions-api";
import { getFullUserFromRequest, hasRole } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ["aldeia_admin", "super_admin"])) {
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

    // Tentar obter número da API; se falhar, usar body.manualNumber
    const body = await request.json().catch(() => ({}));
    let numeroSorteado: number;
    let fonteResultado: string;

    const apiResult = await getLatestFirstNumber();
    if (apiResult.numero !== null && apiResult.numero >= 1 && apiResult.numero <= 50) {
      numeroSorteado = apiResult.numero;
      fonteResultado = "api";

      // Só verificar hora oficial se for sorteio via API
      const horaOficial = await getOfficialTime();
      if (grelha.sorteioData && horaOficial < grelha.sorteioData) {
        return NextResponse.json(
          { error: `O sorteio oficial ainda não ocorreu. Sorteio marcado para ${grelha.sorteioData.toISOString()}.` },
          { status: 400 }
        );
      }
    } else if (typeof body.numeroManual === "number" && body.numeroManual >= 1 && body.numeroManual <= 50) {
      numeroSorteado = body.numeroManual;
      fonteResultado = "manual";
    } else {
      return NextResponse.json(
        { error: "Não foi possível obter o número do sorteio. Tente novamente mais tarde ou insira manualmente." },
        { status: 503 }
      );
    }

    const isVendido = numerosOcupados.includes(numeroSorteado);

    let vencedorId: string | null = null;

    if (isVendido) {
      // Fetch all participations for this grelha and filter in code to avoid
      // false matches with Prisma's string `contains` (e.g. "1" matching "10")
      const allParticipacoes = await prisma.participacao.findMany({
        where: { grelhaId: grelha.id },
        orderBy: { createdAt: "asc" },
      });

      const participacao = allParticipacoes.find((p: any) => {
        try {
          const numeros: number[] = JSON.parse(p.numerosSelecionados || "[]");
          return numeros.includes(numeroSorteado);
        } catch {
          return false;
        }
      });

      if (participacao) {
        vencedorId = participacao.userId;

        await prisma.participacao.update({
          where: { id: participacao.id },
          data: { ganhador: true },
        });

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
              mensagem: `Ganhaste ${premioValor}€ no ${jogo?.nome ?? "Euromilhões"} com o número sorteado ${numeroSorteado}. O prémio já foi creditado na tua carteira.`,
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
        fonteResultado,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      sorteio: {
        numeroSorteado,
        isVendido,
        vencedorId,
        fonte: fonteResultado,
      },
    });
  } catch (error: any) {
    console.error("Error drawing grelha:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
