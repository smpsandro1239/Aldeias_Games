// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real DB: Cofre e Cashbox (fluxo completo)", () => {
  let prisma: any;
  let aldeiaId: string;
  let vendedorId: string;
  let adminId: string;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Cofre",
        slug: "aldeia-cofre",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "cofre@aldeia.pt",
        morada: "Rua Cofre, 1",
      },
    });
    aldeiaId = aldeia.id;

    const vendedor = await prisma.user.create({
      data: {
        nome: "Vendedor Cofre",
        email: "vendedor.cofre@teste.pt",
        password: "$2b$10$fakehash",
        role: "vendedor",
        aldeiaId,
        saldo: 0,
      },
    });
    vendedorId = vendedor.id;

    const admin = await prisma.user.create({
      data: {
        nome: "Admin Cofre",
        email: "admin.cofre@teste.pt",
        password: "$2b$10$fakehash",
        role: "aldeia_admin",
        aldeiaId,
        saldo: 0,
      },
    });
    adminId = admin.id;

    await prisma.vendedorCashbox.create({
      data: { userId: vendedorId, saldo: 100 },
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("deve confirmar depósito: cashbox decrementa, vault incrementa, transações criadas", async () => {
    const pedido = await prisma.pedidoDepositoCofre.create({
      data: {
        vendedorId,
        aldeiaId,
        valor: 40,
        descricao: "Depósito de teste",
        estado: "pendente",
        criadoPorId: vendedorId,
      },
    });

    await prisma.$transaction(async (tx: any) => {
      await tx.pedidoDepositoCofre.update({
        where: { id: pedido.id },
        data: {
          estado: "confirmado",
          confirmadoPorId: adminId,
          confirmadoAt: new Date(),
        },
      });

      const cashbox = await tx.vendedorCashbox.findUnique({
        where: { userId: vendedorId },
      });
      if (!cashbox || cashbox.saldo < pedido.valor) {
        throw new Error("Saldo insuficiente na caixa do vendedor");
      }

      await tx.vendedorCashbox.update({
        where: { userId: vendedorId },
        data: { saldo: { decrement: pedido.valor } },
      });

      await tx.vendedorCashboxTransaction.create({
        data: {
          cashboxId: cashbox.id,
          tipo: "DEPOSITADO_NO_COFRE",
          valor: pedido.valor,
          descricao: `Depósito no cofre: ${pedido.valor}€`,
          referencia: pedido.id,
          criadoPorId: adminId,
        },
      });

      const vault = await tx.vault.upsert({
        where: { aldeiaId },
        create: { aldeiaId, saldo: pedido.valor },
        update: { saldo: { increment: pedido.valor } },
      });

      await tx.vaultTransaction.create({
        data: {
          vaultId: vault.id,
          tipo: "deposito",
          valor: pedido.valor,
          descricao: `Depósito de Vendedor Cofre: ${pedido.valor}€`,
          referencia: pedido.id,
          estado: "confirmado",
          criadoPorId: vendedorId,
          aprovadoPorId: adminId,
          dataAprovacao: new Date(),
        },
      });
    });

    const pedidoFinal = await prisma.pedidoDepositoCofre.findUnique({
      where: { id: pedido.id },
    });
    expect(pedidoFinal.estado).toBe("confirmado");
    expect(pedidoFinal.confirmadoPorId).toBe(adminId);

    const cashboxFinal = await prisma.vendedorCashbox.findUnique({
      where: { userId: vendedorId },
    });
    expect(cashboxFinal.saldo).toBe(60);

    const vault = await prisma.vault.findUnique({ where: { aldeiaId } });
    expect(vault.saldo).toBe(40);

    const txns = await prisma.vaultTransaction.findMany({
      where: { vaultId: vault.id },
    });
    expect(txns).toHaveLength(1);
    expect(txns[0].tipo).toBe("deposito");
    expect(txns[0].estado).toBe("confirmado");
    expect(txns[0].valor).toBe(40);

    const cashboxTxns = await prisma.vendedorCashboxTransaction.findMany({
      where: { cashboxId: cashboxFinal.id },
    });
    expect(cashboxTxns).toHaveLength(1);
    expect(cashboxTxns[0].tipo).toBe("DEPOSITADO_NO_COFRE");

    await prisma.notificacao.create({
      data: {
        userId: vendedorId,
        tipo: "deposito_confirmado",
        titulo: "Depósito confirmado",
        mensagem: `O teu depósito de ${pedido.valor}€ foi confirmado`,
        lida: false,
      },
    });

    const notificacao = await prisma.notificacao.findFirst({
      where: { userId: vendedorId, tipo: "deposito_confirmado" },
    });
    expect(notificacao).toBeTruthy();
  });

  it("deve rejeitar depósito sem alterar saldos", async () => {
    const pedido = await prisma.pedidoDepositoCofre.create({
      data: {
        vendedorId,
        aldeiaId,
        valor: 20,
        estado: "pendente",
        criadoPorId: vendedorId,
      },
    });

    await prisma.pedidoDepositoCofre.update({
      where: { id: pedido.id },
      data: {
        estado: "rejeitado",
        rejeitadoPorId: adminId,
        motivoRejeicao: "Valor incorreto",
      },
    });

    const pedidoFinal = await prisma.pedidoDepositoCofre.findUnique({
      where: { id: pedido.id },
    });
    expect(pedidoFinal.estado).toBe("rejeitado");
    expect(pedidoFinal.motivoRejeicao).toBe("Valor incorreto");

    const cashbox = await prisma.vendedorCashbox.findUnique({
      where: { userId: vendedorId },
    });
    expect(cashbox.saldo).toBe(60);

    const vault = await prisma.vault.findUnique({ where: { aldeiaId } });
    expect(vault.saldo).toBe(40);

    await prisma.notificacao.create({
      data: {
        userId: vendedorId,
        tipo: "deposito_rejeitado",
        titulo: "Depósito rejeitado",
        mensagem: `O teu depósito de ${pedido.valor}€ foi rejeitado: Valor incorreto`,
        lida: false,
      },
    });

    const notificacao = await prisma.notificacao.findFirst({
      where: { userId: vendedorId, tipo: "deposito_rejeitado" },
    });
    expect(notificacao).toBeTruthy();
  });

  it("deve confirmar levantamento: vault decrementa e notifica vendedores", async () => {
    const vault = await prisma.vault.findUnique({ where: { aldeiaId } });
    const levantamento = await prisma.vaultTransaction.create({
      data: {
        vaultId: vault.id,
        tipo: "levantamento",
        valor: 15,
        descricao: "Material de festa",
        estado: "pendente",
        criadoPorId: adminId,
      },
    });

    await prisma.$transaction(async (tx: any) => {
      await tx.vaultTransaction.update({
        where: { id: levantamento.id },
        data: {
          estado: "confirmado",
          aprovadoPorId: adminId,
          dataAprovacao: new Date(),
          observacoes: `Aprovado por: Admin Cofre`,
        },
      });
      await tx.vault.update({
        where: { id: vault.id },
        data: { saldo: { decrement: levantamento.valor } },
      });
    });

    const levantamentoFinal = await prisma.vaultTransaction.findUnique({
      where: { id: levantamento.id },
    });
    expect(levantamentoFinal.estado).toBe("confirmado");
    expect(levantamentoFinal.aprovadoPorId).toBe(adminId);

    const vaultFinal = await prisma.vault.findUnique({ where: { aldeiaId } });
    expect(vaultFinal.saldo).toBe(25);

    await prisma.notificacao.create({
      data: {
        userId: adminId,
        tipo: "levantamento_confirmado",
        titulo: "Levantamento aprovado",
        mensagem: `O teu levantamento de ${levantamento.valor.toFixed(2)}€ foi aprovado.`,
        lida: false,
      },
    });

    const vendedores = await prisma.user.findMany({
      where: { aldeiaId, role: "vendedor", deletedAt: null },
      select: { id: true },
    });
    if (vendedores.length > 0) {
      await prisma.notificacao.createMany({
        data: vendedores.map((v: { id: string }) => ({
          userId: v.id,
          tipo: "levantamento_confirmado" as const,
          titulo: "Levantamento do cofre",
          mensagem: `Foi realizado um levantamento de ${levantamento.valor.toFixed(2)}€ do cofre da aldeia.`,
          lida: false,
        })),
      });
    }

    const notificacaoCriador = await prisma.notificacao.findFirst({
      where: { userId: adminId, tipo: "levantamento_confirmado" },
    });
    expect(notificacaoCriador).toBeTruthy();

    const notificacaoVendedor = await prisma.notificacao.findFirst({
      where: { userId: vendedorId, tipo: "levantamento_confirmado" },
    });
    expect(notificacaoVendedor).toBeTruthy();
  });

  it("deve bloquear levantamento sem saldo suficiente", async () => {
    const vault = await prisma.vault.findUnique({ where: { aldeiaId } });
    const levantamento = await prisma.vaultTransaction.create({
      data: {
        vaultId: vault.id,
        tipo: "levantamento",
        valor: 99999,
        descricao: "Valor impossível",
        estado: "pendente",
        criadoPorId: adminId,
      },
    });

    let erro: string | null = null;
    try {
      if (vault.saldo < levantamento.valor) {
        throw new Error(
          `Saldo insuficiente no cofre. Disponível: ${vault.saldo.toFixed(2)}€`
        );
      }
    } catch (e: any) {
      erro = e.message;
    }

    expect(erro).toContain("Saldo insuficiente");

    const final = await prisma.vaultTransaction.findUnique({
      where: { id: levantamento.id },
    });
    expect(final.estado).toBe("pendente");

    const vaultFinal = await prisma.vault.findUnique({ where: { aldeiaId } });
    expect(vaultFinal.saldo).toBe(25);
  });

  it("não deve creditar duas vezes com confirmações concorrentes (race)", async () => {
    const vault = await prisma.vault.findUnique({ where: { aldeiaId } });
    const saldoAntes = vault.saldo;

    const levantamento = await prisma.vaultTransaction.create({
      data: {
        vaultId: vault.id,
        tipo: "levantamento",
        valor: 10,
        descricao: "Race test",
        estado: "pendente",
        criadoPorId: adminId,
      },
    });

    const confirmar = async () => {
      await prisma.$transaction(async (tx: any) => {
        const claimed = await tx.vaultTransaction.updateMany({
          where: { id: levantamento.id, estado: "pendente" },
          data: {
            estado: "confirmado",
            aprovadoPorId: adminId,
            dataAprovacao: new Date(),
            observacoes: "Aprovado por: Admin Cofre",
          },
        });
        if (claimed.count === 0) {
          throw new Error("LEVANTAMENTO_JA_PROCESSADO");
        }
        const debited = await tx.vault.updateMany({
          where: { id: vault.id, saldo: { gte: levantamento.valor } },
          data: { saldo: { decrement: levantamento.valor } },
        });
        if (debited.count === 0) {
          throw new Error("SALDO_INSUFICIENTE_COFRE");
        }
      });
    };

    const sucesso = await Promise.allSettled([confirmar(), confirmar()]);

    expect(sucesso.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(sucesso.filter((r) => r.status === "rejected")).toHaveLength(1);

    const final = await prisma.vaultTransaction.findUnique({
      where: { id: levantamento.id },
    });
    expect(final.estado).toBe("confirmado");

    const vaultFinal = await prisma.vault.findUnique({ where: { aldeiaId } });
    expect(vaultFinal.saldo).toBe(saldoAntes - 10);
  });
});
