// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  getPrisma,
  setupTestDatabase,
  teardownTestDatabase,
} from "../../helpers/test-db";
import { executeWithRetry } from "@/lib/transaction-retry";
import { processarTransicaoEntregaSaldo } from "@/lib/entrega-saldo";

describe("Real DB: integridade das entregas de saldo", () => {
  let prisma: any;
  let aldeiaId: string;
  let vendedorId: string;
  let adminId: string;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Entregas",
        slug: "aldeia-entregas",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "entregas@aldeia.pt",
        morada: "Rua das Entregas, 1",
      },
    });
    aldeiaId = aldeia.id;

    const vendedor = await prisma.user.create({
      data: {
        nome: "Vendedor Entregas",
        email: "vendedor.entregas@teste.pt",
        password: "$2b$10$fakehash",
        role: "vendedor",
        aldeiaId,
        saldo: 100,
      },
    });
    vendedorId = vendedor.id;

    const admin = await prisma.user.create({
      data: {
        nome: "Admin Entregas",
        email: "admin.entregas@teste.pt",
        password: "$2b$10$fakehash",
        role: "aldeia_admin",
        aldeiaId,
        saldo: 0,
      },
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("processa uma única transferência quando duas confirmações chegam em simultâneo", async () => {
    const entrega = await prisma.entregaSaldo.create({
      data: {
        vendedorId,
        adminId,
        aldeiaId,
        valor: 40,
        estado: "solicitado",
      },
    });

    const confirmar = () =>
      executeWithRetry(() =>
        prisma.$transaction((tx: any) =>
          processarTransicaoEntregaSaldo(tx, {
            entregaId: entrega.id,
            acao: "confirmar",
          })
        )
      );

    const resultados = await Promise.allSettled([confirmar(), confirmar()]);
    expect(resultados.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(resultados.filter((r) => r.status === "rejected")).toHaveLength(1);

    const [entregaFinal, vendedor, admin, movimentos] = await Promise.all([
      prisma.entregaSaldo.findUnique({ where: { id: entrega.id } }),
      prisma.user.findUnique({ where: { id: vendedorId } }),
      prisma.user.findUnique({ where: { id: adminId } }),
      prisma.transacao.findMany({
        where: {
          dadosAdicionais: { path: "$.entregaId", equals: entrega.id },
        },
      }),
    ]);

    expect(entregaFinal.estado).toBe("confirmado");
    expect(vendedor.saldo).toBe(60);
    expect(admin.saldo).toBe(40);
    expect(movimentos).toHaveLength(2);
    expect(movimentos.reduce((total: number, movimento: any) => total + movimento.valor, 0)).toBe(0);
  });

  it("faz rollback do claim quando o vendedor não tem saldo suficiente", async () => {
    const vendedorSemSaldo = await prisma.user.create({
      data: {
        nome: "Vendedor sem saldo",
        email: "vendedor.sem.saldo@teste.pt",
        password: "$2b$10$fakehash",
        role: "vendedor",
        aldeiaId,
        saldo: 0,
      },
    });
    const entrega = await prisma.entregaSaldo.create({
      data: {
        vendedorId: vendedorSemSaldo.id,
        adminId,
        aldeiaId,
        valor: 10,
        estado: "solicitado",
      },
    });

    await expect(
      prisma.$transaction((tx: any) =>
        processarTransicaoEntregaSaldo(tx, {
          entregaId: entrega.id,
          acao: "confirmar",
        })
      )
    ).rejects.toThrow("SALDO_INSUFICIENTE_VENDEDOR");

    const [entregaFinal, vendedor, admin, movimentos] = await Promise.all([
      prisma.entregaSaldo.findUnique({ where: { id: entrega.id } }),
      prisma.user.findUnique({ where: { id: vendedorSemSaldo.id } }),
      prisma.user.findUnique({ where: { id: adminId } }),
      prisma.transacao.findMany({
        where: {
          dadosAdicionais: { path: "$.entregaId", equals: entrega.id },
        },
      }),
    ]);

    expect(entregaFinal.estado).toBe("solicitado");
    expect(vendedor.saldo).toBe(0);
    expect(admin.saldo).toBe(40);
    expect(movimentos).toHaveLength(0);
  });

  it("rejeita uma entrega apenas uma vez e não cria movimentos financeiros", async () => {
    const entrega = await prisma.entregaSaldo.create({
      data: {
        vendedorId,
        adminId,
        aldeiaId,
        valor: 5,
        estado: "solicitado",
      },
    });

    await prisma.$transaction((tx: any) =>
      processarTransicaoEntregaSaldo(tx, {
        entregaId: entrega.id,
        acao: "rejeitar",
        observacoes: "Pedido inválido",
      })
    );

    await expect(
      prisma.$transaction((tx: any) =>
        processarTransicaoEntregaSaldo(tx, {
          entregaId: entrega.id,
          acao: "rejeitar",
        })
      )
    ).rejects.toThrow("ENTREGA_JA_PROCESSADA");

    const final = await prisma.entregaSaldo.findUnique({
      where: { id: entrega.id },
    });
    expect(final.estado).toBe("cancelado");
    expect(final.observacoes).toBe("Pedido inválido");
    expect(
      await prisma.transacao.count({
        where: {
          dadosAdicionais: { path: "$.entregaId", equals: entrega.id },
        },
      })
    ).toBe(0);
  });
});
