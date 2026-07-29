import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { getPaginationFromRequest, createPagination, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId') || user.aldeiaId;
    const { page, limit } = getPaginationFromRequest(request);

    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 400 });
    }

    const { skip, take } = createPagination(page, limit);

    const vault = await prisma.vault.findUnique({
      where: { aldeiaId },
      select: { saldo: true }
    });

    const [transacoes, total] = await Promise.all([
      prisma.vaultTransaction.findMany({
        where: { vault: { aldeiaId } },
        include: {
          criadoPor: { select: { id: true, nome: true, email: true } },
          aprovadoPor: { select: { id: true, nome: true } },
        },
        orderBy: { dataCriacao: 'desc' },
        skip,
        take,
      }),
      prisma.vaultTransaction.count({ where: { vault: { aldeiaId } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: vault || { saldo: 0 },
      transacoes: createPaginatedResponse(transacoes, total, page, limit),
    });
  } catch (error) {
    console.error('Error fetching vault history:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
