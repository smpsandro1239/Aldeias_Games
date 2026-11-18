import { Prisma } from '@prisma/client';

export type EntregaSaldoAction = 'confirmar' | 'rejeitar' | 'concluir';

interface ProcessarEntregaSaldoInput {
  entregaId: string;
  acao: EntregaSaldoAction;
  observacoes?: string | null;
}

/**
 * Processa a transição e os movimentos financeiros na mesma transação.
 * O updateMany condicional funciona como claim: apenas uma operação pode
 * transitar do estado de origem esperado.
 */
export async function processarTransicaoEntregaSaldo(
  tx: Prisma.TransactionClient,
  input: ProcessarEntregaSaldoInput
) {
  const entrega = await tx.entregaSaldo.findUnique({
    where: { id: input.entregaId },
    include: {
      vendedor: { select: { id: true, nome: true } },
      admin: { select: { id: true, nome: true } },
    },
  });

  if (!entrega) {
    throw new Error('ENTREGA_NAO_ENCONTRADA');
  }

  const agora = new Date();
  const estadoOrigem = input.acao === 'concluir' ? 'confirmado' : 'solicitado';
  const estadoDestino =
    input.acao === 'confirmar'
      ? 'confirmado'
      : input.acao === 'rejeitar'
        ? 'cancelado'
        : 'concluido';

  const claimed = await tx.entregaSaldo.updateMany({
    where: { id: input.entregaId, estado: estadoOrigem },
    data: {
      estado: estadoDestino,
      dataConfirmacao: input.acao === 'confirmar' ? agora : undefined,
      dataConclusao: input.acao === 'concluir' ? agora : undefined,
      observacoes: input.observacoes || entrega.observacoes,
    },
  });

  if (claimed.count === 0) {
    throw new Error('ENTREGA_JA_PROCESSADA');
  }

  if (input.acao === 'confirmar') {
    const debited = await tx.user.updateMany({
      where: {
        id: entrega.vendedorId,
        saldo: { gte: entrega.valor },
      },
      data: { saldo: { decrement: entrega.valor } },
    });

    if (debited.count === 0) {
      throw new Error('SALDO_INSUFICIENTE_VENDEDOR');
    }

    await tx.user.update({
      where: { id: entrega.adminId },
      data: { saldo: { increment: entrega.valor } },
    });

    await tx.transacao.create({
      data: {
        userId: entrega.vendedorId,
        tipo: 'transferencia_vendedor_admin',
        valor: -entrega.valor,
        descricao: `Transferência para admin (${entrega.admin.nome}) - Entrega #${entrega.id.slice(0, 8)}`,
        estado: 'concluido',
        dadosAdicionais: {
          entregaId: entrega.id,
          adminId: entrega.adminId,
          adminNome: entrega.admin.nome,
          dataConfirmacao: agora.toISOString(),
        },
      },
    });

    await tx.transacao.create({
      data: {
        userId: entrega.adminId,
        tipo: 'recebimento_vendedor',
        valor: entrega.valor,
        descricao: `Recebimento de vendedor (${entrega.vendedor.nome}) - Entrega #${entrega.id.slice(0, 8)}`,
        estado: 'concluido',
        dadosAdicionais: {
          entregaId: entrega.id,
          vendedorId: entrega.vendedorId,
          vendedorNome: entrega.vendedor.nome,
          dataConfirmacao: agora.toISOString(),
        },
      },
    });
  }

  return tx.entregaSaldo.findUniqueOrThrow({
    where: { id: input.entregaId },
    include: {
      vendedor: { select: { id: true, nome: true } },
      admin: { select: { id: true, nome: true } },
    },
  });
}
