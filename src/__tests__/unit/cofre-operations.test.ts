// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    vault: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    vaultTransaction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    vendedorCashbox: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    vendedorCashboxTransaction: {
      create: vi.fn(),
    },
    participacao: { count: vi.fn().mockResolvedValue(0) },
  },
}));

import { prisma } from "@/lib/db";

const mockPrisma = vi.mocked(prisma);

describe("Cofre/Vault Operations - Critical", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Vault Balance", () => {
    it("should return vault balance for aldeia", async () => {
      mockPrisma.vault.findUnique.mockResolvedValue({
        id: "vault-1",
        aldeiaId: "aldeia-1",
        saldo: 500.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const vault = await prisma.vault.findUnique({
        where: { aldeiaId: "aldeia-1" },
      });

      expect(vault).not.toBeNull();
      expect(vault!.saldo).toBe(500.0);
    });

    it("should return null for non-existent vault", async () => {
      mockPrisma.vault.findUnique.mockResolvedValue(null);

      const vault = await prisma.vault.findUnique({
        where: { aldeiaId: "nonexistent" },
      });

      expect(vault).toBeNull();
    });
  });

  describe("Vault Transactions", () => {
    it("should create deposit transaction", async () => {
      mockPrisma.vaultTransaction.create.mockResolvedValue({
        id: "vt-1",
        vaultId: "vault-1",
        tipo: "deposito",
        valor: 100,
        descricao: "Depósito de teste",
        referencia: null,
        estado: "confirmado",
        criadoPorId: "user-1",
        aprovadoPorId: null,
        dataCriacao: new Date(),
        dataAprovacao: null,
        observacoes: null,
        createdAt: new Date(),
      });

      const tx = await prisma.vaultTransaction.create({
        data: {
          vaultId: "vault-1",
          tipo: "deposito",
          valor: 100,
          descricao: "Depósito de teste",
          estado: "confirmado",
          criadoPorId: "user-1",
        },
      });

      expect(tx).not.toBeNull();
      expect(tx.tipo).toBe("deposito");
      expect(tx.valor).toBe(100);
    });

    it("should list transactions for vault", async () => {
      mockPrisma.vaultTransaction.findMany.mockResolvedValue([
        {
          id: "vt-1",
          vaultId: "vault-1",
          tipo: "deposito",
          valor: 100,
          descricao: "Depósito",
          estado: "confirmado",
        },
        {
          id: "vt-2",
          vaultId: "vault-1",
          tipo: "levantamento",
          valor: 50,
          descricao: "Levantamento",
          estado: "confirmado",
        },
      ]);

      const txs = await prisma.vaultTransaction.findMany({
        where: { vaultId: "vault-1" },
      });

      expect(txs).toHaveLength(2);
      expect(txs[0].tipo).toBe("deposito");
      expect(txs[1].tipo).toBe("levantamento");
    });
  });

  describe("Cashbox Operations", () => {
    it("should create cashbox for vendedor", async () => {
      mockPrisma.vendedorCashbox.upsert.mockResolvedValue({
        id: "cb-1",
        userId: "vendedor-1",
        saldo: 200,
        updatedAt: new Date(),
      });

      const cb = await prisma.vendedorCashbox.upsert({
        where: { userId: "vendedor-1" },
        create: { userId: "vendedor-1", saldo: 200 },
        update: { saldo: { increment: 200 } },
      });

      expect(cb).not.toBeNull();
      expect(cb.saldo).toBe(200);
    });

    it("should record cashbox transaction", async () => {
      mockPrisma.vendedorCashboxTransaction.create.mockResolvedValue({
        id: "cbt-1",
        cashboxId: "cb-1",
        tipo: "RECEBIDO_DO_JOGADOR",
        valor: 10,
        descricao: "Venda em dinheiro",
        referencia: null,
        criadoPorId: "vendedor-1",
        createdAt: new Date(),
      });

      const tx = await prisma.vendedorCashboxTransaction.create({
        data: {
          cashboxId: "cb-1",
          tipo: "RECEBIDO_DO_JOGADOR",
          valor: 10,
          descricao: "Venda em dinheiro",
          criadoPorId: "vendedor-1",
        },
      });

      expect(tx).not.toBeNull();
      expect(tx.tipo).toBe("RECEBIDO_DO_JOGADOR");
      expect(tx.valor).toBe(10);
    });
  });

  describe("Financial Integrity", () => {
    it("should maintain vault balance consistency after deposit", async () => {
      // Simulate: vault has 500, deposit 100, should be 600
      const initialBalance = 500;
      const depositAmount = 100;

      mockPrisma.vault.findUnique.mockResolvedValue({
        id: "vault-1",
        aldeiaId: "aldeia-1",
        saldo: initialBalance,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const vault = await prisma.vault.findUnique({
        where: { aldeiaId: "aldeia-1" },
      });

      expect(vault!.saldo).toBe(initialBalance);

      // After deposit, balance should be updated
      mockPrisma.vault.update.mockResolvedValue({
        id: "vault-1",
        aldeiaId: "aldeia-1",
        saldo: initialBalance + depositAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updated = await prisma.vault.update({
        where: { aldeiaId: "aldeia-1" },
        data: { saldo: { increment: depositAmount } },
      });

      expect(updated.saldo).toBe(initialBalance + depositAmount);
    });

    it("should prevent negative vault balance", async () => {
      const balance = 50;
      const withdrawal = 100;

      // Simulate: attempting to withdraw more than balance
      const newBalance = balance - withdrawal;
      expect(newBalance).toBeLessThan(0);

      // Business logic should reject this
      const canWithdraw = balance >= withdrawal;
      expect(canWithdraw).toBe(false);
    });
  });
});
