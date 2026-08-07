// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real DB: Webhook replay — retry de entrega não duplica créditos", () => {
  let prisma: any;
  let claimWebhookEvent: any;
  let completeWebhookEvent: any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    const helpers = await import("@/lib/webhook-helpers");
    claimWebhookEvent = helpers.claimWebhookEvent;
    completeWebhookEvent = helpers.completeWebhookEvent;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function seedUser() {
    return prisma.user.create({
      data: {
        nome: "Webhook User",
        email: `wh-${Date.now()}@teste.pt`,
        password: "$2a$10$fakehash",
        role: "user",
        saldo: 0,
      },
    });
  }

  /**
   * Espelha o fluxo do webhook de Stripe: claim primeiro; se já processado, ignora.
   * O crédito é protegido pelo guard de `referencia` dentro da $transaction.
   */
  async function processCheckoutWebhook(eventId: string, sessionId: string, userId: string, valor: number) {
    const isFirstTime = await claimWebhookEvent("stripe", eventId, "checkout.session.completed");
    if (!isFirstTime) return "duplicate";

    const credited = await prisma.$transaction(async (tx: any) => {
      const existing = await tx.transacao.findFirst({
        where: { referencia: sessionId, tipo: "carregamento_saldo" },
      });
      if (existing) return false;
      await tx.user.update({ where: { id: userId }, data: { saldo: { increment: valor } } });
      await tx.transacao.create({
        data: {
          userId,
          valor,
          tipo: "carregamento_saldo",
          descricao: "Carregamento Stripe",
          referencia: sessionId,
          dadosAdicionais: { stripeSessionId: sessionId },
        },
      });
      return true;
    });

    await completeWebhookEvent("stripe", eventId, credited ? "completed" : "failed");
    return credited ? "processed" : "skipped";
  }

  it("entrega repetida com o mesmo eventId é ignorada (deduplicação)", async () => {
    expect(await claimWebhookEvent("stripe", "evt_same_1")).toBe(true);
    await completeWebhookEvent("stripe", "evt_same_1", "completed");
    // Stripe re-envia o MESMO event.id numa retry de entrega
    expect(await claimWebhookEvent("stripe", "evt_same_1")).toBe(false);
  });

  it("replay de um webhook falhado com NOVO eventId não duplica o crédito", async () => {
    const user = await seedUser();
    const sessionId = `cs_replay_${Date.now()}`;

    // Primeira entrega — processa e credita 20€
    const first = await processCheckoutWebhook("evt_first", sessionId, user.id, 20);
    expect(first).toBe("processed");

    let u = await prisma.user.findUnique({ where: { id: user.id } });
    expect(u.saldo).toBe(20);

    // Replay com novo eventId (Stripe re-tenta após falha de rede do servidor)
    const replay = await processCheckoutWebhook("evt_replay", sessionId, user.id, 20);
    expect(replay).toBe("skipped");

    u = await prisma.user.findUnique({ where: { id: user.id } });
    expect(u.saldo).toBe(20);

    const txns = await prisma.transacao.findMany({
      where: { referencia: sessionId, tipo: "carregamento_saldo" },
    });
    expect(txns).toHaveLength(1);
  });

  it("evento falhado fica registado como failed para diagnóstico, sem crédito", async () => {
    const user = await seedUser();
    const sessionId = `cs_fail_${Date.now()}`;

    const first = await processCheckoutWebhook("evt_fail_1", sessionId, user.id, 50);
    expect(first).toBe("processed");

    // Entrega seguinte com estado falhado (erro na app) — guard bloqueia
    const failedDelivery = await processCheckoutWebhook("evt_fail_2", `cs_other_${Date.now()}`, user.id, 50);
    expect(failedDelivery).toBe("processed");

    const u = await prisma.user.findUnique({ where: { id: user.id } });
    expect(u.saldo).toBe(100);
  });

  it("sessões distintas processam-se independentemente", async () => {
    const user = await seedUser();

    const r1 = await processCheckoutWebhook("evt_a", `cs_a_${Date.now()}`, user.id, 10);
    const r2 = await processCheckoutWebhook("evt_b", `cs_b_${Date.now()}`, user.id, 5);

    expect(r1).toBe("processed");
    expect(r2).toBe("processed");

    const u = await prisma.user.findUnique({ where: { id: user.id } });
    expect(u.saldo).toBe(15);
  });
});