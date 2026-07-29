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
          select: { id: true, nome: true, slug: true, aldeia: { select: { id: true, nome: true } } },
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

    const totalAngariado = await prisma.participacao.aggregate({
      where: { jogoId: id, estadoPagamento: 'concluido' },
      _sum: { valorPago: true },
    });

    let config = null;
    try {
      config = jogo.configuracao ? JSON.parse(jogo.configuracao) : null;
    } catch {}

    return NextResponse.json({
      ...jogo,
      configuracao: config,
      totalParticipacoes: jogo._count.participacoes,
      totalAngariado: totalAngariado._sum.valorPago || 0,
      stockAtual: jogo.stockAtual,
      stockInicial: jogo.stockInicial,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do jogo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
