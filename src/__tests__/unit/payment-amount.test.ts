import { describe, expect, it } from "vitest";
import { amountMatches } from "@/lib/payment-amount";

describe("amountMatches", () => {
  it("aceita montantes equivalentes ao cêntimo", () => {
    expect(amountMatches(12, 12.0)).toBe(true);
    expect(amountMatches(12.34, 12.3400000001)).toBe(true);
  });

  it("rejeita montantes diferentes ao cêntimo", () => {
    expect(amountMatches(12.34, 12.35)).toBe(false);
    expect(amountMatches(12.35, 12.34)).toBe(false);
  });

  it("rejeita montantes não finitos, nulos ou negativos", () => {
    expect(amountMatches(0, 0)).toBe(false);
    expect(amountMatches(-1, 1)).toBe(false);
    expect(amountMatches(1, Number.NaN)).toBe(false);
    expect(amountMatches(1, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
