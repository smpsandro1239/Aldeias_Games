// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    participacao: { count: vi.fn().mockResolvedValue(0) },
  },
}));

import { requirePermission, requireAnyOfPermissions } from "@/lib/rbac/checkPermission";
import { prisma } from "@/lib/db";

// Helper to create mock user with roles/permissions
function makeUserWithPermissions(
  permissions: string[],
  aldeiaId?: string
) {
  return {
    id: "user-1",
    email: "test@test.com",
    nome: "Test User",
    role: "user" as const,
    aldeiaId: aldeiaId || null,
    userGlobalRoles: [
      {
        roleId: "role-1",
        role: {
          id: "role-1",
          name: "MEMBRO",
          rolePermissions: permissions.map((p) => ({
            permissionId: `perm-${p}`,
            permission: { id: `perm-${p}`, key: p, description: null },
          })),
        },
      },
    ],
    userAldeiaRoles: aldeiaId
      ? [
          {
            aldeiaId,
            roleId: "role-2",
            role: {
              id: "role-2",
              name: "ALDEIA_ADMIN",
              rolePermissions: permissions.map((p) => ({
                permissionId: `perm-${p}-aldeia`,
                permission: {
                  id: `perm-${p}-aldeia`,
                  key: p,
                  description: null,
                },
              })),
            },
          },
        ]
      : [],
    userPermissions: [],
  };
}

describe("RBAC - requirePermission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when user has the required permission", async () => {
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeUserWithPermissions(["MANAGE_ALDEIA"]) as never
    );

    const result = await requirePermission("user-1", "MANAGE_ALDEIA");

    expect(result).toBeNull();
  });

  it("should return 403 when user lacks the permission", async () => {
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeUserWithPermissions(["VIEW_JOGO"]) as never
    );

    const result = await requirePermission("user-1", "MANAGE_ALDEIA");

    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    const body = await result!.json();
    expect(body.error).toContain("Acesso negado");
  });

  it("should return 403 when user not found", async () => {
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await requirePermission("nonexistent", "MANAGE_ALDEIA");

    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("should check aldeia-specific permissions when aldeiaId is provided", async () => {
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeUserWithPermissions(["MANAGE_ALDEIA"], "aldeia-1") as never
    );

    const result = await requirePermission(
      "user-1",
      "MANAGE_ALDEIA",
      "aldeia-1"
    );

    expect(result).toBeNull();
  });

  it("should return null when user has ANY of the required permissions", async () => {
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeUserWithPermissions(["EXECUTE_VENDA"]) as never
    );

    const result = await requireAnyOfPermissions("user-1", [
      "EXECUTE_VENDA",
      "MANAGE_ALDEIA",
    ]);

    expect(result).toBeNull();
  });

  it("should return 403 when user has NONE of the required permissions", async () => {
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeUserWithPermissions(["VIEW_JOGO"]) as never
    );

    const result = await requireAnyOfPermissions("user-1", [
      "EXECUTE_VENDA",
      "MANAGE_ALDEIA",
    ]);

    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });
});

describe("RBAC - hasRole (legacy)", () => {
  it("should return true when role matches", async () => {
    const { hasRole } = await import("@/lib/auth");
    expect(hasRole("super_admin", ["super_admin", "aldeia_admin"])).toBe(true);
  });

  it("should return false when role does not match", async () => {
    const { hasRole } = await import("@/lib/auth");
    expect(hasRole("user", ["super_admin", "aldeia_admin"])).toBe(false);
  });

  it("should return true for exact role match", async () => {
    const { hasRole } = await import("@/lib/auth");
    expect(hasRole("vendedor", ["vendedor"])).toBe(true);
  });

  it("should return false for empty roles array", async () => {
    const { hasRole } = await import("@/lib/auth");
    expect(hasRole("super_admin", [])).toBe(false);
  });
});
