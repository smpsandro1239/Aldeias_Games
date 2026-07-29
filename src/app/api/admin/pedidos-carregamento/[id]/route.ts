import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{id: string}> }
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

    if (pedido.estado !== 'pendente') {
      return NextResponse.json({ error: 'Pedido já processado' }, { status: 400 });
    }

    // Confirmar pedido
    const updatedPedido = await prisma.pedidoCarregamento.update({
      where: { id },
      data: {
        estado: 'confirmado',
        pagamentoConfirmado: true,
        confirmadoPorId: user.id,
        confirmadoAt: new Date(),
      },
    });

    // Se for confirmação, adicionar saldo ao utilizador
    if (request.nextUrl.pathname.endsWith('/confirmar')) {
      // Adicionar saldo ao utilizador
      await prisma.user.update({
        where: { id: pedido.id },
        data: {
          saldo: {
            increment: pedido.valor,
          },
        },
      });

      // Criar transação
      await prisma.transacao.create({
        data: {
          userId: pedido.id,
          valor: pedido.valor,
          tipo: 'carregamento_saldo',
          descricao: `Carregamento confirmado - ${pedido.metodoPagamento || 'dinheiro'}`,
          estado: 'concluido',
          metodoPagamento: pedido.metodoPagamento || 'dinheiro',
        },
      });

      // Notificar utilizador (opcional - pode ser implementado depois)
      logger.info('Carregamento confirmado', {
        pedidoId: id,
        userId: pedido.id,
        valor: pedido.valor,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Pedido confirmado com sucesso',
      data: updatedPedido,
    });
  } catch (error) {
    logger.error('Erro ao confirmar pedido', { error });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}