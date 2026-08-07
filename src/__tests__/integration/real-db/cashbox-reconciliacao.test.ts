// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

type LifeTipo = "RECEBIDO_DO_JOGADOR" | "PAGO_AO_JOGADOR" | "DEPOSITADO_NO_COFRE";

describe("Real DB: Cashbox do Vendedor — histórico e reconciliação", () => {
  let prisma: any;
  let vendedorId: string;
  let cashboxId: string;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function seedVendedor() {
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Cashbox",
        slug: `aldeia-cashbox-${Date.now()}`,
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "cashbox@aldeia.pt",
        morada: "Rua Cashbox, 1",
      },
    });
    const vendedor = await prisma.user.create({
      data: {
        nome: "Vendedora Cashbox",
        email: `vendedora.cashbox.${Date.now()}@teste.pt`,
        password: "$2a$10$fakehash",
        role: "vendedor",
        aldeiaId: aldeia.id,
        saldo: 0,
      },
    });
    const cashbox = await prisma.vendedorCashbox.create({
      data: { userId: vendedor.id, saldo: 0 },
    });
    vendedorId = vendedor.id;
    cashboxId = cashbox.id;
    return { aldeia, vendedor, cashbox };
  }

  async function registrarMovimento(tipo: LifeTipo, valor: number, descricao: string) {
    await prisma.$transaction(async (tx: any) => {
      await tx.vendedorCashboxTransaction.create({
        data: { cashboxId, tipo, valor, descricao, criadoPorId: vendedorId },
      });
      const operation =
        tipo === "RECEBIDO_DO_JOGADOR" ? { increment: valor } : { decrement: valor };
      await tx.vendedorCashbox.update({ where: { id: cashboxId }, data: { saldo: operation } });
    });
  }

  it("reconcilia a caixa após venda, prémio pago e depósito", async () => {
    await seedVendedor();

    await registrarMovimento("RECEBIDO_DO_JOGADOR", 100, "Venda de raspadinha (dinheiro)");
    await registrarMovimento("PAGO_AO_JOGADOR", 10, "Prémio pago ao cliente");
    await registrarMovimento("DEPOSITADO_NO_COFRE", 40, "Depósito no cofre da aldeia");

    const caixa = await prisma.vendedorCashbox.findUnique({ where: { id: cashboxId } });
    expect(caixa.saldo).toBe(50);

    const txns = await prisma.vendedorCashboxTransaction.findMany({
      where: { cashboxId },
      orderBy: { createdAt: "desc" },
    });
    expect(txns).toHaveLength(3);
    expect(txns[0].tipo).toBe("DEPOSITADO_NO_COFRE");
    expect(txns[0].valor).toBe(40);

    // Invariante contabilístico: somatório com sinais == saldo final
    let total = 0;
    for (const t of txns) {
      total += t.tipo === "RECEBIDO_DO_JOGADOR" ? t.valor : -t.valor;
    }
    expect(total).toBe(50);
    expect(total).toBe(caixa.saldo);
  });

  it("paginação do histórico respeita o limite", async () => {
    const { cashbox } = await seedVendedor();

    await registrarMovimento("RECEBIDO_DO_JOGADOR", 5, "Venda 1");
    await registrarMovimento("RECEBIDO_DO_JOGADOR", 5, "Venda 2");
    await registrarMovimento("RECEBIDO_DO_JOGADOR", 5, "Venda 3");
    await registrarMovimento("DEPOSITADO_NO_COFRE", 5, "Depósito");

    const page1 = await prisma.vendedorCashboxTransaction.findMany({
      where: { cashboxId },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 2,
    });
    expect(page1).toHaveLength(2);

    const page2 = await prisma.vendedorCashboxTransaction.findMany({
      where: { cashboxId },
      orderBy: { createdAt: "desc" },
      skip: 2,
      take: 2,
    });
    expect(page2).toHaveLength(2);

    const total = await prisma.vendedorCashboxTransaction.count({ where: { cashboxId } });
    expect(total).toBe(4);
    expect(total).toBe(page1.length + page2.length);

    // O saldo final acompanha o somatório dos movimentos (3 recebidos - 1 depósito)
    const caixa = await prisma.vendedorCashbox.findUnique({ where: { id: cashboxId } });
    expect(caixa.saldo).toBe(10);
  });
});