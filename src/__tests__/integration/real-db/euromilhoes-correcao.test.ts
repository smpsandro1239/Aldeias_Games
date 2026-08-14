// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";
import { NextRequest } from "next/server";

// Utilizador controlado pelo teste — substitui getFullUserFromRequest/verifyToken
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

// Força o modo manual no sorteio da grelha (sem rede/API)
vi.mock("@/lib/euromillions-api", () => ({
  getLatestFirstNumber: async () => ({ numero: null }),
}));

describe("Real DB: Euromilhões — correção financeira (1 participação = 1 número)", () => {
  let prisma: any;
  let participacaoPOST: any;
  let participacaoGET: any;
  let sortearPUT: any;
  let ocupadosGET: any;
  let handler: any;
  let admin: any;
  let vendedor: any;
  let aldeiaId: string;
  let jogoSaldoId: string;
  let jogoCashId: string;
  let grelha1: any;
  let grelha2: any;

  const req = (body: unknown, url = "http://test") =>
    ({ json: async () => body, headers: new Headers(), url }) as any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const participacoes = await import("@/app/api/participacoes/route");
    const sortear = await import("@/app/api/euromilhoes/grelhas/[id]/sortear/route");
    const ocupados = await import("@/app/api/jogos/[id]/numeros-ocupados/route");
    handler = (await import("@/app/api/participacoes/_lib/euromilhoes")).euromilhoesHandler;
    participacaoPOST = participacoes.POST;
    participacaoGET = participacoes.GET;
    sortearPUT = sortear.PUT;
    ocupadosGET = ocupados.GET;

    // RBAC: role ALDEIA_ADMIN com MANAGE_ALDEIA + EXECUTE_VENDA
    const permManage = await prisma.permission.create({
      data: { key: "MANAGE_ALDEIA", description: "Gerir aldeia" },
    });
    const permVenda = await prisma.permission.create({
      data: { key: "EXECUTE_VENDA", description: "Executar venda" },
    });
    const roleAdmin = await prisma.role.create({
      data: { name: "ALDEIA_ADMIN", description: "Admin euro" },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleAdmin.id, permissionId: permManage.id },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleAdmin.id, permissionId: permVenda.id },
    });
    const roleVendedor = await prisma.role.create({
      data: { name: "GESTOR", description: "Vendedor euro" },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleVendedor.id, permissionId: permVenda.id },
    });

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Euro",
        slug: "aldeia-euro",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "euro@aldeia.pt",
        morada: "Rua Euro, 1",
      },
    });
    aldeiaId = aldeia.id;

    admin = await prisma.user.create({
      data: {
        nome: "Admin Euro",
        email: "admineuro@teste.pt",
        password: "$2b$10$fakehash",
        role: "aldeia_admin",
        aldeiaId: aldeia.id,
        saldo: 500,
      },
    });
    await prisma.userGlobalRole.create({
      data: { userId: admin.id, roleId: roleAdmin.id },
    });

    vendedor = await prisma.user.create({
      data: {
        nome: "Vendedor Euro",
        email: "vendoreuro@teste.pt",
        password: "$2b$10$fakehash",
        role: "vendedor",
        aldeiaId: aldeia.id,
        saldo: 500,
      },
    });
    await prisma.userGlobalRole.create({
      data: { userId: vendedor.id, roleId: roleVendedor.id },
    });

    const evento = await prisma.evento.create({
      data: {
        nome: "Evento Euro",
        slug: "evento-euro",
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });

    const makeJogo = async (nome: string, config: Record<string, unknown> = {}) => {
      const jogo = await prisma.jogo.create({
        data: {
          nome,
          tipo: "euromilhoes",
          preco: 2,
          stockInicial: 500,
          stockAtual: 500,
          totalParticipacoes: 0,
          totalAngariado: 0,
          estado: "aberto",
          eventoId: evento.id,
          configuracao: JSON.stringify({ premioValor: 1000, ...config }),
        },
      });
      const grelha = await prisma.grelhaEuromilhoes.create({
        data: {
          jogoId: jogo.id,
          numero: 1,
          estado: "aberta",
          numerosOcupados: "[]",
        },
      });
      return { jogo, grelha };
    };

    const j1 = await makeJogo("Euro Saldo");
    jogoSaldoId = j1.jogo.id;
    grelha2 = await prisma.grelhaEuromilhoes.create({
      data: {
        jogoId: j1.jogo.id,
        numero: 2,
        estado: "aberta",
        numerosOcupados: "[]",
      },
    });

    const j2 = await makeJogo("EuroCash");
    jogoCashId = j2.jogo.id;
    grelha1 = j2.grelha;
  });

  afterAll(async () => {
    await prisma?.$disconnect?.();
    teardownTestDatabase();
  });

  it("compra de 5 números cria 5 participações unitárias com o rasto financeiro correto", async () => {
    mocks.user = admin;
    const res = await participacaoPOST(
      req({
        jogoId: jogoSaldoId,
        dadosParticipacao: { numeros: [1, 2, 3, 4, 5] },
        quantidade: 5,
        metodoPagamento: "saldo",
        grelhaId: grelha2.id,
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.valorTotal).toBe(10);
    expect(body.participacao).toHaveLength(5);

    const numeros = body.participacao.map((p: any) =>
      JSON.parse(p.dadosParticipacao).numero
    );
    expect(numeros.sort((a: number, b: number) => a - b)).toEqual([1, 2, 3, 4, 5]);

    for (const p of body.participacao) {
      expect(p.valorPago).toBe(2);
      expect(p.estadoPagamento).toBe("concluido");
      expect(JSON.parse(p.numerosSelecionados)).toEqual([JSON.parse(p.dadosParticipacao).numero]);
      expect(p.grelhaId).toBe(grelha2.id);
    }

    // Saldo: 500 − 10 (compras) + 0.5 (cashback 5% sobre 10€)
    const adminRefrescado = await prisma.user.findUnique({ where: { id: admin.id } });
    expect(adminRefrescado.saldo).toBe(490.5);

    // Totais do jogo
    const jogo = await prisma.jogo.findUnique({ where: { id: jogoSaldoId } });
    expect(jogo.totalAngariado).toBe(10);
    expect(jogo.totalParticipacoes).toBe(5);
    expect(jogo.stockAtual).toBe(495);

    // Grelha ocupada com os 5 números
    const grelha = await prisma.grelhaEuromilhoes.findUnique({ where: { id: grelha2.id } });
    expect(JSON.parse(grelha.numerosOcupados)).toEqual([1, 2, 3, 4, 5]);
    expect(grelha.estado).toBe("aberta");
  });

  it("venda em dinheiro credita o cashbox do vendedor (N × preço)", async () => {
    mocks.user = vendedor;
    const res = await participacaoPOST(
      req({
        jogoId: jogoCashId,
        dadosParticipacao: { numeros: [7, 8, 9] },
        quantidade: 3,
        metodoPagamento: "dinheiro",
        grelhaId: grelha1.id,
      })
    );
    expect(res.status).toBe(201);

    const cashbox = await prisma.vendedorCashbox.findUnique({
      where: { userId: vendedor.id },
    });
    expect(cashbox).toBeTruthy();
    expect(cashbox.saldo).toBe(6);

    const transacao = await prisma.vendedorCashboxTransaction.findFirst({
      where: { cashboxId: cashbox.id, tipo: "RECEBIDO_DO_JOGADOR" },
    });
    expect(transacao).toBeTruthy();
    expect(transacao.valor).toBe(6);
    expect(transacao.descricao).toContain("Venda de 3x");

    const jogo = await prisma.jogo.findUnique({ where: { id: jogoCashId } });
    expect(jogo.totalAngariado).toBe(6);
    expect(jogo.totalParticipacoes).toBe(3);
    expect(jogo.stockAtual).toBe(497);
  });

  it("numeros-ocupados por grelha não se sobrepõem entre grelhas do mesmo jogo", async () => {
    // Grelha 1 (jogoCashId): [7,8,9] vendidos; grelha 2 (jogoSaldoId): [1..5]
    mocks.user = admin;
    const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
    const res1 = await ocupadosGET(
      new NextRequest(`http://test/api/jogos/${jogoCashId}/numeros-ocupados?grelhaId=${grelha1.id}`),
      ctx(jogoCashId)
    );
    const body1 = await res1.json();
    expect(body1.numerosOcupados).toEqual([7, 8, 9]);

    const res2 = await ocupadosGET(
      new NextRequest(`http://test/api/jogos/${jogoCashId}/numeros-ocupados`),
      ctx(jogoCashId)
    );
    const body2 = await res2.json();
    expect(body2.numerosOcupados).toEqual([7, 8, 9]);

    const res3 = await ocupadosGET(
      new NextRequest(`http://test/api/jogos/${jogoSaldoId}/numeros-ocupados?grelhaId=${grelha2.id}`),
      ctx(jogoSaldoId)
    );
    const body3 = await res3.json();
    expect(body3.numerosOcupados).toEqual([1, 2, 3, 4, 5]);
  });

  it("validateInTransaction rejeita número vendido na mesma grelha (guard atómico)", async () => {
    // Grelha 2 de jogoSaldoId já tem o 3 ocupado — vender via tx falha
    await expect(
      handler.validateInTransaction(
        prisma,
        { grelhaId: grelha2.id, numerosSelecionados: [3, 40] },
        {}
      )
    ).rejects.toThrow("já foi vendido");

    // Números livres passam
    await expect(
      handler.validateInTransaction(
        prisma,
        { grelhaId: grelha2.id, numerosSelecionados: [40, 41] },
        {}
      )
    ).resolves.toBeUndefined();
  });

  it("POST rejeita 400 quando o número já está ocupado na grelha", async () => {
    mocks.user = admin;
    const res = await participacaoPOST(
      req({
        jogoId: jogoCashId,
        dadosParticipacao: { numeros: [7] },
        quantidade: 1,
        metodoPagamento: "saldo",
        grelhaId: grelha1.id,
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("já foi vendido");

    // Transação inteira revertida — nada mudou
    const jogo = await prisma.jogo.findUnique({ where: { id: jogoCashId } });
    expect(jogo.stockAtual).toBe(497);
    expect(jogo.totalAngariado).toBe(6);
  });

  it("sorteio da grelha: vencedor corresponde ao número da participação unitária", async () => {
    mocks.user = admin;
    // Preenche a grelha 1 e marca como preenchida
    await prisma.grelhaEuromilhoes.update({
      where: { id: grelha1.id },
      data: {
        numerosOcupados: JSON.stringify(Array.from({ length: 50 }, (_, i) => i + 1)),
        estado: "preenchida",
      },
    });

    // Sorteia manualmente o número 9 (participação do vendedor, dinheiro)
    const res = await sortearPUT(
      req({ numeroManual: 9 }),
      { params: Promise.resolve({ id: grelha1.id }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sorteio.isVendido).toBe(true);
    expect(body.sorteio.numeroSorteado).toBe(9);

    const vencedor = await prisma.participacao.findFirst({
      where: { grelhaId: grelha1.id, ganhador: true },
    });
    expect(vencedor).toBeTruthy();
    expect(JSON.parse(vencedor.dadosParticipacao).numero).toBe(9);
    expect(vencedor.userId).toBe(vendedor.id);
  });

  it("GET /api/participacoes devolve user e vendedor (nome do vencedor no admin)", async () => {
    mocks.user = admin;
    const res = await participacaoGET(
      new NextRequest(
        `http://test/api/participacoes?jogoId=${jogoCashId}&ganhador=true`
      )
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);

    const vencedor = body.data[0];
    expect(vencedor.user).toMatchObject({ id: vendedor.id, nome: "Vendedor Euro" });
    expect(vencedor.vendedor).toMatchObject({ id: vendedor.id, nome: "Vendedor Euro" });
    expect(vencedor.grelhaId).toBe(grelha1.id);
  });
});