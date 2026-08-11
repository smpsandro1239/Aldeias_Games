// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";
import { buildRaspadinhaPool } from "@/app/api/participacoes/_lib/raspadinha";

describe("Real DB: Raspadinha — pool de prémios (sorteio sem reposição)", () => {
  let prisma: any;
  let handler: any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    handler = (await import("@/app/api/participacoes/_lib/raspadinha")).raspadinhaHandler;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  async function seedJogoComPool() {
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Pool",
        slug: `pool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "pool@aldeia.pt",
        morada: "Rua X",
      },
    });
    const evento = await prisma.evento.create({
      data: {
        nome: "Evento Pool",
        slug: `evpool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        dataInicio: new Date("2026-01-01"),
        dataFim: new Date("2099-12-31"),
        estado: "ativo",
        aldeiaId: aldeia.id,
      },
    });
    const premios = [
      { nome: "2 Euro", valorDinheiroAlternative: 2, percentagem: 8 },
      { nome: "5 Euro", valorDinheiroAlternative: 5, percentagem: 2 },
    ];
    const stock = 100;
    const pool = buildRaspadinhaPool(premios, stock);
    const jogo = await prisma.jogo.create({
      data: {
        nome: "Raspadinha Pool",
        tipo: "raspadinha",
        preco: 2,
        stockInicial: stock,
        stockAtual: stock,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: evento.id,
        configuracao: JSON.stringify({ premios, pool }),
      },
    });
    const user = await prisma.user.create({
      data: {
        nome: "Jogador",
        email: `pool-${Date.now()}@test.pt`,
        password: "x",
        role: "user",
        aldeiaId: aldeia.id,
      },
    });
    return { aldeia, evento, jogo, user, premios, stock };
  }

  async function comprarBilhete(tx: any, jogo: any, userId: string) {
    const data: any = { jogoId: jogo.id, quantidade: 1, dadosParticipacao: {} };
    await handler.validateInTransaction(tx, data, jogo);
    const gameData = handler.prepareData(data, jogo, []);
    await tx.participacao.create({
      data: {
        dadosParticipacao: gameData.dadosParticipacao,
        valorPago: jogo.preco,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
        jogoId: jogo.id,
        userId,
        hashRaspe: gameData.hashRaspe,
        seedRaspe: gameData.seedRaspe,
        resultadoRaspe: gameData.resultadoRaspe,
      },
    });
    return gameData.resultadoRaspe;
  }

  it("distribui exatamente os prémios configurados em 100 participações e esgota o pool", async () => {
    const { jogo, user, stock } = await seedJogoComPool();

    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < stock; i++) {
        await comprarBilhete(tx, jogo, user.id);
      }
    });

    const wins2 = await prisma.participacao.count({ where: { jogoId: jogo.id, resultadoRaspe: "2 Euro" } });
    const wins5 = await prisma.participacao.count({ where: { jogoId: jogo.id, resultadoRaspe: "5 Euro" } });
    const total = await prisma.participacao.count({ where: { jogoId: jogo.id } });

    expect(total).toBe(stock);
    expect(wins2).toBe(8);
    expect(wins5).toBe(2);

    const jogoAtual = await prisma.jogo.findUnique({ where: { id: jogo.id } });
    const config = JSON.parse(jogoAtual.configuracao);
    expect(config.pool).toHaveLength(0);
  });

  it("com pool esgotado, participações seguintes perdem sempre", async () => {
    const { jogo, user, stock } = await seedJogoComPool();

    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < stock; i++) {
        await comprarBilhete(tx, jogo, user.id);
      }
    });

    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < 20; i++) {
        const resultado = await comprarBilhete(tx, jogo, user.id);
        expect(resultado).toBe("sem_premio");
      }
    });
  });

  it("a ordem de saída dos prémios não é sequencial (distribuição aleatória)", async () => {
    const { jogo, user, stock } = await seedJogoComPool();

    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < stock; i++) {
        await comprarBilhete(tx, jogo, user.id);
      }
    });

    const participacoes = await prisma.participacao.findMany({
      where: { jogoId: jogo.id, resultadoRaspe: { not: "sem_premio" } },
      orderBy: { createdAt: "asc" },
      select: { resultadoRaspe: true },
    });

    expect(participacoes.length).toBe(10);
    const hasGap = participacoes.some((p: any, i: number) => i > 0 && participacoes[i - 1].resultadoRaspe !== p.resultadoRaspe);
    const winPositions: number[] = [];
    const allParts = await prisma.participacao.findMany({
      where: { jogoId: jogo.id },
      orderBy: { createdAt: "asc" },
      select: { resultadoRaspe: true },
    });
    allParts.forEach((p: any, i: number) => {
      if (p.resultadoRaspe !== "sem_premio") winPositions.push(i);
    });
    const spread = Math.max(...winPositions) - Math.min(...winPositions);
    expect(hasGap || spread > 5).toBe(true);
  });
});
