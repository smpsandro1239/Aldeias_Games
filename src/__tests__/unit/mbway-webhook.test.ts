import { describe, expect, it } from "vitest";
import { processWebhookCallback, validateWebhookSignature } from "@/lib/mbway";
import { createHmac } from "crypto";

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


describe("validateWebhookSignature", () => {
  const secret = "segredo-de-teste-mbway";
  const payload = JSON.stringify({ transactionId: "mbway-123", amount: 10 });
  const validSignature = createHmac("sha256", secret).update(payload).digest("hex");

  it("aceita uma assinatura HMAC-SHA256 válida", () => {
    expect(validateWebhookSignature(payload, validSignature, secret)).toBe(true);
  });

  it("rejeita assinatura adulterada ou com comprimento inválido", () => {
    expect(validateWebhookSignature(payload, "0".repeat(64), secret)).toBe(false);
    expect(validateWebhookSignature(payload, "abc", secret)).toBe(false);
  });

  it("rejeita assinatura ou segredo vazios", () => {
    expect(validateWebhookSignature(payload, "", secret)).toBe(false);
    expect(validateWebhookSignature(payload, validSignature, "")).toBe(false);
  });
});
