// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ user: null as any }));

vi.mock("@/lib/auth", () => ({
  getFullUserFromRequest: async () => mocks.user,
  verifyToken: async () =>
    mocks.user
      ? {
          userId: mocks.user.id,
          role: mocks.user.role,
          aldeiaId: mocks.user.aldeiaId ?? null,
        }
      : null,
}));

describe("Real DB: PUT /api/jogos/[id] preserva/regenera o pool da raspadinha", () => {
  let prisma: any;
  let putHandler: any;
  let admin: any;
  let aldeiaId: string;
  let jogoRaspaId: string;
  let jogoRifaId: string;

  const poolOriginal = [
    "2 Euro", "Sem prémio", "Sem prémio", "Sem prémio",
    "2 Euro", "Sem prémio", "Sem prémio", "Sem prémio",
    "Sem prémio", "Sem prémio",
  ];
  const configOriginal = {
    premios: [
      { nome: "2 Euro", percentagem: 20, ordem: 0 },
      { nome: "5 Euro", percentagem: 10, ordem: 1 },
    ],
    maxGanhadores: 3,
    pool: poolOriginal,
  };

  const putReq = (body: unknown) =>
    new NextRequest("http://test/api/jogos/x", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const route = await import("@/app/api/jogos/[id]/route");
    putHandler = route.PUT;

    const perm = await prisma.permission.create({
      data: { key: "MANAGE_ALDEIA", description: "Gerir aldeia" },
    });
    const role = await prisma.role.create({
      data: { name: "ALDEIA_ADMIN", description: "Admin" },
    });
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: perm.id },
    });

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Pool",
        slug: "aldeia-pool",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "pool@aldeia.pt",
        morada: "Rua 1",
      },
    });
    aldeiaId = aldeia.id;

    admin = await prisma.user.create({
      data: {
        nome: "Admin Pool",
        email: "adminpool@teste.pt",
        password: "$2b$10$fakehash",
        role: "aldeia_admin",
        aldeiaId: aldeia.id,
        saldo: 100,
      },
    });
    await prisma.userGlobalRole.create({
      data: { userId: admin.id, roleId: role.id },
    });
    // O admin também tem de estar ligado à aldeia na relação de admins
    // (join table implícita _AldeiaAdmins) para receber notificações
    await prisma.aldeia.update({
      where: { id: aldeia.id },
      data: { admins: { connect: { id: admin.id } } },
    });

    const evento = await prisma.evento.create({
      data: {
        nome: "Evento Pool",
        slug: "evento-pool",
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });

    const raspa = await prisma.jogo.create({
      data: {
        nome: "Raspa Pool",
        tipo: "raspadinha",
        preco: 1,
        stockInicial: 10,
        stockAtual: 8,
        totalParticipacoes: 2,
        totalAngariado: 2,
        estado: "aberto",
        eventoId: evento.id,
        configuracao: JSON.stringify(configOriginal),
        premios: {
          create: [
            { nome: "2 Euro", percentagem: 20, ordem: 0, aldeiaId: aldeia.id },
            { nome: "5 Euro", percentagem: 10, ordem: 1, aldeiaId: aldeia.id },
          ],
        },
      },
    });
    jogoRaspaId = raspa.id;

    const rifa = await prisma.jogo.create({
      data: {
        nome: "Rifa Pool",
        tipo: "rifa",
        preco: 2,
        stockInicial: 10,
        stockAtual: 10,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: evento.id,
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 10 }),
      },
    });
    jogoRifaId = rifa.id;
  });

  afterAll(async () => {
    await prisma?.$disconnect?.();
    teardownTestDatabase();
  });

  it("preserva o pool quando a config não o inclui (caso 1)", async () => {
    mocks.user = admin;
    const res = await putHandler(
      putReq({ nome: "Raspa Pool Renomeado" }),
      { params: Promise.resolve({ id: jogoRaspaId }) }
    );
    expect(res.status).toBe(200);

    const atualizado = await prisma.jogo.findUnique({ where: { id: jogoRaspaId } });
    const config = JSON.parse(atualizado.configuracao);
    expect(config.pool).toEqual(poolOriginal);
    expect(config.premios[0].nome).toBe("2 Euro");
  });

  it("preserva o pool quando os premios enviados são idênticos", async () => {
    mocks.user = admin;
    const res = await putHandler(
      putReq({
        premios: [
          { nome: "2 Euro", percentagem: 20, ordem: 0 },
          { nome: "5 Euro", percentagem: 10, ordem: 1 },
        ],
        configuracao: { premios: configOriginal.premios, maxGanhadores: 3 },
      }),
      { params: Promise.resolve({ id: jogoRaspaId }) }
    );
    expect(res.status).toBe(200);

    const atualizado = await prisma.jogo.findUnique({ where: { id: jogoRaspaId } });
    const config = JSON.parse(atualizado.configuracao);
    expect(config.pool).toEqual(poolOriginal);
  });

  it("regenera o pool quando os prémios mudam (caso 2) e notifica admins", async () => {
    mocks.user = admin;
    await prisma.notificacao.deleteMany({});

    const res = await putHandler(
      putReq({
        premios: [{ nome: "10 Euro", percentagem: 30, ordem: 0 }],
        stockInicial: 20,
        configuracao: { maxGanhadores: 5 },
      }),
      { params: Promise.resolve({ id: jogoRaspaId }) }
    );
    expect(res.status).toBe(200);

    const atualizado = await prisma.jogo.findUnique({ where: { id: jogoRaspaId } });
    const config = JSON.parse(atualizado.configuracao);
    expect(config.pool).toHaveLength(20); // novo stock
    const dezEuro = config.pool.filter((x: string) => x === "10 Euro");
    const semPremio = config.pool.filter((x: string) => x === "Sem prémio");
    expect(dezEuro).toHaveLength(6); // round(20 * 30/100)
    expect(semPremio).toHaveLength(14);

    const notif = await prisma.notificacao.findFirst({
      where: { titulo: "Pool de prémios redefinido" },
    });
    expect(notif).toBeTruthy();
    expect(notif.userId).toBe(admin.id);
  });

  it("respeita um pool enviado explicitamente (caso 3)", async () => {
    mocks.user = admin;
    const poolExplicito = ["Sem prémio", "Sem prémio", "10 Euro"];
    const res = await putHandler(
      putReq({
        premios: [{ nome: "10 Euro", percentagem: 30, ordem: 0 }],
        configuracao: { pool: poolExplicito },
      }),
      { params: Promise.resolve({ id: jogoRaspaId }) }
    );
    expect(res.status).toBe(200);

    const atualizado = await prisma.jogo.findUnique({ where: { id: jogoRaspaId } });
    const config = JSON.parse(atualizado.configuracao);
    expect(config.pool).toEqual(poolExplicito);
  });

  it("um toggle de estado não toca na configuracao", async () => {
    mocks.user = admin;
    const antes = await prisma.jogo.findUnique({ where: { id: jogoRaspaId } });
    const configAntes = JSON.parse(antes.configuracao);

    const res = await putHandler(
      putReq({ estado: "fechado" }),
      { params: Promise.resolve({ id: jogoRaspaId }) }
    );
    expect(res.status).toBe(200);

    const depois = await prisma.jogo.findUnique({ where: { id: jogoRaspaId } });
    expect(JSON.parse(depois.configuracao)).toEqual(configAntes);
    expect(depois.estado).toBe("fechado");
  });

  it("jogos não-raspadinha mantêm o comportamento atual", async () => {
    mocks.user = admin;
    const res = await putHandler(
      putReq({ configuracao: { numeroInicial: 1, numeroFinal: 10, localSorteio: "Centro" } }),
      { params: Promise.resolve({ id: jogoRifaId }) }
    );
    expect(res.status).toBe(200);

    const atualizado = await prisma.jogo.findUnique({ where: { id: jogoRifaId } });
    const config = JSON.parse(atualizado.configuracao);
    expect(config.localSorteio).toBe("Centro");
    expect(config.pool).toBeUndefined();
  });
});
