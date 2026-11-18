import { Prisma } from '@prisma/client';

interface SolicitarEntregaSaldoInput {
  vendedorId: string;
  aldeiaId: string;
  valor: number;
  observacoes?: string | null;
  actorUserId: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Reserva saldo entregável e cria o pedido atomicamente.
 *
 * A atualização de updatedAt do vendedor adquire um bloqueio de escrita
 * por vendedor antes de calcular os montantes. Em PostgreSQL, o bloqueio
 * da linha serializa pedidos concorrentes; em SQLite, serializa escritores.
 * A consulta seguinte passa a observar as reservas confirmadas pela
 * transação anterior.
 */
export async function solicitarEntregaSaldo(
  tx: Prisma.TransactionClient,
  input: SolicitarEntregaSaldoInput
) {
  if (!Number.isFinite(input.valor) || input.valor <= 0 || Math.abs(input.valor * 100 - Math.round(input.valor * 100)) > 1e-8) {
    throw new Error('VALOR_ENTREGA_INVALIDO');
  }

  const now = new Date();
  const vendedor = await tx.user.updateMany({
    where: {
      id: input.vendedorId,
      aldeiaId: input.aldeiaId,
      role: 'vendedor',
    },
    data: { updatedAt: now },
  });

  if (vendedor.count !== 1) {
    throw new Error('VENDEDOR_NAO_ELEGIVEL');
  }

  const [angariado, reservado] = await Promise.all([
    tx.pedidoCarregamento.aggregate({
      where: { vendedorId: input.vendedorId, estado: 'confirmado' },
      _sum: { valor: true },
    }),
    tx.entregaSaldo.aggregate({
      where: {
        vendedorId: input.vendedorId,
        estado: { in: ['solicitado', 'confirmado', 'concluido'] },
      },
      _sum: { valor: true },
    }),
  ]);

  const totalAngariado = angariado._sum.valor ?? 0;
  const totalReservado = reservado._sum.valor ?? 0;
  const disponivelCentimos = Math.max(
    0,
    Math.round((totalAngariado - totalReservado) * 100)
  );
  const valorCentimos = Math.round(input.valor * 100);

  if (valorCentimos <= 0 || valorCentimos > disponivelCentimos) {
    throw new Error('SALDO_A_ENTREGAR_INSUFICIENTE');
  }

  const admin = await tx.user.findFirst({
    where: { aldeiaId: input.aldeiaId, role: 'aldeia_admin' },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!admin) {
    throw new Error('ADMIN_ALDEIA_NAO_ENCONTRADO');
  }

  const entrega = await tx.entregaSaldo.create({
    data: {
      vendedorId: input.vendedorId,
      adminId: admin.id,
      aldeiaId: input.aldeiaId,
      valor: valorCentimos / 100,
      estado: 'solicitado',
      observacoes: input.observacoes?.trim() || null,
    },
    include: {
      vendedor: { select: { id: true, nome: true, email: true, telefone: true } },
      admin: { select: { id: true, nome: true, email: true, telefone: true } },
    },
  });

  await tx.auditLog.create({
    data: {
      userId: input.actorUserId,
      aldeiaId: input.aldeiaId,
      action: 'entrega_saldo.solicitar',
      resource: 'entrega_saldo',
      resourceId: entrega.id,
      ip: input.ip,
      userAgent: input.userAgent?.slice(0, 500),
      metadata: {
        valor: entrega.valor,
        saldoDisponivelAntes: disponivelCentimos / 100,
      },
    },
  });

  return entrega;
}
