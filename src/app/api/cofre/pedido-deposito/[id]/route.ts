import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requireAnyOfPermissions } from '@/lib/rbac/checkPermission';
import { logAudit } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // RBAC: cofre requires MANAGE_ALDEIA or VIEW_ALDEIA (admin roles)
    const denied = await requireAnyOfPermissions(user.id, ['MANAGE_ALDEIA', 'VIEW_ALDEIA']);
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();
    const { acao, observacoes } = body;

    const pedido = await any.findUnique({
      where: { id },
      include: { vendedor: true }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (pedido.estado !== 'pendente') {
      return NextResponse.json({ error: 'Pedido já foi processado' }, { status: 400 });
    }

    if (acao === 'confirmar') {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.pedidoDepositoCofre.update({
          where: { id },
          data: {
            estado: 'confirmado',
            confirmadoPorId: user.id,
            confirmadoAt: new Date(),
            observacoes: observacoes || null,
          }
        });

        const cashbox = await tx.vendedorCashbox.findUnique({
          where: { userId: pedido.vendedorId }
        });

        if (!cashbox || cashbox.saldo < pedido.valor) {
          throw new Error('Saldo insuficiente na caixa do vendedor');
        }

        await tx.vendedorCashbox.update({
          where: { userId: pedido.vendedorId },
          data: { saldo: { decrement: pedido.valor } }
        });

        await tx.vendedorCashboxTransaction.create({
          data: {
            cashboxId: cashbox.id,
            tipo: 'DEPOSITADO_NO_COFRE',
            valor: pedido.valor,
            descricao: `Depósito no cofre: ${pedido.descricao || `${pedido.valor}€`}`,
            referencia: pedido.id,
            criadoPorId: user.id,
          }
        });

        const vault = await tx.vault.upsert({
          where: { aldeiaId: pedido.aldeiaId },
          create: { aldeiaId: pedido.aldeiaId, saldo: pedido.valor },
          update: { saldo: { increment: pedido.valor } }
        });

        await tx.vaultTransaction.create({
          data: {
            vaultId: vault.id,
            tipo: 'deposito',
            valor: pedido.valor,
            descricao: `Depósito de ${pedido.vendedor.nome}: ${pedido.descricao || `${pedido.valor}€`}`,
            referencia: pedido.id,
            estado: 'confirmado',
            criadoPorId: pedido.vendedorId,
            aprovadoPorId: user.id,
            dataAprovacao: new Date(),
          }
        });
      });

      // Notify seller
      await any.create({
        data: {
          userId: pedido.vendedorId,
          tipo: 'deposito_confirmado',
          titulo: 'Depósito confirmado',
          mensagem: `O teu depósito de ${pedido.valor}€ foi confirmado por ${user.nome}`,
          lida: false,
        },
      });

      // Log audit
      const ipConfirm = request.headers.get('x-forwarded-for') || undefined;
      const uaConfirm = request.headers.get('user-agent') || undefined;
      logAudit({
        userId: user.id,
        aldeiaId: pedido.aldeiaId,
        action: 'deposito.confirmado',
        resource: 'pedido-deposito',
        resourceId: pedido.id,
        metadata: { valor: pedido.valor, vendedorId: pedido.vendedorId, vendedorNome: pedido.vendedor.nome },
        ip: ipConfirm,
        userAgent: uaConfirm,
      });

      return NextResponse.json({ success: true, message: 'Depósito confirmado' });
    }

    if (acao === 'rejeitar') {
      await any.update({
        where: { id },
        data: {
          estado: 'rejeitado',
          rejeitadoPorId: user.id,
          motivoRejeicao: observacoes || 'Rejeitado',
        }
      });

      // Notify seller
      await any.create({
        data: {
          userId: pedido.vendedorId,
          tipo: 'deposito_rejeitado',
          titulo: 'Depósito rejeitado',
          mensagem: `O teu depósito de ${pedido.valor}€ foi rejeitado${observacoes ? `: ${observacoes}` : ''}`,
          lida: false,
        },
      });

      // Log audit
      const ipReject = request.headers.get('x-forwarded-for') || undefined;
      const uaReject = request.headers.get('user-agent') || undefined;
      logAudit({
        userId: user.id,
        aldeiaId: pedido.aldeiaId,
        action: 'deposito.rejeitado',
        resource: 'pedido-deposito',
        resourceId: pedido.id,
        metadata: { valor: pedido.valor, vendedorId: pedido.vendedorId, motivo: observacoes || null },
        ip: ipReject,
        userAgent: uaReject,
      });

      return NextResponse.json({ success: true, message: 'Depósito rejeitado' });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Error processing deposit request:', error);
    return NextResponse.json({
      error: error.message || 'Erro interno'
    }, { status: 500 });
  }
}
