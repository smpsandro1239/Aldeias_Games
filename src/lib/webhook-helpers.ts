import { prisma } from "@/lib/db";

/**
 * Claims a webhook event for processing. Returns true if this is the first time
 * we see this event (should process), false if already seen (skip).
 *
 * Uses a unique constraint on (provider, eventId) for atomic deduplication.
 */
export async function claimWebhookEvent(
  provider: string,
  eventId: string,
  tipo?: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    await prisma.webhookEvent.create({
      data: {
        provider,
        eventId,
        tipo: tipo || null,
        status: "processing",
        metadata: metadata || undefined,
      },
    });
    return true;
  } catch (error: unknown) {
    // Unique constraint violation = duplicate event
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return false;
    }
    throw error;
  }
}

/**
 * Marks a webhook event as completed or failed.
 */
export async function completeWebhookEvent(
  provider: string,
  eventId: string,
  status: "completed" | "failed",
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.webhookEvent.updateMany({
    where: { provider, eventId },
    data: {
      status,
      ...(metadata ? { metadata } : {}),
    },
  });
}
