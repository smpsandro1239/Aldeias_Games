import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';

// GET - Listar logs de auditoria (apenas Super Admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin'])) {
      return NextResponse.json({ error: 'Apenas Super Admin pode aceder aos logs de auditoria' }, { status: 403 });
    }

    const { page, limit } = getPaginationFromRequest(request);
    const url = new URL(request.url);
    const tipo = url.searchParams.get('tipo'); // 'acesso', 'transacao', 'todos'
    const userId = url.searchParams.get('userId');
    const dataInicio = url.searchParams.get('dataInicio');
    const dataFim = url.searchParams.get('dataFim');

    const dateFilter: Record<string, unknown> = {};
    if (dataInicio) dateFilter.gte = new Date(dataInicio);
    if (dataFim) dateFilter.lte = new Date(dataFim);

    // Logs de acesso
    const logsAcessoWhere: Record<string, unknown> = {};
    if (userId) logsAcessoWhere.id = userId;
    if (dataInicio || dataFim) logsAcessoWhere.createdAt = dateFilter;

    // Transações com audit trail (ajustes de saldo)
    const transacoesWhere: Record<string, unknown> = {
      tipo: { in: ['deposito', 'levantamento', 'cashback'] },
    };
    if (userId) transacoesWhere.id = userId;
    if (dataInicio || dataFim) transacoesWhere.createdAt = dateFilter;

    const [logsAcesso, transacoesAudit, totalLogs] = await Promise.all([
      prisma.logAcesso.findMany({
        where: logsAcessoWhere,
        include: {
          user: {
            select: { id: true, nome: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transacao.findMany({
        where: transacoesWhere,
        include: {
          user: {
            select: { id: true, nome: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.logAcesso.count({ where: logsAcessoWhere }),
    ]);

    // Combinar e ordenar logs
    const allLogs = [
      ...logsAcesso.map((log: any) => ({
        tipo: 'acesso',
        id: log.id,
        timestamp: log.createdAt,
        sucesso: log.sucesso,
        email: log.email,
        ip: log.ip,
        userAgent: log.userAgent,
        motivo: log.motivo,
        user: log.user,
      })),
      ...transacoesAudit.map((t: any) => ({
        tipo: 'transacao',
        id: t.id,
        timestamp: t.createdAt,
        valor: t.valor,
        tipoTransacao: t.tipo,
        descricao: t.descricao,
        referencia: t.referencia,
        auditTrail: t.dadosAdicionais,
        user: t.user,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      data: allLogs.slice(0, limit),
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao obter audit logs:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
