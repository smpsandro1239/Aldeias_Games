import { Prisma } from '@prisma/client';

type DepositoAction = 'confirmar' | 'rejeitar';

interface DepositoContext {
  actorUserId: string;
  aldeiaId: string;
  ip?: string;
  userAgent?: string;
}

interface CriarDepositoInput extends DepositoContext {
  vendedorId: string;
  valor: number;
  descricao?: string;
  referencias?: Record<string, string>;
  isAdmin: boolean;
}

interface ProcessarDepositoInput extends DepositoContext {
  pedidoId: string;
  acao: DepositoAction;
  observacoes?: string;
}

function validarValor(valor: number): void {
  if (
    !Number.isFinite(valor) ||
    valor <= 0 ||
    Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-8
  ) {
    throw new Error('VALOR_DEPOSITO_INVALIDO');
  }
}

/**
 * Cria um pedido de depósito. Para vendedores, serializa as reservas
 * na linha da caixa e considera todos os pedidos pendentes antes de aceitar
 * um novo pedido. Para administradores, o depósito direto no cofre é atómico.
 */
export async function criarPedidoDepositoCofre(
  tx: Prisma.TransactionClient,
  input: CriarDepositoInput
) {
  validarValor(input.valor);

  if (!input.isAdmin) {
    const lock = await tx.vendedorCashbox.updateMany({
      where: { userId: input.vendedorId, saldo: { gte: input.valor } },
      data: { updatedAt: new Date() },
    });

    if (lock.count !== 1) {
      throw new Error('SALDO_INSUFICIENTE_CAIXA');
    }

    const [cashbox, reservas] = await Promise.all([
      tx.vendedorCashbox.findUnique({
        where: { userId: input.vendedorId },
        select: { saldo: true },
      }),
      tx.pedidoDepositoCofre.aggregate({
        where: {
          vendedorId: input.vendedorId,
          aldeiaId: input.aldeiaId,
          estado: 'pendente',
        },
        _sum: { valor: true },
      }),
    ]);

    const saldoCentimos = Math.round((cashbox?.saldo ?? 0) * 100);
    const reservadoCentimos = Math.round((reservas._sum.valor ?? 0) * 100);
    const pedidoCentimos = Math.round(input.valor * 100);

    if (saldoCentimos - reservadoCentimos < pedidoCentimos) {
      throw new Error('SALDO_INSUFICIENTE_CAIXA');
    }
  }

  const pedido = await tx.pedidoDepositoCofre.create({
    data: {
      vendedorId: input.vendedorId,
      aldeiaId: input.aldeiaId,
      valor: input.valor,
      descricao: input.descricao || `Depósito de ${input.valor}€`,
      referencias: input.referencias ? JSON.stringify(input.referencias) : null,
      criadoPorId: input.actorUserId,
      ...(input.isAdmin
        ? {
            estado: 'confirmado' as const,
            confirmadoPorId: input.actorUserId,
            confirmadoAt: new Date(),
          }
        : {}),
    },
  });

  if (input.isAdmin) {
    const vault = await tx.vault.upsert({
      where: { aldeiaId: input.aldeiaId },
      update: { saldo: { increment: input.valor } },
      create: { aldeiaId: input.aldeiaId, saldo: input.valor },
    });

    await tx.vaultTransaction.create({
      data: {
        vaultId: vault.id,
        tipo: 'deposito',
        valor: input.valor,
        descricao: input.descricao || `Depósito de ${input.valor}€`,
        referencia: pedido.id,
        estado: 'confirmado',
        criadoPorId: input.actorUserId,
        aprovadoPorId: input.actorUserId,
        dataAprovacao: new Date(),
      },
    });
  }

  await tx.auditLog.create({
    data: {
      userId: input.actorUserId,
      aldeiaId: input.aldeiaId,
      action: input.isAdmin ? 'deposito.cofre_direto' : 'deposito.criado',
      resource: 'pedido-deposito',
      resourceId: pedido.id,
      ip: input.ip,
      userAgent: input.userAgent?.slice(0, 500),
      metadata: {
        valor: pedido.valor,
        vendedorId: input.vendedorId,
        autoConfirmado: input.isAdmin,
      },
    },
  });

  return pedido;
}

/**
 * Confirma/rejeita um pedido. O claim do pedido, o débito condicional
 * da caixa, o crédito do cofre, os movimentos e a auditoria pertencem
 * à mesma transação.
 */
export async function processarPedidoDepositoCofre(
  tx: Prisma.TransactionClient,
  input: ProcessarDepositoInput
) {
  const now = new Date();
  const claimed = await tx.pedidoDepositoCofre.updateMany({
    where: { id: input.pedidoId, estado: 'pendente' },
    data:
      input.acao === 'confirmar'
        ? {
            estado: 'confirmado',
            confirmadoPorId: input.actorUserId,
            confirmadoAt: now,
            observacoes: input.observacoes || null,
          }
        : {
            estado: 'rejeitado',
            rejeitadoPorId: input.actorUserId,
            motivoRejeicao: input.observacoes || 'Rejeitado',
          },
  });

  if (claimed.count !== 1) {
    throw new Error('DEPOSITO_JA_PROCESSADO');
  }

  const pedido = await tx.pedidoDepositoCofre.findUnique({
    where: { id: input.pedidoId },
    include: {
      vendedor: { select: { id: true, nome: true } },
    },
  });

  if (!pedido) {
    throw new Error('DEPOSITO_NAO_ENCONTRADO');
  }

  if (input.acao === 'confirmar') {
    const cashbox = await tx.vendedorCashbox.findUnique({
      where: { userId: pedido.vendedorId },
      select: { id: true },
    });

    if (!cashbox) {
      throw new Error('SALDO_INSUFICIENTE_CAIXA');
    }

    const debited = await tx.vendedorCashbox.updateMany({
      where: { id: cashbox.id, saldo: { gte: pedido.valor } },
      data: { saldo: { decrement: pedido.valor } },
    });

    if (debited.count !== 1) {
      throw new Error('SALDO_INSUFICIENTE_CAIXA');
    }

    await tx.vendedorCashboxTransaction.create({
      data: {
        cashboxId: cashbox.id,
        tipo: 'DEPOSITADO_NO_COFRE',
        valor: pedido.valor,
        descricao: `Depósito no cofre: ${pedido.descricao || `${pedido.valor}€`}`,
        referencia: pedido.id,
        criadoPorId: input.actorUserId,
      },
    });

    const vault = await tx.vault.upsert({
      where: { aldeiaId: pedido.aldeiaId },
      create: { aldeiaId: pedido.aldeiaId, saldo: pedido.valor },
      update: { saldo: { increment: pedido.valor } },
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
        aprovadoPorId: input.actorUserId,
        dataAprovacao: now,
      },
    });
  }

  await tx.auditLog.create({
    data: {
      userId: input.actorUserId,
      aldeiaId: input.aldeiaId,
      action: input.acao === 'confirmar' ? 'deposito.confirmado' : 'deposito.rejeitado',
      resource: 'pedido-deposito',
      resourceId: pedido.id,
      ip: input.ip,
      userAgent: input.userAgent?.slice(0, 500),
      metadata: {
        valor: pedido.valor,
        vendedorId: pedido.vendedorId,
        estadoAnterior: 'pendente',
        estadoNovo: input.acao === 'confirmar' ? 'confirmado' : 'rejeitado',
        motivo: input.acao === 'rejeitar' ? input.observacoes || 'Rejeitado' : null,
      },
    },
  });

  return pedido;
}
