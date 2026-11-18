import { prisma } from "@/lib/db";

/**
 * Claims a webhook event for processing. Returns true for a new event or
 * when atomically reclaiming a previously failed event. Completed or currently
 * processing events return false.
 *
 * Uses the unique (provider, eventId) constraint and a conditional update to
 * prevent concurrent retries from claiming the same failed event.
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
