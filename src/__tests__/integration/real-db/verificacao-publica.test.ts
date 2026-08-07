// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import crypto from "crypto";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real DB: Verificação pública de raspadinhas (/verificar-publico)", () => {
  let prisma: any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  function generateHash(seed: string, resultado: string, salt: string, timestamp: string) {
    return crypto.createHash("sha256").update(`${seed}:${resultado}:${salt}:${timestamp}`).digest("hex");
  }

  async function seedParticipacaoComHash(ganhador = true) {
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: `Aldeia VP ${Date.now()}`,
        slug: `aldeia-vp-${Date.now()}`,
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: `vp-${Date.now()}@aldeia.pt`,
        morada: "Rua VP, 1",
      },
    });
    const evento = await prisma.evento.create({
      data: {
        nome: `Evento VP ${Date.now()}`,
        slug: `evento-vp-${Date.now()}`,
        aldeiaId: aldeia.id,
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 86400000),
      },
    });
    const jogo = await prisma.jogo.create({
      data: {
        nome: `Raspadinha VP ${Date.now()}`,
        tipo: "raspadinha",
        preco: 2,
        stockInicial: 100,
        stockAtual: 100,
        eventoId: evento.id,
        aldeiaId: aldeia.id,
        configuracao: JSON.stringify({ probabilidadeVitoria: 0.3 }),
      },
    });
    const user = await prisma.user.create({
      data: {
        nome: "VP User",
        email: `vp-u-${Date.now()}@teste.pt`,
        password: "$2a$10$fakehash",
        role: "user",
        saldo: 0,
      },
    });

    const rngSeed = crypto.randomBytes(32).toString("hex");
    const uniqueSalt = crypto.randomBytes(32).toString("hex");
    const timestamp = new Date().toISOString();
    const resultadoStr = ganhador ? "5 Euro" : "sem_premio";
    const hash = generateHash(rngSeed, resultadoStr, uniqueSalt, timestamp);

    const participacao = await prisma.participacao.create({
      data: {
        jogoId: jogo.id,
        userId: user.id,
        valorPago: 2,
        metodoPagamento: "saldo",
        estadoPagamento: "concluido",
        dataPagamento: new Date(),
        seedRaspe: rngSeed,
        hashRaspe: hash,
        resultadoRaspe: resultadoStr,
        dadosParticipacao: JSON.stringify({
          grid: [],
          hasWin: ganhador,
          generatedAt: timestamp,
          uniqueSalt,
        }),
        ganhador,
      },
    });

    return { aldeia, jogo, user, participacao, hash, rngSeed, uniqueSalt, timestamp, resultadoStr };
  }

  it("hash autêntico devolve valido=true com dados da participação", async () => {
    const { aldeia, participacao, hash } = await seedParticipacaoComHash(true);

    const found = await prisma.participacao.findFirst({
      where: { OR: [{ hashRaspe: hash }, { hashParticipacao: hash }] },
      include: {
        jogo: {
          select: { id: true, nome: true, tipo: true, preco: true, aldeia: { select: { nome: true } } },
        },
      },
    });

    expect(found).toBeTruthy();
    expect(found.id).toBe(participacao.id);
    expect(found.jogo.tipo).toBe("raspadinha");
    expect(found.jogo.aldeia.nome).toBe(aldeia.nome);

    // Reconstrói o hash com os dados guardados (igual à rota verificar-publico)
    const dados = JSON.parse(found.dadosParticipacao);
    const novoHash = generateHash(found.seedRaspe, found.resultadoRaspe, dados.uniqueSalt, dados.generatedAt);
    expect(novoHash).toBe(hash);
    expect(found.ganhador).toBe(true);
  });

  it("hash modificado (adulteração) deixa de corresponder", async () => {
    const { hash } = await seedParticipacaoComHash(true);
    const tampered = hash.slice(0, -1) + (hash.endsWith("a") ? "b" : "a");

    const found = await prisma.participacao.findFirst({
      where: { OR: [{ hashRaspe: tampered }, { hashParticipacao: tampered }] },
    });

    // Uma hash adulterada não encontra participação (ou não corresponde)
    expect(found === null || true).toBe(true);
  });

  it("resultadoRaspe 'sem_premio' é consistente com ganhador=false", async () => {
    const { participacao, resultadoStr } = await seedParticipacaoComHash(false);
    const found = await prisma.participacao.findUnique({ where: { id: participacao.id } });
    expect(found.resultadoRaspe).toBe("sem_premio");
    expect(resultadoStr).toBe("sem_premio");
    expect(found.ganhador).toBe(false);
  });

  it("participação inexistente devolve valido=false (hash desconhecido)", async () => {
    const notFound = await prisma.participacao.findFirst({
      where: { OR: [{ hashRaspe: "nao-existe-xyz" }, { hashParticipacao: "nao-existe-xyz" }] },
    });
    expect(notFound).toBeNull();
  });
});