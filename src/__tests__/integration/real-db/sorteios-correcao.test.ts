// @vitest-environment node
import { describe, beforeAll, afterAll, beforeEach, it, expect, vi } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";
import { hashClientSeed } from "@/lib/lottery-utils";

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

describe("Real DB: Sorteios — commit/reveal provably-fair, dryRun e notificações", () => {
  let prisma: any;
  let sorteiosPATCH: any;
  let sorteiosPOST: any;
  let testePOST: any;
  let admin: any;
  let comprador: any;
  let rifaTesteId: string;
  let rifaLegacyId: string;
  let euroId: string;

  const req = (body: unknown, url = "http://test") =>
    ({ json: async () => body, headers: new Headers(), url }) as any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();

    const sorteios = await import("@/app/api/sorteios/route");
    const teste = await import("@/app/api/sorteios/teste/route");
    sorteiosPATCH = sorteios.PATCH;
    sorteiosPOST = sorteios.POST;
    testePOST = teste.POST;

    const permManage = await prisma.permission.create({
      data: { key: "MANAGE_ALDEIA", description: "Gerir aldeia" },
    });
    const roleAdmin = await prisma.role.create({
      data: { name: "ALDEIA_ADMIN", description: "Admin sorteios" },
    });
    await prisma.rolePermission.create({
      data: { roleId: roleAdmin.id, permissionId: permManage.id },
    });

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Sorteio",
        slug: "aldeia-sorteio",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "sorteio@aldeia.pt",
        morada: "Rua Sorteio, 1",
      },
    });

    admin = await prisma.user.create({
      data: {
        nome: "Admin Sorteio",
        email: "adminsorteio@teste.pt",
        password: "$2b$10$fakehash",
        role: "aldeia_admin",
        aldeiaId: aldeia.id,
        saldo: 1000,
      },
    });
    await prisma.userGlobalRole.create({
      data: { userId: admin.id, roleId: roleAdmin.id },
    });

    comprador = await prisma.user.create({
      data: {
        nome: "Comprador Sorteio",
        email: "comprador@teste.pt",
        password: "$2b$10$fakehash",
        role: "user",
        saldo: 1000,
      },
    });
    mocks.user = admin;

    const evento = await prisma.evento.create({
      data: {
        nome: "Evento Sorteio",
        slug: "evento-sorteio",
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });

    const makeJogo = async (nome: string, tipo: string, config: Record<string, unknown>) => {
      const jogo = await prisma.jogo.create({
        data: {
          nome,
          tipo,
          preco: 2,
          stockInicial: 500,
          stockAtual: 500,
          totalParticipacoes: 0,
          totalAngariado: 0,
          estado: "aberto",
          eventoId: evento.id,
          configuracao: JSON.stringify(config),
        },
      });
      return jogo.id;
    };

    rifaTesteId = await makeJogo("Rifa Teste", "rifa", {
      numeroInicial: 1,
      numeroFinal: 100,
      numeroBlocos: 1,
    });
    rifaLegacyId = await makeJogo("Rifa Legacy", "rifa", {
      numeroInicial: 1,
      numeroFinal: 100,
      numeroBlocos: 1,
    });
    euroId = await makeJogo("Euro Sorteio", "euromilhoes", { premioValor: 1000 });

    // Rifa (formato novo): 1 participação = 1 número, 1..100 (garante vencedor)
    await prisma.participacao.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({
        jogoId: rifaTesteId,
        userId: comprador.id,
        dadosParticipacao: JSON.stringify({ numero: i + 1 }),
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
      })),
    });

    // Rifa legacy: {numeros: [N]} numa participação
    await prisma.participacao.createMany({
      data: Array.from({ length: 100 }, (_, i) => ({
        jogoId: rifaLegacyId,
        userId: comprador.id,
        dadosParticipacao: JSON.stringify({ numeros: [i + 1] }),
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
      })),
    });

    // Euromilhões: grelha aberta + 1 participação por número (formato M4)
    const grelha = await prisma.grelhaEuromilhoes.create({
      data: {
        jogoId: euroId,
        numero: 1,
        estado: "aberta",
        numerosOcupados: JSON.stringify(Array.from({ length: 50 }, (_, i) => i + 1)),
      },
    });
    await prisma.participacao.createMany({
      data: Array.from({ length: 50 }, (_, i) => ({
        jogoId: euroId,
        userId: comprador.id,
        grelhaId: grelha.id,
        dadosParticipacao: JSON.stringify({ numero: i + 1 }),
        numerosSelecionados: JSON.stringify([i + 1]),
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
      })),
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect?.();
    teardownTestDatabase();
  });

  beforeEach(async () => {
    mocks.user = admin;
    await prisma.rateLimit.deleteMany({});
  });

  it("teste rifa (formato novo {numero}) encontra o vencedor do número sorteado", async () => {
    const res = await testePOST(req({ jogoId: rifaTesteId }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.modoTeste).toBe(true);

    const numeroVencedor = body.data.resultado.numeroVencedor;
    expect(numeroVencedor).toBeGreaterThanOrEqual(1);
    expect(numeroVencedor).toBeLessThanOrEqual(100);

    // Com 1..100 vendidos, há exatamente 1 vencedor com o número sorteado
    expect(body.data.vencedores).toBe(1);
    expect(body.data.vencedoresDetalhes[0].numero).toBe(numeroVencedor);
    expect(body.data.vencedoresDetalhes[0].userNome).toBe("Comprador Sorteio");
    expect(body.data.vencedoresDetalhes[0].userId).toBe(comprador.id);
  });

  it("teste rifa legacy ({numeros:[N]}) também encontra vencedores", async () => {
    const res = await testePOST(req({ jogoId: rifaLegacyId }));
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.vencedores).toBe(1);
    const numeroVencedor = body.data.resultado.numeroVencedor;
    expect(body.data.vencedoresDetalhes[0].numero).toBe(numeroVencedor);
  });

  it("teste euromilhões sorteia 1-50 e encontra a participação do número", async () => {
    const res = await testePOST(req({ jogoId: euroId }));
    const body = await res.json();
    expect(body.success).toBe(true);
    const numeroVencedor = body.data.resultado.numeroVencedor;
    expect(numeroVencedor).toBeGreaterThanOrEqual(1);
    expect(numeroVencedor).toBeLessThanOrEqual(50);
    expect(body.data.vencedores).toBe(1);
    expect(body.data.vencedoresDetalhes[0].numero).toBe(numeroVencedor);
  });

  it("commit + reveal real: hash do compromisso verificado, vencedor persistido, notificações criadas", async () => {
    const jogo = await prisma.jogo.create({
      data: {
        nome: "Rifa Real",
        tipo: "rifa",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: (await prisma.evento.findFirst()).id,
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100, numeroBlocos: 1 }),
      },
    });
    await prisma.participacao.createMany({
      data: Array.from({ length: 5 }, (_, i) => ({
        jogoId: jogo.id,
        userId: comprador.id,
        dadosParticipacao: JSON.stringify({ numero: i + 1 }),
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
      })),
    });

    const clientSeed = "client-seed-teste-123";
    const commit = hashClientSeed(clientSeed);

    // Passo 1 — commit
    const commitRes = await sorteiosPATCH(
      req({ jogoId: jogo.id, action: "commit", clientSeedCommit: commit })
    );
    expect(commitRes.status).toBe(200);
    const commitBody = await commitRes.json();
    expect(commitBody.hash).toBeTruthy();

    const jogoComprometido = await prisma.jogo.findUnique({ where: { id: jogo.id } });
    expect(jogoComprometido.hashSorteio).toBe(commitBody.hash);
    expect(jogoComprometido.seedSorteio).toBeTruthy();
    expect(jogoComprometido.clientSeedCommit).toBe(commit);

    const sorteioPendente = await prisma.sorteio.findFirst({
      where: { jogoId: jogo.id, fase: "pendente" },
    });
    expect(sorteioPendente).toBeTruthy();
    expect(sorteioPendente.clientSeedCommit).toBe(commit);

    // Passo 2 — reveal com a seed correta
    const revealRes = await sorteiosPOST(
      req({ jogoId: jogo.id, clientSeed, dryRun: false })
    );
    expect(revealRes.status).toBe(200);
    const revealBody = await revealRes.json();
    expect(revealBody.success).toBe(true);
    expect(revealBody.vencedorId).toBeTruthy();
    expect(revealBody.notificados).toBe(5);

    // Vencedor persistido
    const vencedor = await prisma.participacao.findUnique({
      where: { id: revealBody.vencedorId },
    });
    expect(vencedor.ganhador).toBe(true);

    // Jogo finalizado
    const jogoFinal = await prisma.jogo.findUnique({ where: { id: jogo.id } });
    expect(jogoFinal.isFinalizado).toBe(true);
    expect(jogoFinal.sorteado).toBe(revealBody.resultado);
    expect(jogoFinal.dataSorteio).toBeTruthy();

    // Sorteio revelado
    const sorteioRevelado = await prisma.sorteio.findFirst({
      where: { jogoId: jogo.id, fase: "revelado" },
    });
    expect(sorteioRevelado).toBeTruthy();
    expect(sorteioRevelado.resultado).toBe(String(revealBody.resultado));

    // Notificações tipo 'sorteio' para todos os participantes
    const notificacoes = await prisma.notificacao.findMany({
      where: { userId: comprador.id, tipo: "sorteio" },
    });
    expect(notificacoes.length).toBeGreaterThanOrEqual(5);
    expect(notificacoes[0].titulo).toContain("Sorteio concluído");
  });

  it("reveal com client seed adulterada é rejeitado (400)", async () => {
    const jogo = await prisma.jogo.create({
      data: {
        nome: "Rifa Adulterada",
        tipo: "rifa",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: (await prisma.evento.findFirst()).id,
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100, numeroBlocos: 1 }),
      },
    });
    await prisma.participacao.createMany({
      data: Array.from({ length: 3 }, (_, i) => ({
        jogoId: jogo.id,
        userId: comprador.id,
        dadosParticipacao: JSON.stringify({ numero: i + 1 }),
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
      })),
    });

    const commit = hashClientSeed("seed-legitima");
    await sorteiosPATCH(req({ jogoId: jogo.id, action: "commit", clientSeedCommit: commit }));

    const revealRes = await sorteiosPOST(
      req({ jogoId: jogo.id, clientSeed: "seed-adulterada", dryRun: false })
    );
    expect(revealRes.status).toBe(400);
    const body = await revealRes.json();
    expect(body.error).toContain("não corresponde ao compromisso");

    // Nada foi persistido
    const jogoAdulterado = await prisma.jogo.findUnique({ where: { id: jogo.id } });
    expect(jogoAdulterado.isFinalizado).toBe(false);
  });

  it("reveal sem client seed (com compromisso) é rejeitado", async () => {
    const jogo = await prisma.jogo.create({
      data: {
        nome: "Rifa Sem Seed",
        tipo: "rifa",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: (await prisma.evento.findFirst()).id,
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100, numeroBlocos: 1 }),
      },
    });
    await prisma.participacao.createMany({
      data: Array.from({ length: 3 }, (_, i) => ({
        jogoId: jogo.id,
        userId: comprador.id,
        dadosParticipacao: JSON.stringify({ numero: i + 1 }),
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
      })),
    });

    await sorteiosPATCH(
      req({ jogoId: jogo.id, action: "commit", clientSeedCommit: hashClientSeed("x") })
    );
    const revealRes = await sorteiosPOST(req({ jogoId: jogo.id, dryRun: false }));
    expect(revealRes.status).toBe(400);
    const body = await revealRes.json();
    expect(body.error).toContain("obrigatória");
  });

  it("dryRun simula sem persistir vencedores nem finalizar o jogo", async () => {
    const jogo = await prisma.jogo.create({
      data: {
        nome: "Rifa Dry",
        tipo: "rifa",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: (await prisma.evento.findFirst()).id,
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100, numeroBlocos: 1 }),
      },
    });
    await prisma.participacao.createMany({
      data: Array.from({ length: 4 }, (_, i) => ({
        jogoId: jogo.id,
        userId: comprador.id,
        dadosParticipacao: JSON.stringify({ numero: i + 1 }),
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
      })),
    });

    const clientSeed = "seed-dry-run";
    const inicioDryRun = new Date();
    await sorteiosPATCH(
      req({ jogoId: jogo.id, action: "commit", clientSeedCommit: hashClientSeed(clientSeed) })
    );

    const res = await sorteiosPOST(
      req({ jogoId: jogo.id, clientSeed, dryRun: true })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dryRun).toBe(true);
    expect(body.vencedorId).toBeTruthy();

    // Nada persistido
    const ganhadores = await prisma.participacao.count({
      where: { jogoId: jogo.id, ganhador: true },
    });
    expect(ganhadores).toBe(0);
    const jogoDry = await prisma.jogo.findUnique({ where: { id: jogo.id } });
    expect(jogoDry.isFinalizado).toBe(false);
    expect(jogoDry.sorteado).toBe(null);

    const sorteio = await prisma.sorteio.findFirst({ where: { jogoId: jogo.id } });
    expect(sorteio.fase).toBe("pendente");

    const notificacoes = await prisma.notificacao.count({
      where: {
        tipo: "sorteio",
        userId: { in: (await prisma.participacao.findMany({ where: { jogoId: jogo.id }, select: { userId: true } })).map((p) => p.userId) },
        createdAt: { gt: inicioDryRun },
      },
    });
    expect(notificacoes).toBe(0);
  });

  it("commit sem clientSeedCommit mantém compatibilidade (reveal sem seed)", async () => {
    const jogo = await prisma.jogo.create({
      data: {
        nome: "Rifa Legacy Commit",
        tipo: "rifa",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: (await prisma.evento.findFirst()).id,
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100, numeroBlocos: 1 }),
      },
    });
    await prisma.participacao.createMany({
      data: Array.from({ length: 3 }, (_, i) => ({
        jogoId: jogo.id,
        userId: comprador.id,
        dadosParticipacao: JSON.stringify({ numero: i + 1 }),
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
      })),
    });

    const commitRes = await sorteiosPATCH(req({ jogoId: jogo.id, action: "commit" }));
    expect(commitRes.status).toBe(200);

    const revealRes = await sorteiosPOST(req({ jogoId: jogo.id, dryRun: false }));
    expect(revealRes.status).toBe(200);
    const body = await revealRes.json();
    expect(body.vencedorId).toBeTruthy();
    expect(body.notificados).toBe(3);
  });
});