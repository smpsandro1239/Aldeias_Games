import { Prisma } from '@prisma/client';

type LevantamentoAction = 'confirmar' | 'rejeitar';

interface LevantamentoContext {
  actorUserId: string;
  aldeiaId: string;
  ip?: string;
  userAgent?: string;
}

interface CriarLevantamentoInput extends LevantamentoContext {
  valor: number;
  descricao: string;
  destino: string;
  observacoes?: string | null;
}

interface ProcessarLevantamentoInput extends LevantamentoContext {
  levantamentoId: string;
  acao: LevantamentoAction;
  observacoes?: string;
}

function validarValor(valor: number): void {
  if (
    !Number.isFinite(valor) ||
    valor <= 0 ||
    Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-8
  ) {
    throw new Error('VALOR_LEVANTAMENTO_INVALIDO');
  }
}

/**
 * Reserva fundos no cofre para um levantamento pendente.
 * A escrita na linha Vault serializa os pedidos da mesma aldeia antes
 * de calcular as reservas pendentes, tanto em SQLite como em PostgreSQL.
 */
export async function criarPedidoLevantamentoCofre(
  tx: Prisma.TransactionClient,
  input: CriarLevantamentoInput
) {
  validarValor(input.valor);

  const lock = await tx.vault.updateMany({
    where: { aldeiaId: input.aldeiaId },
    data: { updatedAt: new Date() },
  });

  if (lock.count !== 1) {
    throw new Error('COFRE_NAO_ENCONTRADO');
  }

  const vault = await tx.vault.findUnique({
    where: { aldeiaId: input.aldeiaId },
    select: { id: true, saldo: true },
  });

  if (!vault) {
    throw new Error('COFRE_NAO_ENCONTRADO');
  }

  const reservas = await tx.vaultTransaction.aggregate({
    where: {
      vaultId: vault.id,
      tipo: 'levantamento',
      estado: 'pendente',
    },
    _sum: { valor: true },
  });

  const saldoCentimos = Math.round(vault.saldo * 100);
  const reservadoCentimos = Math.round((reservas._sum.valor ?? 0) * 100);
  const valorCentimos = Math.round(input.valor * 100);
  const disponivelCentimos = saldoCentimos - reservadoCentimos;

  if (valorCentimos <= 0 || valorCentimos > disponivelCentimos) {
    throw new Error('SALDO_INSUFICIENTE_COFRE');
  }

  const levantamento = await tx.vaultTransaction.create({
    data: {
      vaultId: vault.id,
      tipo: 'levantamento',
      valor: valorCentimos / 100,
      descricao: `Levantamento: ${input.descricao.trim()}`,
      estado: 'pendente',
      criadoPorId: input.actorUserId,
      observacoes: [
        `Destino: ${input.destino.trim()}`,
        input.observacoes?.trim() || null,
      ].filter(Boolean).join('\\n'),
    },
  });

  await tx.auditLog.create({
    data: {
      userId: input.actorUserId,
      aldeiaId: input.aldeiaId,
      action: 'levantamento.solicitado',
      resource: 'cofre-levantamento',
      resourceId: levantamento.id,
      ip: input.ip,
      userAgent: input.userAgent?.slice(0, 500),
      metadata: {
        valor: levantamento.valor,
        descricao: input.descricao.trim(),
        destino: input.destino.trim(),
        saldoDisponivelAntes: disponivelCentimos / 100,
      },
    },
  });

  return levantamento;
}

/**
 * Confirma/rejeita um levantamento com claim condicional.
 * O estado, débito do cofre e AuditLog são confirmados ou revertidos
 * conjuntamente pela transação que invoca este helper.
 */
export async function processarLevantamentoCofre(
  tx: Prisma.TransactionClient,
  input: ProcessarLevantamentoInput
) {
  const levantamento = await tx.vaultTransaction.findUnique({
    where: { id: input.levantamentoId },
    include: {
      vault: { select: { id: true, aldeiaId: true } },
      criadoPor: { select: { id: true, nome: true } },
    },
  });

  if (!levantamento) {
    throw new Error('LEVANTAMENTO_NAO_ENCONTRADO');
  }
  if (levantamento.tipo !== 'levantamento' || levantamento.vault.aldeiaId !== input.aldeiaId) {
    throw new Error('LEVANTAMENTO_FORA_DO_ESCOPO');
  }

  const now = new Date();
  const novoEstado = input.acao === 'confirmar' ? 'confirmado' : 'rejeitado';
  const claimed = await tx.vaultTransaction.updateMany({
    where: {
      id: input.levantamentoId,
      vaultId: levantamento.vaultId,
      tipo: 'levantamento',
      estado: 'pendente',
    },
    data: {
      estado: novoEstado,
      aprovadoPorId: input.actorUserId,
      dataAprovacao: now,
      observacoes: [
        levantamento.observacoes || null,
        input.acao === 'confirmar' ? `Aprovado por: ${input.actorUserId}` : 'Rejeitado',
        input.observacoes?.trim() || null,
      ].filter(Boolean).join('\\n'),
    },
  });

  if (claimed.count !== 1) {
    throw new Error('LEVANTAMENTO_JA_PROCESSADO');
  }

  if (input.acao === 'confirmar') {
    const debited = await tx.vault.updateMany({
      where: {
        id: levantamento.vaultId,
        aldeiaId: input.aldeiaId,
        saldo: { gte: levantamento.valor },
      },
      data: { saldo: { decrement: levantamento.valor } },
    });

    if (debited.count !== 1) {
      throw new Error('SALDO_INSUFICIENTE_COFRE');
    }
  }

  await tx.auditLog.create({
    data: {
      userId: input.actorUserId,
      aldeiaId: input.aldeiaId,
      action: input.acao === 'confirmar' ? 'levantamento.confirmado' : 'levantamento.rejeitado',
      resource: 'cofre-levantamento',
      resourceId: levantamento.id,
      ip: input.ip,
      userAgent: input.userAgent?.slice(0, 500),
      metadata: {
        valor: levantamento.valor,
        solicitadoPor: levantamento.criadoPor.nome,
        descricao: levantamento.descricao,
        estadoAnterior: 'pendente',
        estadoNovo: novoEstado,
        motivo: input.acao === 'rejeitar' ? input.observacoes?.trim() || null : null,
      },
    },
  });

  return levantamento;
}
