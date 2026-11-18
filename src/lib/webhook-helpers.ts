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
        metadata: (metadata || undefined) as any,
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
      // Um evento concluído ou já em processamento continua a ser duplicado.
      // Um evento failed pode ser reclamado por compare-and-swap para permitir
      // retry após falhas transitórias sem permitir dois workers em simultâneo.
      const retried = await prisma.webhookEvent.updateMany({
        where: { provider, eventId, status: "failed" },
        data: {
          status: "processing",
          ...(tipo ? { tipo } : {}),
          ...(metadata ? { metadata: metadata as any } : {}),
        },
      });
      return retried.count === 1;
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
      ...(metadata ? { metadata: metadata as any } : {}),
    },
  });
}
