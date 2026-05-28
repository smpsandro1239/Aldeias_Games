import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{id: string}> }
) {
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
        confirmadoPorId: payload.userId,
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