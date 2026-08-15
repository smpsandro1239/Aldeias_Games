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

describe("Real DB: Poio da Vaca — unificação no fluxo de participações (M2)", () => {
  let prisma: any;
  let participacaoPOST: any;
  let ocupadosGET: any;
  let handler: any;
  let admin: any;
  let vendedor: any;
  let aldeiaId: string;
  let jogoSaldoId: string;
  let jogoCashId: string;
  let jogoLegacyId: string;

  const req = (body: unknown, url = "http://test") =>
    ({ json: async () => body, headers: new Headers(), url }) as any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const participacoes = await import("@/app/api/participacoes/route");
    const ocupados = await import("@/app/api/jogos/[id]/numeros-ocupados/route");
    handler = (await import("@/app/api/participacoes/_lib/poio")).poioHandler;
    participacaoPOST = participacoes.POST;
    ocupadosGET = ocupados.GET;

    const permManage = await prisma.permission.create({
      data: { key: "MANAGE_ALDEIA", description: "Gerir aldeia" },
    });
    const permVenda = await prisma.permission.create({
      data: { key: "EXECUTE_VENDA", description: "Executar venda" },
    });
    const roleAdmin = await prisma.role.create({
      data: { name: "ALDEIA_ADMIN", description: "Admin poio" },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleAdmin.id, permissionId: permManage.id },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleAdmin.id, permissionId: permVenda.id },
    });
    const roleVendedor = await prisma.role.create({
      data: { name: "GESTOR", description: "Vendedor poio" },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleVendedor.id, permissionId: permVenda.id },
    });

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Poio",
        slug: "aldeia-poio",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "poio@aldeia.pt",
        morada: "Rua Poio, 1",
      },
    });
    aldeiaId = aldeia.id;

    admin = await prisma.user.create({
      data: {
        nome: "Admin Poio",
        email: "adminpoio@teste.pt",
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
        nome: "Vendedor Poio",
        email: "vendedorpoio@teste.pt",
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
        nome: "Evento Poio",
        slug: "evento-poio",
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });

    const makeJogo = async (
      nome: string,
      config: Record<string, unknown> = {},
      dimensoes = '{"x":10,"y":10}'
    ) => {
      const jogo = await prisma.jogo.create({
        data: {
          nome,
          tipo: "poio_da_vaca",
          preco: 3,
          custoQuadrado: 3,
          dimensoesCampo: dimensoes,
          stockInicial: 100,
          stockAtual: 100,
          totalParticipacoes: 0,
          totalAngariado: 0,
          estado: "aberto",
          eventoId: evento.id,
          configuracao: JSON.stringify({ premioValor: 1000, ...config }),
        },
      });
      return jogo;
    };

    const j1 = await makeJogo("Poio Saldo", {
      letras: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
      numerosPorLetra: 10,
    });
    jogoSaldoId = j1.id;

    const j2 = await makeJogo("PoioCash");
    jogoCashId = j2.id;

    // Jogo legacy SEM letras/numerosPorLetra no config (só dimensoesCampo)
    const j3 = await makeJogo("Poio Legacy");
    jogoLegacyId = j3.id;
  });

  afterAll(async () => {
    await prisma?.$disconnect?.();
    teardownTestDatabase();
  });

  it("compra com coordenadas cria 1 participação por quadrado (quantidade do body é ignorada)", async () => {
    mocks.user = admin;
    const res = await participacaoPOST(
      req({
        jogoId: jogoSaldoId,
        dadosParticipacao: {
          coordenadas: [
            { letra: "A", numero: 1 },
            { letra: "B", numero: 2 },
          ],
        },
        quantidade: 5, // quantidade do body NÃO é confiável — 2 coordenadas → 2 participações
        metodoPagamento: "saldo",
        dadosCliente: { nome: "Cliente Teste", telefone: "911111111" },
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.valorTotal).toBe(6); // 2 × 3€
    expect(Array.isArray(body.participacao)).toBe(true);
    expect(body.participacao).toHaveLength(2);

    for (const p of body.participacao) {
      expect(p.valorPago).toBe(3);
      expect(p.estadoPagamento).toBe("concluido");
    }

    const coords = body.participacao.map((p: any) =>
      JSON.parse(p.dadosParticipacao).coordenadas[0]
    );
    expect(coords).toEqual([
      { letra: "A", numero: 1 },
      { letra: "B", numero: 2 },
    ]);

    // Hash/verificação por participação
    for (const p of body.participacao) {
      const verif = JSON.parse(p.dadosVerificacao);
      expect(verif.coordenadas).toHaveLength(1);
      expect(verif.hash).toBe(p.hashParticipacao);
    }

    // Saldo: 500 − 6 (venda externa com dadosCliente → sem cashback)
    const adminRef = await prisma.user.findUnique({ where: { id: admin.id } });
    expect(adminRef.saldo).toBe(494);

    const jogo = await prisma.jogo.findUnique({ where: { id: jogoSaldoId } });
    expect(jogo.totalAngariado).toBe(6);
    expect(jogo.totalParticipacoes).toBe(2);
    expect(jogo.stockAtual).toBe(98);
  });

  it("formato legacy {x,y} é normalizado para letra/numero", async () => {
    mocks.user = admin;
    const res = await participacaoPOST(
      req({
        jogoId: jogoSaldoId,
        dadosParticipacao: {
          coordenadas: [{ x: 3, y: 4 }], // C4
        },
        metodoPagamento: "saldo",
        dadosCliente: { nome: "Cliente X", telefone: "911111112" },
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    const p = Array.isArray(body.participacao) ? body.participacao[0] : body.participacao;
    expect(JSON.parse(p.dadosParticipacao).coordenadas).toEqual([
      { letra: "C", numero: 4 },
    ]);
  });

  it("coordenada fora do campo é rejeitada (400)", async () => {
    mocks.user = admin;
    const res = await participacaoPOST(
      req({
        jogoId: jogoSaldoId,
        dadosParticipacao: { coordenadas: [{ letra: "Z", numero: 1 }] },
        metodoPagamento: "saldo",
        dadosCliente: { nome: "Cliente Z", telefone: "911111113" },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("não existe no campo");

    const res2 = await participacaoPOST(
      req({
        jogoId: jogoSaldoId,
        dadosParticipacao: { coordenadas: [{ letra: "A", numero: 99 }] },
        metodoPagamento: "saldo",
        dadosCliente: { nome: "Cliente Y", telefone: "911111114" },
      })
    );
    expect(res2.status).toBe(400);
  });

  it("coordenada já vendida é rejeitada com reversão total", async () => {
    mocks.user = admin;
    const res = await participacaoPOST(
      req({
        jogoId: jogoSaldoId,
        dadosParticipacao: { coordenadas: [{ letra: "A", numero: 1 }] }, // já vendida
        metodoPagamento: "saldo",
        dadosCliente: { nome: "Cliente Dup", telefone: "911111115" },
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("já foi vendida");

    // Nada foi persistido (participações + totais do jogo intactos)
    const total = await prisma.participacao.count({ where: { jogoId: jogoSaldoId } });
    expect(total).toBe(3); // 2 + 1 (legacy C4)
    const jogo = await prisma.jogo.findUnique({ where: { id: jogoSaldoId } });
    expect(jogo.totalAngariado).toBe(9);
  });

  it("venda em dinheiro credita o cashbox do vendedor (N × custoQuadrado)", async () => {
    mocks.user = vendedor;
    const res = await participacaoPOST(
      req({
        jogoId: jogoCashId,
        dadosParticipacao: {
          coordenadas: [
            { letra: "A", numero: 1 },
            { letra: "A", numero: 2 },
            { letra: "A", numero: 3 },
          ],
        },
        metodoPagamento: "dinheiro",
        dadosCliente: { nome: "Cliente Cash", telefone: "911111116" },
      })
    );
    expect(res.status).toBe(201);

    const cashbox = await prisma.vendedorCashbox.findUnique({
      where: { userId: vendedor.id },
    });
    expect(cashbox).toBeTruthy();
    expect(cashbox.saldo).toBe(9);

    const tx = await prisma.vendedorCashboxTransaction.findFirst({
      where: { cashboxId: cashbox.id, tipo: "RECEBIDO_DO_JOGADOR" },
    });
    expect(tx.valor).toBe(9);
    expect(tx.descricao).toContain("PoioCash");
  });

  it("numeros-ocupados devolve os ids dos quadrados vendidos", async () => {
    mocks.user = vendedor;
    const res = await ocupadosGET(
      new NextRequest(`http://test/api/jogos/${jogoCashId}/numeros-ocupados`),
      { params: Promise.resolve({ id: jogoCashId }) }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    // Column-major: A1=1, A2=11, A3=21 (x=10)
    expect(data.numerosOcupados).toEqual([1, 11, 21]);
  });

  it("config legacy sem letras/numerosPorLetra é gerada automaticamente (sem crash no sorteio)", async () => {
    mocks.user = admin;
    const res = await participacaoPOST(
      req({
        jogoId: jogoLegacyId,
        dadosParticipacao: { coordenadas: [{ letra: "A", numero: 1 }] },
        metodoPagamento: "saldo",
        dadosCliente: { nome: "Cliente Legacy", telefone: "911111117" },
      })
    );
    expect(res.status).toBe(201);

    // numeros-ocupados funciona sem config.letras (usa normalizePoioConfig)
    const ocupados = await ocupadosGET(
      new NextRequest(`http://test/api/jogos/${jogoLegacyId}/numeros-ocupados`),
      { params: Promise.resolve({ id: jogoLegacyId }) }
    );
    expect(ocupados.status).toBe(200);
    const data = await ocupados.json();
    expect(data.numerosOcupados).toEqual([1]);

    // handler unitário: prepareData normaliza com letras geradas (A..J)
    const resPrepared = handler.prepareData(
      {
        dadosParticipacao: { coordenadas: [{ x: 1, y: 5 }] },
        quantidade: 1,
      },
      { id: jogoLegacyId, tipo: "poio_da_vaca", configuracao: "{}", dimensoesCampo: '{"x":10,"y":10}' },
      []
    );
    const dados = JSON.parse(resPrepared.dadosParticipacao);
    expect(dados.coordenadas).toEqual([{ letra: "A", numero: 5 }]);
  });
});
