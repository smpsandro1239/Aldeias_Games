import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { logger } from '@/lib/logger';
import { getPaginationFromRequest, createPagination, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const searchParams = request.nextUrl.searchParams;
    const estado = searchParams.get('estado');
    const { page, limit } = getPaginationFromRequest(request);

    const where: Prisma.PedidoCarregamentoWhereInput = {};

    if (estado && estado !== 'todos') {
      where.estado = estado as any;
    }

    if (user.role === 'aldeia_admin' && user.aldeiaId) {
      where.aldeiaId = user.aldeiaId;
    }

    const { skip, take } = createPagination(page, limit);

    const [pedidos, total] = await Promise.all([
      prisma.pedidoCarregamento.findMany({
        where,
        include: {
          user: {
            select: { id: true, nome: true, email: true, telefone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.pedidoCarregamento.count({ where }),
    ]);

    const data = pedidos.map((p) => ({
      id: p.id,
      valor: p.valor,
      estado: p.estado,
      metodoPagamento: p.metodoPagamento || 'dinheiro',
      createdAt: p.createdAt,
      userId: p.userId,
      user: p.user,
      vendedorId: p.vendedorId || '',
      vendedor: null,
      confirmadosPorId: p.confirmadoPorId || '',
      confirmadosPor: null,
    }));

    return NextResponse.json(createPaginatedResponse(data, total, page, limit));
  } catch (error) {
    logger.error('Erro ao buscar pedidos de carregamento', { error });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}