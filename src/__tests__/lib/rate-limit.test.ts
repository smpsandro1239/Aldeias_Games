// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../helpers/test-db";

describe("Rate Limiting", () => {
  let prisma: any;
  let checkRateLimit: any;
  let getClientIdentifier: any;
  let createRateLimitResponse: any;
  let rateLimitConfigs: any;
  let cleanupExpiredRateLimits: any;

  beforeAll(async () => {
    // A lib de rate-limit importa @/lib/db em módulo — importar DEPOIS de
    // apontar DATABASE_URL para a DB de teste (SQLite temporária)
    setupTestDatabase();
    const db = await import("@/lib/db");
    const rl = await import("@/lib/rate-limit");
    prisma = db.prisma;
    checkRateLimit = rl.checkRateLimit;
    getClientIdentifier = rl.getClientIdentifier;
    createRateLimitResponse = rl.createRateLimitResponse;
    rateLimitConfigs = rl.rateLimitConfigs;
    cleanupExpiredRateLimits = rl.cleanupExpiredRateLimits;

    await prisma.rateLimit.deleteMany();
  });

  afterAll(async () => {
    await prisma?.$disconnect?.();
    teardownTestDatabase();
  });

  describe("checkRateLimit", () => {
    it("deve permitir requests dentro do limite", async () => {
      const result = await checkRateLimit("test-ip-1-v2", rateLimitConfigs.login);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 max - 1 used
    });

    it("deve bloquear após exceder limite", async () => {
      const identifier = "test-ip-block-v2";
      const config = { maxRequests: 2, windowMs: 60000 };

      const result1 = await checkRateLimit(identifier, config);
      expect(result1.allowed).toBe(true);

      const result2 = await checkRateLimit(identifier, config);
      expect(result2.allowed).toBe(true);

      const result3 = await checkRateLimit(identifier, config);
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

  describe("cleanupExpiredRateLimits", () => {
    it("deve limpar apenas entradas expiradas", async () => {
      await prisma.rateLimit.createMany({
        data: [
          { key: "rl:expired-key:60000", count: 5, expiresAt: new Date(Date.now() - 1000) },
          { key: "rl:active-key:60000", count: 2, expiresAt: new Date(Date.now() + 60000) },
        ],
      });

      const deleted = await cleanupExpiredRateLimits();

      expect(deleted).toBe(1);

      const remaining = await prisma.rateLimit.findMany({ select: { key: true } });
      expect(remaining.map((r: { key: string }) => r.key)).toContain("rl:active-key:60000");
      expect(remaining.map((r: { key: string }) => r.key)).not.toContain("rl:expired-key:60000");
    });

    it("deve devolver 0 sem erros quando a tabela está vazia", async () => {
      await prisma.rateLimit.deleteMany();
      const deleted = await cleanupExpiredRateLimits();
      expect(deleted).toBe(0);
    });
  });
});
