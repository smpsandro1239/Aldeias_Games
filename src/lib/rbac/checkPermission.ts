import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
// @ts-ignore
import { PermissionKey } from "@prisma/client";
import { resolvePermissions } from "./resolvePermissions";

/**
 * Middleware para verificar permissões de um utilizador.
 * 
 * Uso:
 *   await checkPermission(userId, "CREATE_JOGO", aldeiaId);
 */
export async function checkPermission(
  userId: string,
  permission: PermissionKey,
  aldeiaId?: string
) {
  const result = await resolvePermissions(userId, aldeiaId);

  const has = result.permissions.includes(permission);

  if (!has) {
    const msg = `Acesso negado: o utilizador ${userId} não tem a permissão ${permission}` +
                (aldeiaId ? ` na aldeia ${aldeiaId}` : "");

    throw new Error(msg);
  }

  return true;
}

/**
 * Helper para verificar múltiplas permissões (todas necessárias)
 */
export async function requireAllPermissions(
  userId: string,
  permissions: PermissionKey[],
  aldeiaId?: string
) {
  for (const perm of permissions) {
    await checkPermission(userId, perm, aldeiaId);
  }
  return true;
}

/**
 * Helper para verificar múltiplas permissões (qualquer uma)
 */
export async function requireAnyPermission(
  userId: string,
  permissions: PermissionKey[],
  aldeiaId?: string
) {
  const result = await resolvePermissions(userId, aldeiaId);

  const ok = permissions.some((p) => result.permissions.includes(p));

  if (!ok) {
    throw new Error(
      `Acesso negado: o utilizador ${userId} não possui nenhuma das permissões necessárias: ${permissions.join(", ")}`
    );
  }

  return true;
}

/**
 * API route guard — returns null if authorized, NextResponse 403 if not.
 * Usage in API routes:
 *   const denied = await requirePermission(user.id, "CREATE_JOGO", aldeiaId);
 *   if (denied) return denied;
 */
export async function requirePermission(
  userId: string,
  permission: PermissionKey,
  aldeiaId?: string
): Promise<NextResponse | null> {
  try {
    await checkPermission(userId, permission, aldeiaId);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Acesso negado: permissão insuficiente" },
      { status: 403 }
    );
  }
}

/**
 * API route guard — returns null if user has ANY of the permissions, NextResponse 403 if not.
 */
export async function requireAnyOfPermissions(
  userId: string,
  permissions: PermissionKey[],
  aldeiaId?: string
): Promise<NextResponse | null> {
  try {
    await requireAnyPermission(userId, permissions, aldeiaId);
    return null;
  } catch {
    return NextResponse.json(
      { error: "Acesso negado: permissão insuficiente" },
      { status: 403 }
    );
  }
}
