import prisma from "@/lib/db";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "payment"
  | "config_change"
  | "export_data";

export type AuditResource =
  | "user"
  | "evento"
  | "jogo"
  | "pagamento"
  | "config"
  | "aldeia"
  | "participacao"
  | "entrega_saldo";

/**
 * Registrar ação de auditoria
 */
export async function logAudit(
  userId: string,
  action: AuditAction,
  resourceType: AuditResource,
  resourceId?: string,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>,
  ip?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ip: ip ?? "unknown",
        userAgent: userAgent ?? "unknown",
      },
    });
  } catch (error) {
    // Non-blocking: if audit fails, we don't want to break the main flow
    console.error("Audit log failed:", error);
  }
}

/**
 * Helper to get client IP from request (Next.js)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Query audit logs for a specific user (for user's own history)
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  createdAt: Date;
  ip: string;
}>> {
  return await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      resourceType: true,
      resourceId: true,
      createdAt: true,
      ip: true,
    },
  });
}
