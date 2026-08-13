// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

const mocks = vi.hoisted(() => ({ user: null as any }));

vi.mock("@/lib/auth", () => ({
  getFullUserFromRequest: async () => mocks.user,
  verifyToken: async () =>
    mocks.user
      ? { userId: mocks.user.id, role: mocks.user.role, aldeiaId: mocks.user.aldeiaId ?? null }
      : null,
}));

describe("Real DB: Filtro aldeiaId em GET /api/participacoes", () => {
  let prisma: any;
  let GET: any;
  let aldeiaA: any, aldeiaB: any, jogoA: any;

  const req = (params: Record<string, string>) =>
    new NextRequest(`http://test/api/participacoes?${new URLSearchParams(params)}`) as any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    const route = await import("@/app/api/participacoes/route");
    GET = route.GET;

    aldeiaA = await prisma.aldeia.create({
      data: { nome: "Aldeia A", slug: "aldeia-a", tipoOrganizacao: "aldeia", email: "a@b.pt" },
    });
    aldeiaB = await prisma.aldeia.create({
      data: { nome: "Aldeia B", slug: "aldeia-b", tipoOrganizacao: "aldeia", email: "b@b.pt" },
    });
    const evento = await prisma.evento.create({
      data: { nome: "Evento A", slug: "evento-a", aldeiaId: aldeiaA.id, dataInicio: new Date(), dataFim: new Date(Date.now() + 86400000) },
    });
    jogoA = await prisma.jogo.create({
      data: {
        nome: "Rifa A",
        tipo: "rifa",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        configuracao: "{}",
        eventoId: evento.id,
        estado: "aberto",
      },
    });
    const jogador = await prisma.user.create({
      data: { nome: "Jogador", email: "j@b.pt", password: "$2b$10$fakehash", role: "user", saldo: 10 },
    });
    await prisma.participacao.create({
      data: { jogoId: jogoA.id, userId: jogador.id, valorPago: 2, dadosParticipacao: "{}", metodoPagamento: "saldo", estadoPagamento: "concluido" },
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("super_admin vê participações da aldeia pedida (e não de outras)", async () => {
    mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
    const res = await GET(req({ aldeiaId: aldeiaA.id }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(1);

    const resOutra = await GET(req({ aldeiaId: aldeiaB.id }));
    const bodyOutra = await resOutra.json();
    expect(bodyOutra.data.length).toBe(0);
  });

  it("aldeia_admin só pode filtrar a própria aldeia (403 noutra)", async () => {
    mocks.user = { id: "admB", role: "aldeia_admin", aldeiaId: aldeiaB.id };
    const res = await GET(req({ aldeiaId: aldeiaA.id }));
    expect(res.status).toBe(403);

    mocks.user = { id: "admA", role: "aldeia_admin", aldeiaId: aldeiaA.id };
    const resOk = await GET(req({ aldeiaId: aldeiaA.id }));
    expect(resOk.status).toBe(200);
    const body = await resOk.json();
    expect(body.data.length).toBe(1);
  });

  it("vendedor e user recebem 403 com aldeiaId", async () => {
    mocks.user = { id: "v1", role: "vendedor", aldeiaId: aldeiaA.id, saldo: 0 };
    expect((await GET(req({ aldeiaId: aldeiaA.id }))).status).toBe(403);
    mocks.user = { id: "u1", role: "user", aldeiaId: null };
    expect((await GET(req({ aldeiaId: aldeiaA.id }))).status).toBe(403);
  });
});
