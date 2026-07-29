import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

/**
 * GET /api/analytics/dashboard
 * Retorna métricas agregadas para o dashboard admin.
 * Params: ?periodo=7d|30d|90d&aldeiaId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const url = new URL(request.url);
    const periodo = url.searchParams.get('periodo') || '30d';
    const aldeiaIdParam = url.searchParams.get('aldeiaId');

    const dias = periodo === '7d' ? 7 : periodo === '90d' ? 90 : 30;
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);

    const aldeiaFilter = user.role === 'aldeia_admin'
      ? { evento: { aldeiaId: user.aldeiaId } }
      : aldeiaIdParam
        ? { evento: { aldeiaId: aldeiaIdParam } }
        : {};

    const [
      totalJogos,
      jogosAtivos,
      totalParticipacoes,
      receitaTotal,
      participacoesPorDia,
      jogosPorTipo,
      topJogos,
      estadoPagamentos,
    ] = await Promise.all([
      any.count({ where: aldeiaFilter }),
      any.count({ where: { ...aldeiaFilter, estado: 'aberto' } }),
      any.count({
        where: {
          ...aldeiaFilter,
          createdAt: { gte: desde },
        },
      }),
      any.aggregate({
        where: {
          ...aldeiaFilter,
          estadoPagamento: 'concluido',
          createdAt: { gte: desde },
        },
        _sum: { valorPago: true },
      }),
      prisma.$queryRaw<{ data: string; count: bigint }[]>`
        SELECT DATE("createdAt") as data, COUNT(*) as count
        FROM participacoes
        WHERE "createdAt" >= ${desde}
        GROUP BY DATE("createdAt")
        ORDER BY data DESC
      `,
      any.groupBy({
        by: ['tipo'],
        _count: { id: true },
        where: aldeiaFilter,
      }),
      any.findMany({
        where: aldeiaFilter,
        select: {
          id: true,
          nome: true,
          tipo: true,
          totalParticipacoes: true,
          totalAngariado: true,
          estado: true,
        },
        orderBy: { totalParticipacoes: 'desc' },
        take: 5,
      }),
      any.groupBy({
        by: ['estadoPagamento'],
        _count: { id: true },
        _sum: { valorPago: true },
        where: {
          ...aldeiaFilter,
          createdAt: { gte: desde },
        },
      }),
    ]);

    return NextResponse.json({
      periodo,
      desde: desde.toISOString(),
      resumo: {
        totalJogos,
        jogosAtivos,
        totalParticipacoes,
        receitaTotal: receitaTotal._sum.valorPago || 0,
      },
      participacoesPorDia: participacoesPorDia.map((p: { data: string; count: bigint }) => ({
        data: p.data,
        count: Number(p.count),
      })),
      jogosPorTipo: jogosPorTipo.map((j: { tipo: string | null; _count: { id: number } }) => ({
        tipo: j.tipo,
        count: j._count.id,
      })),
      topJogos: topJogos.map((j: { id: string; nome: string; tipo: string; totalParticipacoes: number; totalAngariado: number; estado: string }) => ({
        id: j.id,
        nome: j.nome,
        tipo: j.tipo,
        participacoes: j.totalParticipacoes,
        angariado: j.totalAngariado,
        estado: j.estado,
      })),
      pagamentos: estadoPagamentos.map((p: { estadoPagamento: string | null; _count: { id: number }; _sum: { valorPago: number | null } }) => ({
        estado: p.estadoPagamento,
        count: p._count.id,
        total: p._sum.valorPago || 0,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
