import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { executeWithRetry } from '@/lib/transaction-retry';
import { aldeiaScopeDenied } from '@/lib/rbac/aldeia-scope';
import { processarPedidoDepositoCofre } from '@/lib/cofre-deposit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { acao, observacoes } = body ?? {};
    if (!['confirmar', 'rejeitar'].includes(acao)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }
    if (observacoes !== undefined && observacoes !== null &&
      (typeof observacoes !== 'string' || observacoes.length > 500)) {
      return NextResponse.json({ error: 'Observações inválidas (máximo 500 caracteres)' }, { status: 400 });
    }

    const pedido = await prisma.pedidoDepositoCofre.findUnique({
      where: { id },
      select: {
        id: true,
        vendedorId: true,
        aldeiaId: true,
        valor: true,
        estado: true,
        descricao: true,
        vendedor: { select: { nome: true } },
      },
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const scopeDenied = aldeiaScopeDenied(user, pedido.aldeiaId);
    if (scopeDenied) return scopeDenied;

    if (pedido.estado !== 'pendente') {
      return NextResponse.json({ error: 'Pedido já foi processado' }, { status: 409 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const resultado = await executeWithRetry(() =>
      prisma.$transaction((tx: Prisma.TransactionClient) =>
        processarPedidoDepositoCofre(tx, {
          pedidoId: id,
          acao,
          observacoes: typeof observacoes === 'string' ? observacoes.trim() : undefined,
          actorUserId: user.id,
          aldeiaId: pedido.aldeiaId,
          ip,
          userAgent,
        })
      )
    );

    try {
      if (acao === 'confirmar') {
        await prisma.notificacao.create({
          data: {
            userId: pedido.vendedorId,
            tipo: 'deposito_confirmado',
            titulo: 'Depósito confirmado',
            mensagem: `O teu depósito de ${pedido.valor}€ foi confirmado por ${user.nome}`,
            lida: false,
          },
        });
      } else {
        await prisma.notificacao.create({
          data: {
            userId: pedido.vendedorId,
            tipo: 'deposito_rejeitado',
            titulo: 'Depósito rejeitado',
            mensagem: `O teu depósito de ${pedido.valor}€ foi rejeitado${observacoes ? `: ${observacoes}` : ''}`,
            lida: false,
          },
        });
      }
    } catch (notificationError) {
      console.error('Falha ao notificar vendedor sobre depósito:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: acao === 'confirmar' ? 'Depósito confirmado' : 'Depósito rejeitado',
      data: resultado,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'DEPOSITO_JA_PROCESSADO') {
      return NextResponse.json({ error: 'Pedido já foi processado' }, { status: 409 });
    }
    if (message === 'SALDO_INSUFICIENTE_CAIXA') {
      return NextResponse.json({ error: 'Saldo insuficiente na caixa do vendedor' }, { status: 400 });
    }
    console.error('Erro ao processar pedido de depósito:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
