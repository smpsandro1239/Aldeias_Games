import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar se é admin
    if (payload.role !== 'super_admin' && payload.role !== 'aldeia_admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const estado = searchParams.get('estado');

    // Construir filtro
    const where: any = {};
    
    if (estado && estado !== 'todos') {
      where.estado = estado;
    }

    // Buscar pedidos do admin (aldeia) ou todos (super_admin)
    if (payload.role === 'aldeia_admin' && payload.aldeiaId) {
      where.aldeiaId = payload.aldeiaId;
    }

    // Buscar pedidos
    const pedidos = await prisma.pedidoCarregamento.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Mapear dados
    const data = pedidos.map((p: any) => ({
      id: p.id,
      valor: p.valor,
      estado: p.estado,
      metodoPagamento: p.metodoPagamento || 'dinheiro',
      createdAt: p.createdAt,
      userId: p.id,
      user: p.user,
      vendedorId: p.vendedorId || '',
      vendedor: null,
      confirmadosPorId: p.confirmadoPorId || '',
      confirmadosPor: null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Erro ao buscar pedidos de carregamento', { error });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}