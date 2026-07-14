import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { page, limit } = getPaginationFromRequest(request);
    const url = new URL(request.url);
    const tipo = url.searchParams.get('tipo'); // 'acesso' | 'audit' | 'todos'
    const userId = url.searchParams.get('userId');
    const action = url.searchParams.get('action');
    const dataInicio = url.searchParams.get('dataInicio');
    const dataFim = url.searchParams.get('dataFim');

    const dateFilter: Record<string, unknown> = {};
    if (dataInicio) dateFilter.gte = new Date(dataInicio);
    if (dataFim) dateFilter.lte = new Date(dataFim);

    const isSuperAdmin = user.role === 'super_admin';

    // AuditLog query
    const auditWhere: Record<string, unknown> = {};
    if (!isSuperAdmin && user.aldeiaId) auditWhere.aldeiaId = user.aldeiaId;
    if (userId) auditWhere.userId = userId;
    if (action) auditWhere.action = action;
    if (dataInicio || dataFim) auditWhere.createdAt = dateFilter;

    // LogAcesso query
    const acessoWhere: Record<string, unknown> = {};
    if (userId) acessoWhere.userId = userId;
    if (dataInicio || dataFim) acessoWhere.createdAt = dateFilter;

    const [auditLogs, logsAcesso, totalAudit, totalAcesso] = await Promise.all([
      prisma.auditLog.findMany({
        where: auditWhere,
        include: {
          user: { select: { id: true, nome: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.logAcesso.findMany({
        where: acessoWhere,
        include: {
          user: { select: { id: true, nome: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where: auditWhere }),
      prisma.logAcesso.count({ where: acessoWhere }),
    ]);

    const allLogs = [
      ...auditLogs.map((log: any) => ({
        tipo: 'audit' as const,
        id: log.id,
        timestamp: log.createdAt,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        ip: log.ip,
        userAgent: log.userAgent,
        metadata: log.metadata,
        user: log.user,
      })),
      ...logsAcesso.map((log: any) => ({
        tipo: 'acesso' as const,
        id: log.id,
        timestamp: log.createdAt,
        sucesso: log.sucesso,
        email: log.email,
        ip: log.ip,
        userAgent: log.userAgent,
        motivo: log.motivo,
        user: log.user,
      })),
    ].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const filtered = tipo === 'audit'
      ? allLogs.filter((l: any) => l.tipo === 'audit')
      : tipo === 'acesso'
      ? allLogs.filter((l: any) => l.tipo === 'acesso')
      : allLogs;
    const total = tipo === 'audit' ? totalAudit : tipo === 'acesso' ? totalAcesso : totalAudit + totalAcesso;

    return NextResponse.json({
      success: true,
      data: filtered.slice(0, limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao obter audit logs:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
