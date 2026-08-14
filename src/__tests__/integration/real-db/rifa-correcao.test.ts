// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

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

describe("Real DB: Rifa — correção de odds e unicidade (1 participação = 1 número)", () => {
  let prisma: any;
  let participacaoPOST: any;
  let sorteioPATCH: any;
  let sorteioPOST: any;
  let provaGET: any;
  let verificarPOST: any;
  let admin: any;
  let jogo1Id: string;
  let jogo2Id: string;
  let participacaoIds: string[] = [];

  const req = (body: unknown) =>
    ({ json: async () => body, headers: new Headers(), url: "http://test" }) as any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const participacoes = await import("@/app/api/participacoes/route");
    const sorteios = await import("@/app/api/sorteios/route");
    const prova = await import("@/app/api/participacoes/[id]/prova/route");
    const verificar = await import("@/app/api/participacoes/verificar/route");
    participacaoPOST = participacoes.POST;
    sorteioPATCH = sorteios.PATCH;
    sorteioPOST = sorteios.POST;
    provaGET = prova.GET;
    verificarPOST = verificar.POST;

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Rifa",
        slug: "aldeia-rifa",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "rifa@aldeia.pt",
        morada: "Rua Rifa, 1",
      },
    });

    // RBAC: role ADMIN com MANAGE_ALDEIA + EXECUTE_VENDA
    const permManage = await prisma.permission.create({
      data: { key: "MANAGE_ALDEIA", description: "Gerir aldeia" },
    });
    const permVenda = await prisma.permission.create({
      data: { key: "EXECUTE_VENDA", description: "Executar venda" },
    });
    const roleAdmin = await prisma.role.create({
      data: { name: "ALDEIA_ADMIN", description: "Admin rifa" },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleAdmin.id, permissionId: permManage.id },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleAdmin.id, permissionId: permVenda.id },
    });

    admin = await prisma.user.create({
      data: {
        nome: "Admin Rifa",
        email: "adminrifa@teste.pt",
        password: "$2b$10$fakehash",
        role: "aldeia_admin",
        aldeiaId: aldeia.id,
        saldo: 500,
      },
    });
    await prisma.userGlobalRole.create({
      data: { userId: admin.id, roleId: roleAdmin.id },
    });
    mocks.user = admin;

    const evento = await prisma.evento.create({
      data: {
        nome: "Evento Rifa",
        slug: "evento-rifa",
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });

    const jogo1 = await prisma.jogo.create({
      data: {
        nome: "Rifa A",
        tipo: "rifa",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: evento.id,
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100, numeroBlocos: 1 }),
      },
    });
    jogo1Id = jogo1.id;

    const jogo2 = await prisma.jogo.create({
      data: {
        nome: "Rifa B",
        tipo: "rifa",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: evento.id,
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100, numeroBlocos: 1 }),
      },
    });
    jogo2Id = jogo2.id;
  });

  afterAll(async () => {
    await prisma?.$disconnect?.();
    teardownTestDatabase();
  });

  it("compra de 5 números cria 5 participações, cada uma com 1 número, valorPago = 5 × preco", async () => {
    const res = await participacaoPOST(
      req({
        jogoId: jogo1Id,
        dadosParticipacao: { numeros: [1, 2, 3, 4, 5] },
        quantidade: 5,
        metodoPagamento: "saldo",
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.participacao).toHaveLength(5);
    expect(body.valorTotal).toBe(10);

    const numerosDasParticipacoes = body.participacao.map((p: any) =>
      JSON.parse(p.dadosParticipacao).numero
    );
    expect(numerosDasParticipacoes.sort((a: number, b: number) => a - b)).toEqual([1, 2, 3, 4, 5]);

    const hashes = new Set(body.participacao.map((p: any) => p.hashParticipacao));
    expect(hashes.size).toBe(5);

    for (const p of body.participacao) {
      expect(p.valorPago).toBe(2);
      expect(p.estadoPagamento).toBe("concluido");
      expect(JSON.parse(p.dadosParticipacao)).toHaveProperty("numero");
    }

    participacaoIds = body.participacao.map((p: any) => p.id);

    const vendidos = await prisma.numeroVendido.findMany({
      where: { jogoId: jogo1Id },
      orderBy: { numero: "asc" },
    });
    expect(vendidos).toHaveLength(5);
    expect(vendidos.map((v: any) => v.numero)).toEqual([1, 2, 3, 4, 5]);
    for (const v of vendidos) {
      expect(v.participacaoId).toBeTruthy();
      const part = await prisma.participacao.findUnique({
        where: { id: v.participacaoId },
      });
      expect(JSON.parse(part.dadosParticipacao).numero).toBe(v.numero);
    }

    const jogo = await prisma.jogo.findUnique({ where: { id: jogo1Id } });
    expect(jogo.totalAngariado).toBe(10);
    expect(jogo.totalParticipacoes).toBe(5);
    expect(jogo.stockAtual).toBe(95);
  });

  it("NumeroVendido duplicado é rejeitado pela constraint única (P2002)", async () => {
    const created = await prisma.numeroVendido.create({
      data: { jogoId: jogo1Id, numero: 10 },
    });
    expect(created).toBeTruthy();

    await expect(
      prisma.numeroVendido.create({
        data: { jogoId: jogo1Id, numero: 10 },
      })
    ).rejects.toMatchObject({ code: "P2002" });

    // Novo POST com o mesmo número → 400 "já foi vendido"
    const res = await participacaoPOST(
      req({
        jogoId: jogo1Id,
        dadosParticipacao: { numeros: [10] },
        quantidade: 1,
        metodoPagamento: "saldo",
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("já foi vendido");
  });

  it("2 compras concorrentes do mesmo número — só uma vence (stock e saldo revertem)", async () => {
    const buy = () =>
      participacaoPOST(
        req({
          jogoId: jogo2Id,
          dadosParticipacao: { numeros: [6] },
          quantidade: 1,
          metodoPagamento: "saldo",
        })
      ).then(async (r: Response) => ({ status: r.status, body: await r.json() }));

    const results = await Promise.allSettled([buy(), buy()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const success = fulfilled.filter((r: any) => r.value.status === 201);
    expect(success.length).toBe(1);

    const vendidos = await prisma.numeroVendido.findMany({
      where: { jogoId: jogo2Id, numero: 6 },
    });
    expect(vendidos).toHaveLength(1);

    const participacoes = await prisma.participacao.findMany({
      where: { jogoId: jogo2Id },
    });
    const comNumero6 = participacoes.filter((p: any) => JSON.parse(p.dadosParticipacao).numero === 6);
    expect(comNumero6).toHaveLength(1);

    // Stock: só 1 vendido (99), totalAngariado = 2
    const jogo = await prisma.jogo.findUnique({ where: { id: jogo2Id } });
    expect(jogo.stockAtual).toBe(99);
    expect(jogo.totalAngariado).toBe(2);
  });

  it("sorteio: vencedor corresponde ao número da participação (não ao [0])", async () => {
    // Commit (seed do servidor)
    const commitRes = await sorteioPATCH(
      req({ jogoId: jogo2Id, action: "commit" })
    );
    expect(commitRes.status).toBe(200);

    // Reveal
    const revealRes = await sorteioPOST(
      req({ jogoId: jogo2Id, clientSeed: "seed-cliente-teste" })
    );
    expect(revealRes.status).toBe(200);
    const body = await revealRes.json();
    expect(body.vencedorId).toBeTruthy();

    const vencedor = await prisma.participacao.findUnique({
      where: { id: body.vencedorId },
    });
    expect(vencedor.ganhador).toBe(true);

    const jogo = await prisma.jogo.findUnique({ where: { id: jogo2Id } });
    expect(jogo.sorteado).toBe(JSON.parse(vencedor.dadosParticipacao).numero);
    expect(jogo.isFinalizado).toBe(true);

    // Só um vencedor no jogo
    const ganhadores = await prisma.participacao.count({
      where: { jogoId: jogo2Id, ganhador: true },
    });
    expect(ganhadores).toBe(1);
  });

  it("prova de jogo: hash cobre o número exato da participação", async () => {
    const pId = participacaoIds[0];
    const res = await provaGET(
      { url: "http://test", headers: new Headers() } as any,
      { params: Promise.resolve({ id: pId }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verificavel).toBe(true);
    expect(body.numerosSelecionados).toHaveLength(1);

    const part = await prisma.participacao.findUnique({ where: { id: pId } });
    const numeroEsperado = JSON.parse(part.dadosParticipacao).numero;
    expect(body.numerosSelecionados[0]).toBe(numeroEsperado);

    // Verificação administrativa do hash também valida
    const verRes = await verificarPOST(
      req({ hash: part.hashParticipacao })
    );
    expect(verRes.status).toBe(200);
    const verBody = await verRes.json();
    expect(verBody.valido).toBe(true);
    expect(verBody.participacao.resultado).toEqual([numeroEsperado]);
  });

  it("números pendentes (MBWay) aparecem como ocupados", async () => {
    // Cria participação pendente (mbway) com o número 20
    const res = await participacaoPOST(
      req({
        jogoId: jogo1Id,
        dadosParticipacao: { numeros: [20] },
        quantidade: 1,
        metodoPagamento: "mbway",
      })
    );
    expect(res.status).toBe(201);
    const part = await prisma.participacao.findUnique({
      where: { id: (await res.json()).participacao.id },
    });
    expect(part.estadoPagamento).toBe("pendente");

    // O número ocupado inclui o pendente (e um novo POST com ele falha)
    const duplicado = await participacaoPOST(
      req({
        jogoId: jogo1Id,
        dadosParticipacao: { numeros: [20] },
        quantidade: 1,
        metodoPagamento: "saldo",
      })
    );
    expect(duplicado.status).toBe(400);
    const body = await duplicado.json();
    expect(body.error).toContain("já foi vendido");
  });
});
