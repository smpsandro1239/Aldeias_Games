// src/lib/rbac/resolvePermissions.ts
// @ts-ignore
import { PrismaClient, PermissionKey, RoleName, User, UserGlobalRole, UserAldeiaRole, UserPermission, Role, RolePermission, Permission } from "@prisma/client";

const prisma = new PrismaClient();

// Tipo completo do utilizador com includes
type UserWithPermissions = User & {
  userGlobalRoles: (UserGlobalRole & {
    role: Role & {
      rolePermissions: (RolePermission & {
        permission: Permission;
      })[];
    };
  })[];
  userAldeiaRoles: (UserAldeiaRole & {
    role: Role & {
      rolePermissions: (RolePermission & {
        permission: Permission;
      })[];
    };
  })[];
  userPermissions: (UserPermission & {
    permission: Permission;
  })[];
};

/**
 * Resolve todas as permissões efetivas de um utilizador.
 */
export async function resolvePermissions(
  userId: string,
  aldeiaId?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userGlobalRoles: {
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
      userAldeiaRoles: {
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
                { aldeiaId },
                { aldeiaId: null },
              ],
            }
          : { aldeiaId: null },
        include: { permission: true },
      },
    },
  }) as UserWithPermissions | null;

  if (!user) {
    throw new Error("Utilizador não encontrado");
  }

  // 1. Roles efetivos
  const roles: RoleName[] = [
    ...user.userGlobalRoles.map((r: any) => r.role.name),
    ...user.userAldeiaRoles.map((r: any) => r.role.name),
  ];

  // 2. Permissões herdadas
  const inheritedPermissions = new Set<PermissionKey>();

  user.userGlobalRoles.forEach((gr: any) =>
    gr.role.rolePermissions.forEach((rp: any) =>
      inheritedPermissions.add(rp.permission.key)
    )
  );

  user.userAldeiaRoles.forEach((ar: any) =>
    ar.role.rolePermissions.forEach((rp: any) =>
      inheritedPermissions.add(rp.permission.key)
    )
  );

  // 3. Overrides
  const effectivePermissions = new Set<PermissionKey>(inheritedPermissions);
  const deniedPermissions = new Set<PermissionKey>();

  user.userPermissions.forEach((up: any) => {
    const key = up.permission.key;

    if (up.allow) {
      if (!deniedPermissions.has(key)) {
        effectivePermissions.add(key);
      }
    } else {
      effectivePermissions.delete(key);
      deniedPermissions.add(key);
    }
  });

  return {
    userId,
    aldeiaId: aldeiaId ?? null,
    roles,
    permissions: Array.from(effectivePermissions),
    denied: Array.from(deniedPermissions),
    hasPermission: (key: PermissionKey) => effectivePermissions.has(key),
  };
}
