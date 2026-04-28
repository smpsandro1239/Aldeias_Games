import prisma from "@/lib/db";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "payment"
  | "config_change"
  | "export_data"
  | "permission_change";

export type AuditResource = "user" | "evento" | "jogo" | "aldeia" | "pagamento" | "config" | "participacao";

/**
 * Registrar ação de auditoria
 */
export async function logAudit(
  userId: string,
  action: AuditAction,
  resource: AuditResource,
  resourceId?: string,
  metadata?: Record<string, any> | null, // para old/new values, detalhes
  ip?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Detecta aldeiaId baseado no contexto (opcional - pode ser inferido do user ou resource)
    letaldeiaId: string | undefined;
    // Se o recurso for relacionado a uma aldeia, podemos tentar preencher (ex: evento, jogo)
    // Isso exigiria buscar o recurso; por simplicidade, deixamos null por agora.
    
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        ip: ip ?? "unknown",
        userAgent: userAgent ?? "unknown",
        metadata: metadata ? JSON.stringify(metadata) : null,
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
  resource: string;
  resourceId?: string;
  createdAt: Date;
  ip: string;
  metadata?: any;
}>> {
  return await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      createdAt: true,
      ip: true,
      metadata: true,
    },
  });
}

