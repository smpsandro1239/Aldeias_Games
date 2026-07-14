import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const aldeiaId = user.aldeiaId;
    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 400 });
    }

    // Buscar eventos dos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const eventos = await prisma.evento.findMany({
      where: {
        aldeiaId: aldeiaId,
        createdAt: { gte: sixMonthsAgo },
        isTemplate: false,
      },
      include: {
        jogos: {
          select: { totalAngariado: true, totalParticipacoes: true }
        }
      }
    });

    // Calcular médias
    const totalAngariado = eventos.reduce((sum: number, e: any) => sum + (e.totalAngariado || 0), 0);
    const totalParticipacoes = eventos.reduce((sum: number, e: any) => sum + (e.totalParticipacoes || 0), 0);
    const mediaPorEvento = eventos.length > 0 ? totalAngariado / eventos.length : 0;
    const mediaParticipacoes = eventos.length > 0 ? totalParticipacoes / eventos.length : 0;

    // Tendência mensal
    const meses: { [key: string]: number } = {};
    eventos.forEach((e: any) => {
      const mes = e.createdAt.toISOString().substring(0, 7);
      meses[mes] = (meses[mes] || 0) + (e.totalAngariado || 0);
    });

    const mesesOrdenados = Object.entries(meses).sort((a, b) => a[0].localeCompare(b[0]));
    let tendencia = 'estavel';
    if (mesesOrdenados.length >= 2) {
      const primeiro = mesesOrdenados[0][1];
      const ultimo = mesesOrdenados[mesesOrdenados.length - 1][1];
      if (ultimo > primeiro * 1.2) tendencia = 'crescente';
      else if (ultimo < primeiro * 0.8) tendencia = 'decrescente';
    }

    // Previsão para próximo mês (baseado na tendência)
    let previsaoProximoMes = mediaPorEvento;
    if (tendencia === 'crescente') {
      previsaoProximoMes *= 1.15;
    } else if (tendencia === 'decrescente') {
      previsaoProximoMes *= 0.85;
    }

    // Eventos ativos
    const eventosAtivos = await prisma.evento.count({
      where: { aldeiaId, estado: 'ativo' }
    });

    // Jogos ativos
    const jogosAtivos = await prisma.jogo.count({
      where: { aldeiaId, estado: 'aberto' }
    });

    // Vendedores activos
    const vendedoresAtivos = await prisma.user.count({
      where: { aldeiaId, role: 'vendedor' }
    });

    // Calcular probabilidade de atingir objetivo para eventos ativos
    const eventosComObjetivo = eventos.filter((e: any) => e.objectivoAngariacao && e.objectivoAngariacao > 0);
    const probabilidadeMedia = eventosComObjetivo.length > 0
      ? eventosComObjetivo.reduce((sum: number, e: any) => {
          const progresso = e.objectivoAngariacao ? (e.totalAngariado / e.objectivoAngariacao) * 100 : 0;
          return sum + Math.min(progresso, 100);
        }, 0) / eventosComObjetivo.length
      : 0;

    const analise = {
      resumo: {
        totalAngariado,
        totalEventos: eventos.length,
        mediaPorEvento: Math.round(mediaPorEvento),
        mediaParticipacoes: Math.round(mediaParticipacoes),
      },
      previsao: {
        proximoMes: Math.round(previsaoProximoMes),
        tendencia,
        probabilidadeObjetivo: Math.round(probabilidadeMedia),
      },
      indicadores: {
        eventosAtivos,
        jogosAtivos,
        vendedoresAtivos,
      },
      graficoMensal: mesesOrdenados.map(([mes, valor]) => ({ mes, valor })),
    };

    return NextResponse.json({ data: analise });
  } catch (error) {
    console.error('Erro na análise preditiva:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}