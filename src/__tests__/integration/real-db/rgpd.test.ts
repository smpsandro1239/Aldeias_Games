// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real DB: RGPD — anonimização automática e purga", () => {
  let prisma: any;
  let anonymizeParticipacoes: any;
  let purgeOldData: any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    const rgpd = await import("@/lib/rgpd");
    anonymizeParticipacoes = rgpd.anonymizeParticipacoes;
    purgeOldData = rgpd.purgeOldData;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function seedParticipacao(diasAtras: number, comCliente: boolean) {
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: `Aldeia RGPD ${Date.now()}`,
        slug: `aldeia-rgpd-${Date.now()}`,
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: `rgpd-${Date.now()}@aldeia.pt`,
        morada: "Rua RGPD, 1",
      },
    });
    const evento = await prisma.evento.create({
      data: {
        nome: `Evento RGPD ${Date.now()}`,
        slug: `evento-rgpd-${Date.now()}`,
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });
    const jogo = await prisma.jogo.create({
      data: {
        nome: `Jogo RGPD ${Date.now()}`,
        tipo: "raspadinha",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        aldeiaId: aldeia.id,
        eventoId: evento.id,
        configuracao: "{}",
      },
    });
    const createdAt = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);
    return prisma.participacao.create({
      data: {
        jogoId: jogo.id,
        valorPago: 2,
        metodoPagamento: "dinheiro",
        estadoPagamento: "concluido",
        dataPagamento: createdAt,
        createdAt,
        dadosParticipacao: "{}",
        nomeCliente: comCliente ? "Cliente Joao" : null,
        telefoneCliente: comCliente ? "912345678" : null,
        emailCliente: comCliente ? "cliente@mail.pt" : null,
      },
    });
  }

  it("anonimiza participações com mais de 365 dias e regista auditoria", async () => {
    const antiga = await seedParticipacao(400, true);
    const recente = await seedParticipacao(10, true);

    const result = await anonymizeParticipacoes(prisma, 365);
    expect(result.anonimizadas).toBeGreaterThanOrEqual(1);

    const a = await prisma.participacao.findUnique({ where: { id: antiga.id } });
    expect(a.nomeCliente).toBeNull();
    expect(a.telefoneCliente).toBeNull();
    expect(a.emailCliente).toBeNull();

    // A recente fica intacta (dentro do prazo de retenção)
    const r = await prisma.participacao.findUnique({ where: { id: recente.id } });
    expect(r.nomeCliente).toBe("Cliente Joao");

    const audit = await prisma.auditLog.findFirst({
      where: { action: "RGPD_ANONIMIZACAO", resourceId: antiga.id },
    });
    expect(audit).toBeTruthy();
  });

  it("participações sem dados de cliente não são tocadas (idempotente)", async () => {
    const semDados = await seedParticipacao(400, false);

    const result = await anonymizeParticipacoes(prisma, 365);
    expect(result.anonimizadas).toBe(0);

    const p = await prisma.participacao.findUnique({ where: { id: semDados.id } });
    expect(p.nomeCliente).toBeNull();
  });

  it("purga remove webhooks completed antigos e notificações lidas antigas", async () => {
    const whOld = await prisma.webhookEvent.create({
      data: {
        provider: "stripe",
        eventId: `ev-old-${Date.now()}`,
        status: "completed",
        createdAt: new Date(Date.now() - 400 * 86400000),
      },
    });
    const whFresh = await prisma.webhookEvent.create({
      data: { provider: "stripe", eventId: `ev-fresh-${Date.now()}`, status: "completed" },
    });

    const user = await prisma.user.create({
      data: { nome: "RGPD User", email: `rgpd-u-${Date.now()}@teste.pt`, password: "$2a$10$fakehash", role: "user", saldo: 0 },
    });
    const notifOld = await prisma.notificacao.create({
      data: {
        userId: user.id,
        tipo: "sistema",
        titulo: "antiga",
        mensagem: "x",
        lida: true,
        createdAt: new Date(Date.now() - 200 * 86400000),
      },
    });
    const notifFresh = await prisma.notificacao.create({
      data: { userId: user.id, tipo: "sistema", titulo: "nova", mensagem: "x", lida: true },
    });

    const result = await purgeOldData(prisma, 365, 180);
    expect(result.webhooks).toBeGreaterThanOrEqual(1);

    expect(await prisma.webhookEvent.findUnique({ where: { id: whOld.id } })).toBeNull();
    expect(await prisma.webhookEvent.findUnique({ where: { id: whFresh.id } })).toBeTruthy();
    expect(await prisma.notificacao.findUnique({ where: { id: notifOld.id } })).toBeNull();
    expect(await prisma.notificacao.findUnique({ where: { id: notifFresh.id } })).toBeTruthy();

    const audit = await prisma.auditLog.findFirst({ where: { action: "RGPD_PURGA" } });
    expect(audit).toBeTruthy();
  });
});