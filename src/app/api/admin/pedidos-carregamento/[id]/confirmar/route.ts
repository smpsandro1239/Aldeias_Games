import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const { id } = await context.params;

    // Buscar pedido
    const pedido = await prisma.pedidoCarregamento.findUnique({
      where: { id },
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // HIGH #8: aldeia_admin só pode confirmar pedidos da sua própria aldeia
    if (user.role === 'aldeia_admin' && pedido.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: 'Sem permissão para confirmar pedidos de outra aldeia' }, { status: 403 });
    }

    if (pedido.estado !== 'pendente') {
      return NextResponse.json({ error: 'Pedido já processado' }, { status: 400 });
    }

    // Confirmar pedido
    await prisma.pedidoCarregamento.update({
      where: { id },
      data: {
        estado: 'confirmado',
        pagamentoConfirmado: true,
        confirmadoPorId: user.id,
        confirmadoAt: new Date(),
      },
    });

    // Adicionar saldo ao utilizador (CORREÇÃO: usar pedido.userId, não pedido.id)
    await prisma.user.update({
      where: { id: pedido.userId },
      data: {
        saldo: {
          increment: pedido.valor,
        },
      },
    });

    // Criar transação (CORREÇÃO: usar pedido.userId, não pedido.id)
    await prisma.transacao.create({
      data: {
        userId: pedido.userId,
        valor: pedido.valor,
        tipo: 'carregamento_saldo',
        descricao: `Carregamento confirmado - ${pedido.metodoPagamento || 'dinheiro'}`,
        estado: 'concluido',
        metodoPagamento: pedido.metodoPagamento || 'dinheiro',
      },
    });

    logger.info('Carregamento confirmado', {
      pedidoId: id,
      userId: pedido.userId,
      valor: pedido.valor,
      confirmadoPor: user.id,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Pedido confirmado com sucesso',
    });
  } catch (error) {
    logger.error('Erro ao confirmar pedido', { error });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}