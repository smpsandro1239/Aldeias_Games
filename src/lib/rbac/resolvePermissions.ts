// src/lib/rbac/resolvePermissions.ts
import { PrismaClient, PermissionKey, RoleName } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Resolve todas as permissões efetivas de um utilizador,
 * combinando:
 *  - roles globais
 *  - roles por aldeia
 *  - permissões herdadas dos roles
 *  - overrides individuais (globais e por aldeia)
 *  - regra: deny > allow
 */
export async function resolvePermissions(userId: string, aldeiaId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      globalRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      aldeiaRoles: {
        where: aldeiaId ? { aldeiaId } : undefined,
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      userPermissions: {
        where: aldeiaId
          ? {
              OR: [
                { aldeiaId },      // overrides específicos da aldeia
                { aldeiaId: null } // overrides globais
              ],
            }
          : {
              aldeiaId: null,      // só globais se não houver aldeia
            },
        include: { permission: true },
      },
    },
  });

  if (!user) {
    throw new Error("Utilizador não encontrado");
  }

  // 1. Roles efetivos
  const roles: RoleName[] = [
    ...user.globalRoles.map((r) => r.role.name),
    ...user.aldeiaRoles.map((r) => r.role.name),
  ];

  // 2. Permissões herdadas dos roles
  const inheritedPermissions = new Set<PermissionKey>();

  for (const gr of user.globalRoles) {
    for (const rp of gr.role.rolePermissions) {
      inheritedPermissions.add(rp.permission.key);
    }
  }

  for (const ar of user.aldeiaRoles) {
    for (const rp of ar.role.rolePermissions) {
      inheritedPermissions.add(rp.permission.key);
    }
  }

  // 3. Overrides individuais (allow / deny)
  const effectivePermissions = new Set<PermissionKey>(inheritedPermissions);
  const deniedPermissions = new Set<PermissionKey>();

  for (const up of user.userPermissions) {
    const key = up.permission.key;

    if (up.allow) {
      // só aplica allow se ainda não tiver sido explicitamente negado
      if (!deniedPermissions.has(key)) {
        effectivePermissions.add(key);
      }
    } else {
      // deny tem prioridade: remove de effective e marca como negado
      effectivePermissions.delete(key);
      deniedPermissions.add(key);
    }
  }

  const permissions = Array.from(effectivePermissions);

  return {
    userId,
    aldeiaId: aldeiaId ?? null,
    roles,
    permissions,
    denied: Array.from(deniedPermissions),
    hasPermission: (key: PermissionKey) => effectivePermissions.has(key),
  };
}
