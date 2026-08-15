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

describe("Real DB: M5 — estatísticas, CSV export e safeConfig sem pool", () => {
  let prisma: any;
  let estatisticasGET: any;
  let exportarGET: any;
  let jogoGET: any;
  let jogosGET: any;
  let admin: any;
  let jogoEuroId: string;
  let jogoRaspaId: string;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const est = await import("@/app/api/jogos/[id]/estatisticas/route");
    const exp = await import("@/app/api/jogos/[id]/exportar/route");
    const jg = await import("@/app/api/jogos/[id]/route");
    const jgList = await import("@/app/api/jogos/route");
    estatisticasGET = est.GET;
    exportarGET = exp.GET;
    jogoGET = jg.GET;
    jogosGET = jgList.GET;

    const perm = await prisma.permission.create({
      data: { key: "MANAGE_ALDEIA", description: "Gerir aldeia" },
    });
    const role = await prisma.role.create({
      data: { name: "ALDEIA_ADMIN", description: "Admin M5" },
    });
    await prisma.rolePermission.create({
      data: { roleId: role.id, permissionId: perm.id },
    });

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia M5",
        slug: "aldeia-m5",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "m5@aldeia.pt",
        morada: "Rua M5, 1",
      },
    });
    admin = await prisma.user.create({
      data: {
        nome: "Admin M5",
        email: "adminm5@teste.pt",
        password: "$2b$10$fakehash",
        role: "aldeia_admin",
        aldeiaId: aldeia.id,
        saldo: 500,
      },
    });
    await prisma.userGlobalRole.create({
      data: { userId: admin.id, roleId: role.id },
    });

    const evento = await prisma.evento.create({
      data: {
        nome: "Evento M5",
        slug: "evento-m5",
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });

    const jogoEuro = await prisma.jogo.create({
      data: {
        nome: "Euro M5",
        tipo: "euromilhoes",
        preco: 2,
        stockInicial: 100,
        stockAtual: 90,
        totalParticipacoes: 10,
        totalAngariado: 20,
        estado: "aberto",
        eventoId: evento.id,
        configuracao: JSON.stringify({ premioValor: 1000 }),
      },
    });
    jogoEuroId = jogoEuro.id;

    const jogoRaspa = await prisma.jogo.create({
      data: {
        nome: "Raspa M5",
        tipo: "raspadinha",
        preco: 1,
        stockInicial: 10,
        stockAtual: 7,
        totalParticipacoes: 3,
        totalAngariado: 3,
        estado: "aberto",
        eventoId: evento.id,
        configuracao: JSON.stringify({
          premios: [{ nome: "2 Euro", percentagem: 80 }],
          pool: ["Sem prémio", "2 Euro", "Sem prémio", "Sem prémio", "Sem prémio", "Sem prémio", "Sem prémio", "2 Euro", "Sem prémio", "Sem prémio"],
        }),
      },
    });
    jogoRaspaId = jogoRaspa.id;

    // Participações: 1,2,3 vendidos 2x cada; 4,5 vendidos 1x
    const payloads = [
      { numero: 1 }, { numero: 2 }, { numero: 3 },
      { numero: 1 }, { numero: 2 }, { numero: 3 },
      { numero: 4 }, { numero: 5 },
    ];
    const now = new Date();
    await prisma.participacao.createMany({
      data: payloads.map((p, i) => ({
        jogoId: jogoEuroId,
        userId: admin.id,
        dadosParticipacao: JSON.stringify(p),
        numerosSelecionados: JSON.stringify([p.numero]),
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
        createdAt: new Date(now.getTime() - i * 3600000),
      })),
    });

    // Raspadinha: 3 participações ganhadoras (2x "2 Euro" + 1 sem prémio)
    await prisma.participacao.createMany({
      data: [
        { jogoId: jogoRaspaId, userId: admin.id, dadosParticipacao: JSON.stringify({ hasWin: true, grid: [] }), valorPago: 1, metodoPagamento: "saldo", estadoPagamento: "concluido", ganhador: true },
        { jogoId: jogoRaspaId, userId: admin.id, dadosParticipacao: JSON.stringify({ hasWin: true, grid: [] }), valorPago: 1, metodoPagamento: "saldo", estadoPagamento: "concluido", ganhador: true },
        { jogoId: jogoRaspaId, userId: admin.id, dadosParticipacao: JSON.stringify({ hasWin: false, grid: [] }), valorPago: 1, metodoPagamento: "saldo", estadoPagamento: "concluido" },
      ],
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect?.();
    teardownTestDatabase();
  });

  it("estatisticas devolve top números por frequência e vendas por dia", async () => {
    mocks.user = admin;
    const res = await estatisticasGET(
      new NextRequest("http://test/api/jogos/x/estatisticas"),
      { params: Promise.resolve({ id: jogoEuroId }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.totalParticipacoes).toBe(8);
    expect(data.topNumeros).toHaveLength(5);
    expect(data.topNumeros[0]).toEqual({ numero: 1, frequencia: 2 });
    expect(data.topNumeros[1]).toEqual({ numero: 2, frequencia: 2 });
    expect(data.vendasPorDia.length).toBe(1);
    expect(data.vendasPorDia[0].quantidade).toBe(8);
    expect(data.vendasPorDia[0].total).toBe(16);
  });

  it("estatisticas devolve pool restante para raspadinha", async () => {
    mocks.user = admin;
    const res = await estatisticasGET(
      new NextRequest("http://test/api/jogos/x/estatisticas"),
      { params: Promise.resolve({ id: jogoRaspaId }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tipo).toBe("raspadinha");
    // pool: 2× "2 Euro" + 8× "Sem prémio"
    const doisEuro = data.poolRestante.find((p: any) => p.nome === "2 Euro");
    const semPremio = data.poolRestante.find((p: any) => p.nome === "Sem prémio");
    expect(doisEuro.qtd).toBe(2);
    expect(semPremio.qtd).toBe(8);
  });

  it("estatisticas rejeita utilizador de outra aldeia", async () => {
    mocks.user = { ...admin, aldeiaId: "outra-aldeia" };
    const res = await estatisticasGET(
      new NextRequest("http://test/api/jogos/x/estatisticas"),
      { params: Promise.resolve({ id: jogoEuroId }) }
    );
    expect(res.status).toBe(403);
  });

  it("exportar CSV devolve BOM + cabeçalhos + só participações do jogo", async () => {
    mocks.user = admin;
    const res = await exportarGET(
      new NextRequest("http://test/api/jogos/x/exportar"),
      { params: Promise.resolve({ id: jogoEuroId }) }
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-SafT-Count")).toBe("8");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");

    // BOM EF BB BF no início do body (Excel) — text() descodifica e remove
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 3).toString("hex")).toBe("efbbbf");

    const csv = buf.toString("utf8");
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("ID,Data,Número(s),Valor (€)");
    // 1 linha de cabeçalho + 8 linhas de participações
    expect(csv.split("\r\n")).toHaveLength(9);
    expect(csv).not.toContain("Raspa M5");
  });

  it("exportar CSV respeita o filtro de datas", async () => {
    mocks.user = admin;
    const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const res = await exportarGET(
      new NextRequest(`http://test/api/jogos/x/exportar?inicio=${amanha}`),
      { params: Promise.resolve({ id: jogoEuroId }) }
    );
    expect(res.status).toBe(200);
    const csv = await res.text();
    // Só o cabeçalho (nenhuma participação no futuro)
    expect(csv.split("\r\n")).toHaveLength(1);
  });

  it("safeConfig nunca contém pool (GET jogo individual + lista)", async () => {
    const res = await jogoGET(
      new NextRequest("http://test/api/jogos/x"),
      { params: Promise.resolve({ id: jogoRaspaId }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.configuracao).toBeTruthy();
    expect((body.data.configuracao as Record<string, unknown>).pool).toBeUndefined();
    expect((body.data.configuracao as Record<string, unknown>).probabilidadeVitoria).toBeUndefined();

    const listRes = await jogosGET(new NextRequest("http://test/api/jogos"));
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    const raspa = (list.data as any[]).find((j: any) => j.id === jogoRaspaId);
    expect(raspa).toBeTruthy();
    expect((raspa.configuracao as Record<string, unknown>).pool).toBeUndefined();
  });

  it("detail devolve poolRestante mas config sem pool", async () => {
    const detail = await import("@/app/api/jogos/[id]/detail/route");
    const res = await detail.GET(
      new NextRequest("http://test/api/jogos/x/detail"),
      { params: Promise.resolve({ id: jogoRaspaId }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.poolRestante).toBeTruthy();
    expect(body.poolRestante.reduce((s: number, p: any) => s + p.qtd, 0)).toBe(10);
    expect((body.configuracao as Record<string, unknown>).pool).toBeUndefined();
  });
});
