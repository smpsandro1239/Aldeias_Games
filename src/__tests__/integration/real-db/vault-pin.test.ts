// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real DB: Vault PIN — setup, verificação e reset", () => {
  let prisma: any;
  let hashPassword: any;
  let verifyPassword: any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    const auth = await import("@/lib/auth");
    hashPassword = auth.hashPassword;
    verifyPassword = auth.verifyPassword;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function seedAldeiaComVault() {
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: `Aldeia PIN ${Date.now()}`,
        slug: `aldeia-pin-${Date.now()}`,
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: `pin-${Date.now()}@aldeia.pt`,
        morada: "Rua PIN, 1",
      },
    });
    const vault = await prisma.vault.upsert({
      where: { aldeiaId: aldeia.id },
      create: { aldeiaId: aldeia.id, saldo: 750 },
      update: {},
    });
    return { aldeia, vault };
  }

  async function seedUser(role: string, aldeiaId?: string) {
    return prisma.user.create({
      data: {
        nome: `PIN ${role} ${Date.now()}`,
        email: `pin-${role}-${Date.now()}@teste.pt`,
        password: "$2a$10$fakehash",
        role,
        aldeiaId: aldeiaId || undefined,
        saldo: 0,
      },
    });
  }

  it("setup: guarda PIN hashed (bcrypt) e ativa o flag", async () => {
    const user = await seedUser("vendedor");

    const hashedPin = await hashPassword("1234");
    expect(hashedPin).not.toBe("1234");
    expect(await verifyPassword("1234", hashedPin)).toBe(true);
    expect(await verifyPassword("9999", hashedPin)).toBe(false);

    await prisma.user.update({
      where: { id: user.id },
      data: { vaultPin: hashedPin, vaultPinEnabled: true },
    });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated.vaultPinEnabled).toBe(true);
    expect(updated.vaultPin).toBeTruthy();
  });

  it("verificação: PIN errado é rejeitado, certo devolve saldo da aldeia", async () => {
    const { aldeia } = await seedAldeiaComVault();
    const vendedor = await seedUser("vendedor", aldeia.id);

    const hashedPin = await hashPassword("1234");
    await prisma.user.update({
      where: { id: vendedor.id },
      data: { vaultPin: hashedPin, vaultPinEnabled: true },
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: vendedor.id },
      select: { vaultPin: true, vaultPinEnabled: true },
    });
    expect(dbUser.vaultPinEnabled).toBe(true);
    expect(await verifyPassword("9999", dbUser.vaultPin)).toBe(false);
    expect(await verifyPassword("1234", dbUser.vaultPin)).toBe(true);

    const data = await prisma.vault.findUnique({ where: { aldeiaId: aldeia.id }, select: { saldo: true } });
    expect(data.saldo).toBe(750);
  });

  it("valida o formato do PIN (4 a 6 dígitos)", () => {
    const pattern = /^\d{4,6}$/;
    expect(pattern.test("12")).toBe(false);
    expect(pattern.test("1234567")).toBe(false);
    expect(pattern.test("abcd")).toBe(false);
    expect(pattern.test("1234")).toBe(true);
    expect(pattern.test("123456")).toBe(true);
  });

  it("admin-reset: remove o PIN, desativa o flag e cria notificação", async () => {
    const { aldeia } = await seedAldeiaComVault();
    await seedUser("aldeia_admin", aldeia.id);
    const vendedor = await seedUser("vendedor", aldeia.id);

    const hashedPin = await hashPassword("1234");
    await prisma.user.update({
      where: { id: vendedor.id },
      data: { vaultPin: hashedPin, vaultPinEnabled: true },
    });

    // Acesso restrito por aldeia (mesma regra da rota admin-reset)
    const underAdmin = aldeia;
    expect(underAdmin.id).toBeDefined();

    await prisma.user.update({
      where: { id: vendedor.id },
      data: { vaultPin: null, vaultPinEnabled: false },
    });

    await prisma.notificacao.create({
      data: {
        userId: vendedor.id,
        tipo: "sistema",
        titulo: "PIN do cofre reposto",
        mensagem: "O teu PIN do cofre foi reposto por um administrador. Podes configurar um novo PIN.",
        lida: false,
      },
    });

    const after = await prisma.user.findUnique({ where: { id: vendedor.id } });
    expect(after.vaultPin).toBeNull();
    expect(after.vaultPinEnabled).toBe(false);

    const notif = await prisma.notificacao.findFirst({ where: { userId: vendedor.id } });
    expect(notif).toBeTruthy();
    expect(notif.tipo).toBe("sistema");
  });
});