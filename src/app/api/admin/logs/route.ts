import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 50;
    const page = Number(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    const isSuperAdmin = user.role === 'super_admin';

    const acessoWhere: Record<string, unknown> = {};
    const auditWhere: Record<string, unknown> = {};
    if (!isSuperAdmin && user.aldeiaId) {
      auditWhere.aldeiaId = user.aldeiaId;
    }

    const [logsAcesso, auditLogs, totalAcesso, totalAudit] = await Promise.all([
      prisma.logAcesso.findMany({
        where: acessoWhere,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nome: true, role: true } },
        },
      }),
      prisma.auditLog.findMany({
        where: auditWhere,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, nome: true, email: true, role: true } },
        },
      }),
      prisma.logAcesso.count({ where: acessoWhere }),
      prisma.auditLog.count({ where: auditWhere }),
    ]);

    const combined = [
      ...logsAcesso.map(log => ({
        tipo: 'acesso' as const,
        id: log.id,
        email: log.email,
        sucesso: log.sucesso,
        ip: log.ip,
        userAgent: log.userAgent,
        motivo: log.motivo,
        createdAt: log.createdAt,
        user: log.user,
      })),
      ...auditLogs.map(log => ({
        tipo: 'audit' as const,
        id: log.id,
        email: log.user?.email ?? '-',
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        ip: log.ip,
        userAgent: log.userAgent,
        metadata: log.metadata,
        sucesso: true,
        motivo: `${log.action} — ${log.resource || ''} ${log.resourceId || ''}`,
        createdAt: log.createdAt,
        user: log.user ? { nome: log.user.nome, role: log.user.role } : null,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      data: combined.slice(0, limit),
      pagination: {
        total: totalAcesso + totalAudit,
        page,
        limit,
        totalPages: Math.ceil((totalAcesso + totalAudit) / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao listar logs:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
