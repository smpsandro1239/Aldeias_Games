import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
  rateLimitConfigs,
} from "@/lib/rate-limit";

describe("Rate Limiting", () => {
  describe("checkRateLimit", () => {
    it("deve permitir requests dentro do limite", () => {
      const result = checkRateLimit("test-ip-1", rateLimitConfigs.login);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 max - 1 used
    });

    it("deve bloqueir após exceder limite", () => {
      const identifier = "test-ip-block";
      const config = { maxRequests: 2, windowMs: 60000 };

      const result1 = checkRateLimit(identifier, config);
      expect(result1.allowed).toBe(true);

      const result2 = checkRateLimit(identifier, config);
      expect(result2.allowed).toBe(true);

      const result3 = checkRateLimit(identifier, config);
      expect(result3.allowed).toBe(false);
      expect(result3.remaining).toBe(0);
    });

    it("deve ter janela de 15 minutos para login", () => {
      expect(rateLimitConfigs.login.windowMs).toBe(15 * 60 * 1000);
      expect(rateLimitConfigs.login.maxRequests).toBe(5);
    });
  });

  describe("createRateLimitResponse", () => {
    it("deve criar resposta 429 com retry-after", () => {
      const futureTime = Date.now() + 60000;
      const response = createRateLimitResponse(futureTime);

      expect(response.status).toBe(429);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
