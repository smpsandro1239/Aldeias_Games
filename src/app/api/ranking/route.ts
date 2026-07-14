import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aldeiaId = searchParams.get('aldeiaId');
    const tipo = searchParams.get('tipo') || 'all'; // all, vendas, jogos, premios
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    let rankings: any[] = [];

    if (tipo === 'vendas' || tipo === 'all') {
      // Ranking de vendedores por vendas
      const vendedores = await prisma.user.findMany({
        where: {
          role: 'vendedor',
          ...(aldeiaId ? { aldeiaId } : {}),
        },
        select: {
          id: true,
          nome: true,
          aldeia: { select: { nome: true } },
          _count: { select: { transacoes: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const vendasData = await prisma.transacao.groupBy({
        by: ['userId'],
        where: {
          userId: { in: vendedores.map((v: any) => v.id) },
          tipo: { in: ['venda', 'pagamento'] as any },
        },
        _sum: { valor: true },
        _count: { id: true },
      });

      const rankingVendas = vendedores.map((v: any) => {
        const venda = vendasData.find((vd: any) => vd.userId === v.id);
        return {
          tipo: 'vendas',
          userId: v.id,
          nome: v.nome,
          aldeia: v.aldeia?.nome,
          totalVendas: venda?._sum?.valor || 0,
          numTransacoes: venda?._count?.id || 0,
        };
      }).sort((a: any, b: any) => b.totalVendas - a.totalVendas);

      rankings = [...rankings, ...rankingVendas];
    }

    if (tipo === 'jogos' || tipo === 'all') {
      // Ranking de jogadores por participações
      const jogadores = await prisma.user.findMany({
        where: {
          role: 'user',
          ...(aldeiaId ? { aldeiaId } : {}),
        },
        select: {
          id: true,
          nome: true,
          aldeia: { select: { nome: true } },
        },
        take: 100,
      });

      const participacoesData = await prisma.participacao.groupBy({
        by: ['userId'],
        where: {
          userId: { in: jogadores.map((j: any) => j.id) },
        },
        _count: { id: true },
        _sum: { valorPago: true },
      });

      const rankingJogos = jogadores.map((j: any) => {
        const part = participacoesData.find((p: any) => p.userId === j.id);
        return {
          tipo: 'jogos',
          userId: j.id,
          nome: j.nome,
          aldeia: j.aldeia?.nome,
          totalJogos: part?._count?.id || 0,
          totalGasto: part?._sum?.valorPago || 0,
        };
      }).sort((a: any, b: any) => b.totalJogos - a.totalJogos);

      rankings = [...rankings, ...rankingJogos];
    }

    if (tipo === 'premios' || tipo === 'all') {
      // Ranking de jogadores por prémios ganhos
      const jogadores = await prisma.user.findMany({
        where: {
          role: 'user',
          ...(aldeiaId ? { aldeiaId } : {}),
        },
        select: {
          id: true,
          nome: true,
          aldeia: { select: { nome: true } },
        },
        take: 100,
      });

      const premiosData = await prisma.participacao.groupBy({
        by: ['userId'],
        where: {
          userId: { in: jogadores.map((j: any) => j.id) },
          ganhador: true,
        },
        _count: { id: true },
        _sum: { valorPago: true },
      });

      const rankingPremios = jogadores.map((j: any) => {
        const prem = premiosData.find((p: any) => p.userId === j.id);
        return {
          tipo: 'premios',
          userId: j.id,
          nome: j.nome,
          aldeia: j.aldeia?.nome,
          totalPremios: prem?._count?.id || 0,
          totalGanho: prem?._sum?.valorPago || 0,
        };
      }).sort((a: any, b: any) => b.totalPremios - a.totalPremios);

      rankings = [...rankings, ...rankingPremios];
    }

    // Aplicar paginação
    const total = rankings.length;
    rankings = rankings.slice(offset, offset + limit);

    // Adicionar posição (ajustada para offset)
    rankings = rankings.map((r, i) => ({ ...r, posicao: offset + i + 1 }));

    return NextResponse.json({ data: rankings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Erro ao buscar rankings:', error);
    // Retorna ranking vazio em caso de erro para não quebrar frontend
    return NextResponse.json({ data: [], total: 0, page: 1, totalPages: 0 });
  }
}
