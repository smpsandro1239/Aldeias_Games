// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real DB: RBAC com papéis e permissões reais", () => {
  let prisma: any;
  let resolvePermissions: any;
  let requirePermission: any;
  let requireAnyOfPermissions: any;

  let aldeiaId: string;
  let userId: string;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const rbac = await import("@/lib/rbac/resolvePermissions");
    const guard = await import("@/lib/rbac/checkPermission");
    resolvePermissions = rbac.resolvePermissions;
    requirePermission = guard.requirePermission;
    requireAnyOfPermissions = guard.requireAnyOfPermissions;

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia RBAC",
        slug: "aldeia-rbac",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "rbac@aldeia.pt",
        morada: "Rua RBAC, 2",
      },
    });
    aldeiaId = aldeia.id;

    const user = await prisma.user.create({
      data: {
        nome: "Utilizador RBAC",
        email: "rbac@teste.pt",
        password: "$2b$10$fakehash",
        role: "user",
        aldeiaId,
        saldo: 0,
      },
    });
    userId = user.id;

    const permManage = await prisma.permission.create({
      data: { key: "MANAGE_ALDEIA", description: "Gerir aldeia" },
    });
    const permView = await prisma.permission.create({
      data: { key: "VIEW_ALDEIA", description: "Ver aldeia" },
    });
    const permVenda = await prisma.permission.create({
      data: { key: "EXECUTE_VENDA", description: "Executar venda" },
    });

    const roleAdmin = await prisma.role.create({
      data: { name: "ALDEIA_ADMIN", description: "Admin de aldeia" },
    });
    const roleColaborador = await prisma.role.create({
      data: { name: "COLABORADOR", description: "Colaborador" },
    });

    await prisma.rolePermission.createMany({
      data: [
        { roleId: roleAdmin.id, permissionId: permManage.id },
        { roleId: roleAdmin.id, permissionId: permView.id },
        { roleId: roleColaborador.id, permissionId: permVenda.id },
      ],
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("resolve permissões herdadas de um role global", async () => {
    const roleAdmin = await prisma.role.findUnique({
      where: { name: "ALDEIA_ADMIN" },
    });

    await prisma.userGlobalRole.create({
      data: { userId, roleId: roleAdmin.id },
    });

    const result = await resolvePermissions(userId);
    expect(result.roles).toContain("ALDEIA_ADMIN");
    expect(result.permissions).toContain("MANAGE_ALDEIA");
    expect(result.permissions).toContain("VIEW_ALDEIA");
    expect(result.hasPermission("MANAGE_ALDEIA")).toBe(true);
  });

  it("requirePermission autoriza com permissão válida e nega sem ela", async () => {
    const authorized = await requirePermission(userId, "MANAGE_ALDEIA");
    expect(authorized).toBeNull();

    const denied = await requirePermission(userId, "EXECUTE_VENDA");
    expect(denied).not.toBeNull();
    expect(denied.status).toBe(403);
  });

  it("requireAnyOfPermissions passa com qualquer uma das permissões", async () => {
    const ok = await requireAnyOfPermissions(userId, ["EXECUTE_VENDA", "MANAGE_ALDEIA"]);
    expect(ok).toBeNull();
  });

  it("override userPermission com allow=false remove a permissão", async () => {
    const permManage = await prisma.permission.findUnique({
      where: { key: "MANAGE_ALDEIA" },
    });

    await prisma.userPermission.create({
      data: {
        userId,
        permissionId: permManage.id,
        aldeiaId: null,
        allow: false,
      },
    });

    const result = await resolvePermissions(userId);
    expect(result.permissions).not.toContain("MANAGE_ALDEIA");
    expect(result.denied).toContain("MANAGE_ALDEIA");
    expect(result.hasPermission("MANAGE_ALDEIA")).toBe(false);

    const denied = await requirePermission(userId, "MANAGE_ALDEIA");
    expect(denied).not.toBeNull();
    expect(denied.status).toBe(403);

    await prisma.userPermission.deleteMany({ where: { userId } });
  });

  it("role de aldeia específica só resolve permissões dentro dessa aldeia", async () => {
    const roleColaborador = await prisma.role.findUnique({
      where: { name: "COLABORADOR" },
    });
    const permVenda = await prisma.permission.findUnique({
      where: { key: "EXECUTE_VENDA" },
    });

    await prisma.userAldeiaRole.create({
      data: { userId, aldeiaId, roleId: roleColaborador.id },
    });

    const global = await resolvePermissions(userId);
    expect(global.permissions).toContain("EXECUTE_VENDA");

    const scoped = await resolvePermissions(userId, aldeiaId);
    expect(scoped.permissions).toContain("EXECUTE_VENDA");
    expect(scoped.roles).toContain("COLABORADOR");

    const denied = await requireAnyOfPermissions(userId, ["EXECUTE_VENDA"]);
    expect(denied).toBeNull();
    expect(permVenda).toBeTruthy();
  });
});
