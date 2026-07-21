import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requireAnyOfPermissions } from '@/lib/rbac/checkPermission';
import { getPaginationFromRequest, createPagination, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const isPrivileged = user.role === 'super_admin' || user.role === 'aldeia_admin';
    if (!isPrivileged) {
      const denied = await requireAnyOfPermissions(user.id, ['EXECUTE_VENDA', 'MANAGE_ALDEIA']);
      if (denied) return denied;
    }

    const { page, limit } = getPaginationFromRequest(request);
    const { skip, take } = createPagination(page, limit);

    let cashbox = await prisma.vendedorCashbox.findUnique({
      where: { userId: user.id },
      select: { saldo: true }
    });

    if (!cashbox) {
      cashbox = await prisma.vendedorCashbox.create({
        data: { userId: user.id, saldo: 0 },
        select: { saldo: true }
      });
    }

    const [transacoes, total] = await Promise.all([
      prisma.vendedorCashboxTransacao.findMany({
        where: { cashbox: { userId: user.id } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.vendedorCashboxTransacao.count({ where: { cashbox: { userId: user.id } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        saldo: cashbox.saldo,
        transacoes: createPaginatedResponse(transacoes, total, page, limit),
      },
    });
  } catch (error) {
    console.error('Error fetching cashbox:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
