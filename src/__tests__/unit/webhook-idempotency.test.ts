// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock prisma before imports
vi.mock("@/lib/db", () => ({
  prisma: {
    webhookEvent: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    participacao: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

import { claimWebhookEvent, completeWebhookEvent } from "@/lib/webhook-helpers";
import { prisma } from "@/lib/db";

type MockFn = ReturnType<typeof vi.fn>;
const mockPrisma = {
  webhookEvent: {
    create: prisma.webhookEvent.create as unknown as MockFn,
    updateMany: prisma.webhookEvent.updateMany as unknown as MockFn,
    findFirst: prisma.webhookEvent.findFirst as unknown as MockFn,
  },
};

describe("Webhook Idempotency - WebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("claimWebhookEvent", () => {
    it("should return true for first-time event (claim succeeds)", async () => {
      mockPrisma.webhookEvent.create.mockResolvedValue({
        id: "we-1",
        provider: "stripe",
        eventId: "evt_123",
        tipo: "participacao",
        status: "processing",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await claimWebhookEvent("stripe", "evt_123", "participacao");

      expect(result).toBe(true);
      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
        data: {
          provider: "stripe",
          eventId: "evt_123",
          tipo: "participacao",
          status: "processing",
          metadata: undefined,
        },
      });
    });

    it("should return false for duplicate event (P2002 unique violation)", async () => {
      const uniqueError = new Error("Unique constraint failed") as Error & {
        code: string;
      };
      uniqueError.code = "P2002";
      mockPrisma.webhookEvent.create.mockRejectedValue(uniqueError);

      const result = await claimWebhookEvent("stripe", "evt_duplicate");

      expect(result).toBe(false);
    });

    it("should rethrow non-P2002 errors", async () => {
      const dbError = new Error("Connection refused");
      mockPrisma.webhookEvent.create.mockRejectedValue(dbError);

      await expect(
        claimWebhookEvent("stripe", "evt_123")
      ).rejects.toThrow("Connection refused");
    });

    it("should work with MBWay provider", async () => {
      mockPrisma.webhookEvent.create.mockResolvedValue({
        id: "we-2",
        provider: "mbway",
        eventId: "tx_abc",
        tipo: "carregamento_saldo",
        status: "processing",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await claimWebhookEvent(
        "mbway",
        "tx_abc",
        "carregamento_saldo"
      );

      expect(result).toBe(true);
      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
        data: {
          provider: "mbway",
          eventId: "tx_abc",
          tipo: "carregamento_saldo",
          status: "processing",
          metadata: undefined,
        },
      });
    });

    it("should pass metadata when provided", async () => {
      mockPrisma.webhookEvent.create.mockResolvedValue({
        id: "we-3",
        provider: "stripe",
        eventId: "evt_meta",
        tipo: null,
        status: "processing",
        metadata: { amount: 100 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await claimWebhookEvent("stripe", "evt_meta", undefined, {
        amount: 100,
      });

      expect(mockPrisma.webhookEvent.create).toHaveBeenCalledWith({
        data: {
          provider: "stripe",
          eventId: "evt_meta",
          tipo: null,
          status: "processing",
          metadata: { amount: 100 },
        },
      });
    });
  });

  describe("completeWebhookEvent", () => {
    it("should mark event as completed", async () => {
      mockPrisma.webhookEvent.updateMany.mockResolvedValue({ count: 1 });

      await completeWebhookEvent("stripe", "evt_123", "completed");

      expect(mockPrisma.webhookEvent.updateMany).toHaveBeenCalledWith({
        where: { provider: "stripe", eventId: "evt_123" },
        data: { status: "completed", metadata: undefined },
      });
    });

    it("should mark event as failed with error metadata", async () => {
      mockPrisma.webhookEvent.updateMany.mockResolvedValue({ count: 1 });

      await completeWebhookEvent("stripe", "evt_456", "failed", {
        error: "Jogo not found",
      });

      expect(mockPrisma.webhookEvent.updateMany).toHaveBeenCalledWith({
        where: { provider: "stripe", eventId: "evt_456" },
        data: {
          status: "failed",
          metadata: { error: "Jogo not found" },
        },
      });
    });

    it("should update by provider + eventId (unique pair)", async () => {
      mockPrisma.webhookEvent.updateMany.mockResolvedValue({ count: 1 });

      await completeWebhookEvent("mbway", "tx_xyz", "completed");

      expect(mockPrisma.webhookEvent.updateMany).toHaveBeenCalledWith({
        where: { provider: "mbway", eventId: "tx_xyz" },
        data: { status: "completed", metadata: undefined },
      });
    });
  });

  describe("End-to-end idempotency flow", () => {
    it("should claim → process → complete successfully", async () => {
      // Step 1: Claim
      mockPrisma.webhookEvent.create.mockResolvedValue({
        id: "we-e2e",
        provider: "stripe",
        eventId: "evt_e2e",
        tipo: "participacao",
        status: "processing",
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const claimed = await claimWebhookEvent(
        "stripe",
        "evt_e2e",
        "participacao"
      );
      expect(claimed).toBe(true);

      // Step 2: Process (simulated)

      // Step 3: Complete
      mockPrisma.webhookEvent.updateMany.mockResolvedValue({ count: 1 });
      await completeWebhookEvent("stripe", "evt_e2e", "completed");

      expect(mockPrisma.webhookEvent.updateMany).toHaveBeenCalled();
    });

    it("should reject duplicate and skip processing", async () => {
      // Step 1: First claim succeeds
      mockPrisma.webhookEvent.create.mockResolvedValueOnce({
        id: "we-first",
        provider: "stripe",
        eventId: "evt_dup",
        status: "processing",
        tipo: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const first = await claimWebhookEvent("stripe", "evt_dup");
      expect(first).toBe(true);

      // Step 2: Second claim fails (P2002)
      const uniqueError = new Error("Unique constraint") as Error & {
        code: string;
      };
      uniqueError.code = "P2002";
      mockPrisma.webhookEvent.create.mockRejectedValueOnce(uniqueError);

      const second = await claimWebhookEvent("stripe", "evt_dup");
      expect(second).toBe(false);

      // No processing should happen after duplicate rejection
    });
  });
});
