// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real DB: Idempotência de Webhooks (Stripe + MBWay)", () => {
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

  it("claim é true na primeira ocorrência e false em duplicado", async () => {
    const first = await claimWebhookEvent("stripe", "evt_001");
    expect(first).toBe(true);

    const duplicate = await claimWebhookEvent("stripe", "evt_001");
    expect(duplicate).toBe(false);

    const count = await prisma.webhookEvent.count({
      where: { provider: "stripe", eventId: "evt_001" },
    });
    expect(count).toBe(1);
  });

  it("complete marca o evento como completed e guarda metadata", async () => {
    const claimed = await claimWebhookEvent("mbway", "evt_abc", "carregamento_saldo", {
      valor: 10,
    });
    expect(claimed).toBe(true);

    await completeWebhookEvent("mbway", "evt_abc", "completed", { processado: true });

    const evento = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: { provider: "mbway", eventId: "evt_abc" },
      },
    });
    expect(evento.status).toBe("completed");
    expect(evento.tipo).toBe("carregamento_saldo");
    expect(evento.metadata.processado).toBe(true);
  });

  it("complete marca o evento como failed", async () => {
    await claimWebhookEvent("stripe", "evt_fail");
    await completeWebhookEvent("stripe", "evt_fail", "failed", { erro: "timeout" });

    const evento = await prisma.webhookEvent.findUnique({
      where: {
        provider_eventId: { provider: "stripe", eventId: "evt_fail" },
      },
    });
    expect(evento.status).toBe("failed");
    expect(evento.metadata.erro).toBe("timeout");
  });

  it("o mesmo eventId de providers diferentes não colide", async () => {
    await claimWebhookEvent("stripe", "evt_same");
    const mbwayClaim = await claimWebhookEvent("mbway", "evt_same");
    expect(mbwayClaim).toBe(true);

    const total = await prisma.webhookEvent.count({
      where: { eventId: "evt_same" },
    });
    expect(total).toBe(2);
  });

  it("eventos com eventId diferentes são processados independentemente", async () => {
    const a = await claimWebhookEvent("mbway", "evt_a");
    const b = await claimWebhookEvent("mbway", "evt_b");
    expect(a).toBe(true);
    expect(b).toBe(true);
  });
});
