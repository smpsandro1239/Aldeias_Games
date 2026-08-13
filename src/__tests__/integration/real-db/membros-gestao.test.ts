// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

const mocks = vi.hoisted(() => ({ user: null as any }));

vi.mock("@/lib/auth", () => ({
  getFullUserFromRequest: async () => mocks.user,
  getUserFromRequest: async () =>
    mocks.user
      ? { userId: mocks.user.id, role: mocks.user.role, aldeiaId: mocks.user.aldeiaId ?? null }
      : null,
  hashPassword: async (p: string) => `hashed:${p}`,
  verifyToken: async () =>
    mocks.user
      ? { userId: mocks.user.id, role: mocks.user.role, aldeiaId: mocks.user.aldeiaId ?? null }
      : null,
}));

describe("Real DB: Gestão de membros da aldeia", () => {
  let prisma: any;
  let registarPOST: any;
  let aldeia: any;
  let roles: Record<string, string> = {}; // name -> id

  const req = (body: unknown, _params?: Record<string, string>) =>
    ({
      json: async () => body,
      headers: new Headers(),
      url: "http://test",
    }) as any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    const route = await import("@/app/api/aldeias/[id]/membros/registar/route");
    registarPOST = route.POST;

    aldeia = await prisma.aldeia.create({
      data: { nome: "Aldeia Membros", slug: "aldeia-membros", tipoOrganizacao: "aldeia", email: "m@b.pt" },
    });

    // Utilizador real do AuditLog (FK userId) — id coincide com o mock dos testes
    await prisma.user.create({
      data: { id: "super1", nome: "Super", email: "super@m.pt", password: "hashed:x", role: "super_admin", saldo: 0 },
    });
    for (const name of ["ALDEIA_ADMIN", "MODERADOR", "COLABORADOR", "MEMBRO"]) {
      const r = await prisma.role.create({ data: { name, description: name } });
      roles[name] = r.id;
    }
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe("POST /membros/registar", () => {
    it("cria utilizador com password hashed + UserAldeiaRole + AuditLog", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const res = await registarPOST(
        req(
          { nome: "Novo Membro", email: "novo@teste.pt", password: "SenhaMuito#Segura123", role: "COLABORADOR" },
          { id: aldeia.id },
        ),
        { params: Promise.resolve({ id: aldeia.id }) },
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.user.nome).toBe("Novo Membro");
      expect(body.user.email).toBe("novo@teste.pt");
      expect(body.user.password).toBeUndefined();

      const dbUser = await prisma.user.findUnique({ where: { email: "novo@teste.pt" } });
      expect(dbUser.password).toBe("hashed:SenhaMuito#Segura123");
      expect(dbUser.aldeiaId).toBe(aldeia.id);

      const uar = await prisma.userAldeiaRole.findFirst({
        where: { userId: dbUser.id, aldeiaId: aldeia.id },
      });
      expect(uar.roleId).toBe(roles.COLABORADOR);

      const audit = await prisma.auditLog.findFirst({
        where: { action: "CRIAR_MEMBRO_ALDEIA", resourceId: dbUser.id },
      });
      expect(audit).not.toBeNull();
      expect(audit.metadata.addedRole).toBe("COLABORADOR");
    });

    it("devolve 409 com email já registado (sem duplicar)", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      await prisma.user.create({ data: { nome: "Existente", email: "exist@teste.pt", password: "hashed:x", role: "user", saldo: 0 } });
      const res = await registarPOST(
        req(
          { nome: "Outro", email: "exist@teste.pt", password: "SenhaMuito#Segura123", role: "MEMBRO" },
          { id: aldeia.id },
        ),
        { params: Promise.resolve({ id: aldeia.id }) },
      );
      expect(res.status).toBe(409);
      const users = await prisma.user.count({ where: { email: "exist@teste.pt" } });
      expect(users).toBe(1);
    });

    it("devolve 400 com password fraca (mesmas regras do registo)", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const res = await registarPOST(
        req(
          { nome: "Fraco", email: "fraco@teste.pt", password: "123", role: "MEMBRO" },
          { id: aldeia.id },
        ),
        { params: Promise.resolve({ id: aldeia.id }) },
      );
      expect(res.status).toBe(400);
    });

    it("devolve 403 para utilizador normal", async () => {
      mocks.user = { id: "u1", role: "user", aldeiaId: null };
      const res = await registarPOST(
        req(
          { nome: "Sem Perm", email: "semperm@teste.pt", password: "SenhaMuito#Segura123", role: "MEMBRO" },
          { id: aldeia.id },
        ),
        { params: Promise.resolve({ id: aldeia.id }) },
      );
      expect(res.status).toBe(403);
    });
  });
});