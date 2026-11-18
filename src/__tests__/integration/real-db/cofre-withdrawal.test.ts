// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { executeWithRetry } from '@/lib/transaction-retry';
import {
  criarPedidoLevantamentoCofre,
  processarLevantamentoCofre,
} from '@/lib/cofre-withdrawal';
import {
  getPrisma,
  setupTestDatabase,
  teardownTestDatabase,
} from '../../helpers/test-db';

describe('Real DB: reservas e auditoria de levantamentos do cofre', () => {
  let prisma: any;
  let sequence = 0;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function criarCenario(saldo = 100) {
    sequence += 1;
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: `Aldeia Levantamento ${sequence}`,
        slug: `aldeia-levantamento-${sequence}`,
        tipoOrganizacao: 'aldeia',
        telefone: '912345678',
        email: `levantamento-${sequence}@aldeia.pt`,
        morada: 'Rua dos Levantamentos, 1',
      },
    });
    const admin = await prisma.user.create({
      data: {
        nome: `Admin Levantamento ${sequence}`,
        email: `admin-levantamento-${sequence}@teste.pt`,
        password: '$2b$10$fakehash',
        role: 'aldeia_admin',
        aldeiaId: aldeia.id,
        saldo: 0,
      },
    });
    const vault = await prisma.vault.create({
      data: { aldeiaId: aldeia.id, saldo },
    });
    return { aldeiaId: aldeia.id, adminId: admin.id, vaultId: vault.id };
  }

  it('impede duas reservas concorrentes que excederiam o saldo disponível', async () => {
    const cenario = await criarCenario(100);
    const solicitar = (valor: number) =>
      executeWithRetry(() =>
        prisma.$transaction((tx: any) =>
          criarPedidoLevantamentoCofre(tx, {
            valor,
            descricao: 'Pagamento de despesas da festa',
            destino: 'Fornecedor local',
            actorUserId: cenario.adminId,
            aldeiaId: cenario.aldeiaId,
          })
        )
      );

    const resultados = await Promise.allSettled([solicitar(80), solicitar(80)]);
    expect(resultados.filter((resultado) => resultado.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.filter((resultado) => resultado.status === 'rejected')).toHaveLength(1);
    expect(await prisma.vaultTransaction.count({
      where: { vaultId: cenario.vaultId, tipo: 'levantamento', estado: 'pendente' },
    })).toBe(1);
    expect(await prisma.auditLog.count({
      where: { aldeiaId: cenario.aldeiaId, action: 'levantamento.solicitado' },
    })).toBe(1);
    const vault = await prisma.vault.findUnique({ where: { id: cenario.vaultId } });
    expect(vault.saldo).toBe(100);
  });

  it('confirma apenas uma vez quando chegam duas aprovações concorrentes', async () => {
    const cenario = await criarCenario(100);
    const levantamento = await prisma.vaultTransaction.create({
      data: {
        vaultId: cenario.vaultId,
        tipo: 'levantamento',
        valor: 60,
        descricao: 'Levantamento para despesas',
        estado: 'pendente',
        criadoPorId: cenario.adminId,
      },
    });
    const confirmar = () =>
      executeWithRetry(() =>
        prisma.$transaction((tx: any) =>
          processarLevantamentoCofre(tx, {
            levantamentoId: levantamento.id,
            acao: 'confirmar',
            actorUserId: cenario.adminId,
            aldeiaId: cenario.aldeiaId,
          })
        )
      );

    const resultados = await Promise.allSettled([confirmar(), confirmar()]);
    expect(resultados.filter((resultado) => resultado.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.filter((resultado) => resultado.status === 'rejected')).toHaveLength(1);

    const [final, vault, auditorias] = await Promise.all([
      prisma.vaultTransaction.findUnique({ where: { id: levantamento.id } }),
      prisma.vault.findUnique({ where: { id: cenario.vaultId } }),
      prisma.auditLog.count({
        where: {
          resource: 'cofre-levantamento',
          resourceId: levantamento.id,
          action: 'levantamento.confirmado',
        },
      }),
    ]);
    expect(final.estado).toBe('confirmado');
    expect(vault.saldo).toBe(40);
    expect(auditorias).toBe(1);
  });

  it('liberta a reserva após rejeição e regista a auditoria na mesma transação', async () => {
    const cenario = await criarCenario(100);
    const levantamento = await prisma.vaultTransaction.create({
      data: {
        vaultId: cenario.vaultId,
        tipo: 'levantamento',
        valor: 90,
        descricao: 'Pedido a rejeitar',
        estado: 'pendente',
        criadoPorId: cenario.adminId,
      },
    });

    await prisma.$transaction((tx: any) =>
      processarLevantamentoCofre(tx, {
        levantamentoId: levantamento.id,
        acao: 'rejeitar',
        observacoes: 'Despesa não autorizada',
        actorUserId: cenario.adminId,
        aldeiaId: cenario.aldeiaId,
      })
    );

    const novo = await prisma.$transaction((tx: any) =>
      criarPedidoLevantamentoCofre(tx, {
        valor: 100,
        descricao: 'Novo pedido após rejeição',
        destino: 'Fornecedor',
        actorUserId: cenario.adminId,
        aldeiaId: cenario.aldeiaId,
      })
    );
    expect(novo.estado).toBe('pendente');
    expect(await prisma.auditLog.count({
      where: { resource: 'cofre-levantamento', resourceId: levantamento.id, action: 'levantamento.rejeitado' },
    })).toBe(1);
  });

  it('reverte estado, saldo e auditoria quando a transação financeira aborta', async () => {
    const cenario = await criarCenario(100);
    const levantamento = await prisma.vaultTransaction.create({
      data: {
        vaultId: cenario.vaultId,
        tipo: 'levantamento',
        valor: 30,
        descricao: 'Pedido para teste de rollback',
        estado: 'pendente',
        criadoPorId: cenario.adminId,
      },
    });

    await expect(prisma.$transaction(async (tx: any) => {
      await processarLevantamentoCofre(tx, {
        levantamentoId: levantamento.id,
        acao: 'confirmar',
        actorUserId: cenario.adminId,
        aldeiaId: cenario.aldeiaId,
      });
      throw new Error('FORCAR_ROLLBACK');
    })).rejects.toThrow('FORCAR_ROLLBACK');

    const [final, vault, auditorias] = await Promise.all([
      prisma.vaultTransaction.findUnique({ where: { id: levantamento.id } }),
      prisma.vault.findUnique({ where: { id: cenario.vaultId } }),
      prisma.auditLog.count({
        where: { resource: 'cofre-levantamento', resourceId: levantamento.id },
      }),
    ]);
    expect(final.estado).toBe('pendente');
    expect(vault.saldo).toBe(100);
    expect(auditorias).toBe(0);
  });
});
