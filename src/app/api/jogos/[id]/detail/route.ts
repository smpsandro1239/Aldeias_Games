import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const jogo = await prisma.jogo.findUnique({
      where: { id },
      include: {
        evento: {
          select: { id: true, nome: true, slug: true, estado: true, dataInicio: true, dataFim: true, aldeia: { select: { id: true, nome: true } } },
        },
        premios: { select: { id: true, nome: true, descricao: true, valorDinheiroAlternative: true, ordem: true } },
        _count: {
          select: {
            participacoes: { where: { estadoPagamento: 'concluido' } },
          },
        },
      },
    });

    if (!jogo) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    const [totalAngariado, ganhadores, premiosEntregues, pendentes] = await Promise.all([
      prisma.participacao.aggregate({
        where: { jogoId: id, estadoPagamento: 'concluido' },
        _sum: { valorPago: true },
      }),
      prisma.participacao.count({
        where: { jogoId: id, estadoPagamento: 'concluido', ganhador: true },
      }),
      prisma.participacao.count({
        where: { jogoId: id, estadoPagamento: 'concluido', ganhador: true, premioEntregue: true },
      }),
      prisma.participacao.count({
        where: { jogoId: id, estadoPagamento: 'pendente' },
      }),
    ]);

    let config = null;
    let poolRaw: unknown[] = [];
    try {
      const parsed = jogo.configuracao ? JSON.parse(jogo.configuracao) : null;
      // Nunca expor o pool (revelaria exatamente os prémios por sair)
      if (parsed) {
        if (Array.isArray(parsed.pool)) poolRaw = parsed.pool;
        const { pool, probabilidadeVitoria, odds, ...safe } = parsed;
        config = safe;
      }
    } catch {}

    // Métricas do pool de raspadinha (prémios restantes por sortear)
    let poolRestante: Array<{ nome: string; qtd: number }> = [];
    if (jogo.tipo === 'raspadinha' && poolRaw.length > 0) {
      const contagem = new Map<string, number>();
      for (const item of poolRaw) {
        contagem.set(String(item), (contagem.get(String(item)) || 0) + 1);
      }
      poolRestante = Array.from(contagem.entries())
        .map(([nome, qtd]) => ({ nome, qtd }))
        .sort((a, b) => b.qtd - a.qtd);
    }

    const vendidos = jogo.stockInicial - jogo.stockAtual;

    return NextResponse.json({
      ...jogo,
      configuracao: config,
      totalParticipacoes: jogo._count.participacoes,
      totalAngariado: totalAngariado._sum.valorPago || 0,
      stockAtual: jogo.stockAtual,
      stockInicial: jogo.stockInicial,
      vendidos,
      pendentes,
      ganhadores,
      premiosEntregues,
      premiosPendentes: ganhadores - premiosEntregues,
      poolRestante,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do jogo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
