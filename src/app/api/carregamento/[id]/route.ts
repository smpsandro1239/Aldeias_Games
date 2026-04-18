import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || (user.role !== 'vendedor' && user.role !== 'aldeia_admin')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { pedidoId, password, acao } = body;

    if (!pedidoId) {
      return NextResponse.json({ error: 'ID do pedido requerido' }, { status: 400 });
    }

    // Find pedido
    const pedido = await prisma.pedidoCarregamento.findUnique({
      where: { id: pedidoId },
      include: { user: true }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Check if action is authorization
    if (acao === 'autorizar') {
      if (user.role !== 'aldeia_admin') {
        return NextResponse.json({ error: 'Apenas admin pode autorizar' }, { status: 403 });
      }

      // Check if it's already authorized
      if (pedido.autorizado) {
        return NextResponse.json({ error: 'Já autorizado' }, { status: 400 });
      }

      // Authorize the request
      const updated = await prisma.pedidoCarregamento.update({
        where: { id: pedidoId },
        data: {
          autorizado: true,
          autorizadoPorId: user.id,
          autorizadoAt: new Date(),
          estado: 'pendente', // Now can be processed
        }
      });

      // TODO: Notify user

      return NextResponse.json({ success: true, message: 'Autorizado com sucesso' });
    }

    // Check password for confirmation
    if (!password) {
      return NextResponse.json({ error: 'Password requerida' }, { status: 400 });
    }

    // Verify password and expiry
    if (pedido.passwordOneTime !== password) {
      return NextResponse.json({ error: 'Password incorreta' }, { status: 400 });
    }

    if (pedido.estado === 'expirado' || (pedido.expiresAt && new Date() > pedido.expiresAt)) {
      await prisma.pedidoCarregamento.update({
        where: { id: pedidoId },
        data: { estado: 'expirado' }
      });
      return NextResponse.json({ error: 'Pedido expirado' }, { status: 400 });
    }

    // Check if needs authorization
    if (pedido.requerAutorizacao && !pedido.autorizado) {
      return NextResponse.json({ 
        error: 'Este carregamento requer autorização do administrador',
        requiresAuthorization: true 
      }, { status: 403 });
    }

    // Confirm payment received
    const updated = await prisma.pedidoCarregamento.update({
      where: { id: pedidoId },
      data: {
        vendedorId: user.id,
        pagamentoConfirmado: true,
        estado: 'confirmado',
        confirmadoPorId: user.id,
        confirmadoAt: new Date(),
        notificadoVendedor: true,
      }
    });

    // Update user saldo
    await prisma.user.update({
      where: { id: pedido.userId },
      data: {
        saldo: { increment: pedido.valor }
      }
    });

    // Create notification for user
    await prisma.pedidoNotificacao.create({
      data: {
        tipo: 'push',
        destinatario: pedido.user.email,
        assunto: 'Saldo Carregado',
        mensagem: `O teu saldo foi carregado com ${pedido.valor}€. Novo saldo disponível.`,
      }
    });

    // TODO: Send email/push notifications

    return NextResponse.json({
      success: true,
      message: 'Carregamento confirmado',
      novoSaldo: pedido.valor
    });

  } catch (error) {
    console.error('Error confirming carregamento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}