import { describe, expect, it } from "vitest";
import { processWebhookCallback } from "@/lib/mbway";

const basePayload = {
  transactionId: "mbway-123",
  reference: "AG-123",
  amount: 10,
  phoneNumber: "+351912345678",
  timestamp: "2026-11-17T12:00:00.000Z",
};

describe("processWebhookCallback", () => {
  it.each(["completed", "failed", "cancelled"] as const)(
    "reconhece callbacks válidos com estado %s",
    (status) => {
      const result = processWebhookCallback({ ...basePayload, status });
      expect(result.success).toBe(true);
      expect(result.status).toBe(status);
    }
  );

  it("rejeita um callback sem referência e não lança exceção", () => {
    const result = processWebhookCallback({
      ...basePayload,
      reference: "",
      status: "completed",
    });
    expect(result.success).toBe(false);
    expect(result.reference).toBe("");
  });

  it("permite callbacks de falha sem montante positivo", () => {
    const result = processWebhookCallback({
      ...basePayload,
      amount: 0,
      status: "failed",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita callback concluído sem montante positivo", () => {
    const result = processWebhookCallback({
      ...basePayload,
      amount: 0,
      status: "completed",
    });
    expect(result.success).toBe(false);
  });
});
