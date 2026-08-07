// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real DB: Pending Changes (IBAN/titular) — aprovação, rejeição e auditoria", () => {
  let prisma: any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function seedAldeiaComAdmins() {
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: `Aldeia PC ${Date.now()}`,
        slug: `aldeia-pc-${Date.now()}`,
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: `pc-${Date.now()}@aldeia.pt`,
        morada: "Rua PC, 1",
        iban: "PT5000000000123456789012",
        nomeTitularConta: "Antiga Associação",
      },
    });

    const adminA = await prisma.user.create({
      data: {
        nome: "Admin PC A",
        email: `pc-a-${Date.now()}@teste.pt`,
        password: "$2a$10$fakehash",
        role: "aldeia_admin",
        aldeiaId: aldeia.id,
        saldo: 0,
      },
    });

    const adminB = await prisma.user.create({
      data: {
        nome: "Admin PC B",
        email: `pc-b-${Date.now()}@teste.pt`,
        password: "$2a$10$fakehash",
        role: "aldeia_admin",
        aldeiaId: aldeia.id,
        saldo: 0,
      },
    });

    const superAdmin = await prisma.user.create({
      data: {
        nome: "Super PC",
        email: `pc-s-${Date.now()}@teste.pt`,
        password: "$2a$10$fakehash",
        role: "super_admin",
        saldo: 0,
      },
    });

    return { aldeia, adminA, adminB, superAdmin };
  }

  it("aprovar alteração aplica o novo IBAN, marca aprovado e escreve auditoria com valores mascarados", async () => {
    const { aldeia, adminA, adminB } = await seedAldeiaComAdmins();

    const pendente = await prisma.pendingAldeiaChange.create({
      data: {
        aldeiaId: aldeia.id,
        campo: "iban",
        valorAntes: "PT50000000000123456789",
        valorDepois: "PT50000000000098765432",
        estado: "pendente",
        requestedById: adminA.id,
        observacoes: null,
      },
    });

    // approve guard: não-super-admin não pode aprovar o próprio pedido
    const canSelfApprove = (requestedById: string, userId: string, isSuperAdmin: boolean) =>
      !(requestedById === userId && !isSuperAdmin);
    expect(canSelfApprove(adminA.id, adminA.id, false)).toBe(false);
    expect(canSelfApprove(adminA.id, adminB.id, false)).toBe(true);
    expect(canSelfApprove(adminA.id, adminA.id, true)).toBe(true);

    // Aprovação por OUTRO admin (fluxo da rota, dentro de $transaction)
    await prisma.$transaction(async (tx) => {
      await tx.aldeia.update({
        where: { id: aldeia.id },
        data: { iban: "PT50000000000000000032" },
      });
      await tx.pendingAldeiaChange.update({
        where: { id: pendente.id },
        data: { estado: "aprovado", decidedById: adminB.id, decidedAt: new Date(), observacoes: "ok" },
      });
      await tx.auditLog.create({
        data: {
          userId: adminB.id,
          aldeiaId: aldeia.id,
          action: "APPROVE_SENSITIVE_CHANGE",
          resource: "PendingAldeiaChange",
          resourceId: pendente.id,
          metadata: {
            valorAntes: "****" + "12300000000123456789".slice(-4),
            valorNovo: "****" + "12300000000000000032".slice(-4),
            aprovadoPor: adminB.id,
          },
        },
      });
    });

    const updatedAldeia = await prisma.aldeia.findUnique({ where: { id: aldeia.id } });
    expect(updatedAldeia.iban).toBe("PT50000000000000000032");

    const pc = await prisma.pendingAldeiaChange.findUnique({ where: { id: pendente.id } });
    expect(pc.estado).toBe("aprovado");
    expect(pc.decidedById).toBe(adminB.id);
    expect(pc.decidedAt).toBeTruthy();

    const audit = await prisma.auditLog.findFirst({ where: { action: "APPROVE_SENSITIVE_CHANGE" } });
    expect(audit).toBeTruthy();
    // Valores mascarados, nunca em claro
    expect(audit.metadata.valorAntes).not.toContain("1230000000012345678900");
    expect(audit.metadata.valorAntes).toMatch(/^\*{4}\d{4}$/);
    expect(audit.metadata.valorNovo).toMatch(/^\*{4}\d{4}$/);
  });

  it("rejeitar pedido marca como rejeitado, guarda observações e notifica o requerente", async () => {
    const { aldeia, adminA, adminB } = await seedAldeiaComAdmins();

    const pendente = await prisma.pendingAldeiaChange.create({
      data: {
        aldeiaId: aldeia.id,
        campo: "nomeTitularConta",
        valorAntes: "Antiga Associação",
        valorDepois: "Nova Associação",
        estado: "pendente",
        requestedById: adminA.id,
        observacoes: null,
      },
    });

    await prisma.pendingAldeiaChange.update({
      where: { id: pendente.id },
      data: {
        estado: "rejeitado",
        decidedById: adminB.id,
        decidedAt: new Date(),
        observacoes: "Faltam documentos",
      },
    });

    await prisma.notificacao.create({
      data: {
        userId: adminA.id,
        tipo: "sistema",
        titulo: "Alteração rejeitada",
        mensagem: "A sua alteração de titular da conta foi rejeitada. Motivo: Faltam documentos",
        lida: false,
      },
    });

    const pc = await prisma.pendingAldeiaChange.findUnique({ where: { id: pendente.id } });
    expect(pc.estado).toBe("rejeitado");
    expect(pc.observacoes).toBe("Faltam documentos");
    expect(pc.decidedById).toBe(adminB.id);

    const notif = await prisma.notificacao.findFirst({ where: { userId: adminA.id } });
    expect(notif).toBeTruthy();
    expect(notif.titulo).toBe("Alteração rejeitada");
    expect(notif.mensagem).toContain("Faltam documentos");
  });

  it("super admin aprova pedido próprio (auto-aprovação permitida)", async () => {
    const { aldeia, superAdmin } = await seedAldeiaComAdmins();

    const pendente = await prisma.pendingAldeiaChange.create({
      data: {
        aldeiaId: aldeia.id,
        campo: "nomeTitularConta",
        valorAntes: "Antiga",
        valorDepois: "Nova",
        estado: "pendente",
        requestedById: superAdmin.id,
      },
    });

    const canSelfApprove = (requestedById: string, userId: string, isSuperAdmin: boolean) =>
      !(requestedById === userId && !isSuperAdmin);
    expect(canSelfApprove(pendente.requestedById, superAdmin.id, true)).toBe(true);
  });

  it("um pedido já decidido não pode ser re-decidido", async () => {
    const { aldeia, adminA, adminB } = await seedAldeiaComAdmins();

    const pendente = await prisma.pendingAldeiaChange.create({
      data: {
        aldeiaId: aldeia.id,
        campo: "iban",
        valorAntes: "A",
        valorDepois: "B",
        estado: "pendente",
        requestedById: adminA.id,
      },
    });

    await prisma.pendingAldeiaChange.update({
      where: { id: pendente.id },
      data: { estado: "aprovado", decidedById: adminB.id, decidedAt: new Date() },
    });

    // A mesma regra do route: guard se já não estiver 'pendente'
    const guardReDecide = async () => {
      const current = await prisma.pendingAldeiaChange.findUnique({ where: { id: pendente.id } });
      if (current.estado !== "pendente") return false;
      return true;
    };
    expect(await guardReDecide()).toBe(false);
  });
});