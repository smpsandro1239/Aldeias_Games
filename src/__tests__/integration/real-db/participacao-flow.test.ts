// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

describe("Real DB: Participação com Saldo", () => {
  let prisma: any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("deve criar aldeia, evento, jogo, carregar saldo e criar participação", async () => {
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: "Aldeia Teste",
        slug: "aldeia-teste",
        tipoOrganizacao: "aldeia",
        telefone: "912345678",
        email: "teste@aldeia.pt",
        morada: "Rua Teste, 123",
      },
    });
    expect(aldeia).toBeDefined();
    expect(aldeia.id).toBeTruthy();

    const user = await prisma.user.create({
      data: {
        nome: "João Cliente",
        email: "joao@teste.pt",
        password: "$2b$10$fakehash",
        role: "user",
        saldo: 100,
        aldeiaId: aldeia.id,
      },
    });
    expect(user.saldo).toBe(100);

    const evento = await prisma.evento.create({
      data: {
        nome: "Evento Teste",
        slug: "evento-teste",
        descricao: "Descrição do evento",
        dataInicio: new Date("2026-01-01"),
        dataFim: new Date("2026-12-31"),
        objectivoAngariacao: 5000,
        estado: "ativo",
        aldeiaId: aldeia.id,
      },
    });
    expect(evento.id).toBeTruthy();

    const jogo = await prisma.jogo.create({
      data: {
        nome: "Rifa Teste",
        tipo: "rifa",
        preco: 5,
        stockInicial: 100,
        stockAtual: 100,
        totalParticipacoes: 0,
        totalAngariado: 0,
        estado: "aberto",
        eventoId: evento.id,
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100 }),
      },
    });
    expect(jogo.stockAtual).toBe(100);

    await prisma.$transaction(async (tx: any) => {
      const updated = await tx.jogo.updateMany({
        where: { id: jogo.id, stockAtual: { gte: 1 } },
        data: {
          stockAtual: { decrement: 1 },
          totalParticipacoes: { increment: 1 },
          totalAngariado: { increment: jogo.preco },
        },
      });
      expect(updated.count).toBe(1);

      await tx.user.update({
        where: { id: user.id },
        data: { saldo: { decrement: jogo.preco } },
      });

      await tx.participacao.create({
        data: {
          dadosParticipacao: JSON.stringify({}),
          jogoId: jogo.id,
          userId: user.id,
          valorPago: jogo.preco,
          metodoPagamento: "saldo",
          estadoPagamento: "concluido",
        },
      });

      await tx.transacao.create({
        data: {
          userId: user.id,
          tipo: "pagamento_jogo",
          valor: jogo.preco,
          descricao: `Pagamento: ${jogo.nome}`,
        },
      });
    });

    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(finalUser.saldo).toBe(95);

    const participacoes = await prisma.participacao.findMany({
      where: { userId: user.id },
    });
    expect(participacoes).toHaveLength(1);
    expect(participacoes[0].valorPago).toBe(5);

    const updatedJogo = await prisma.jogo.findUnique({
      where: { id: jogo.id },
    });
    expect(updatedJogo.stockAtual).toBe(99);
    expect(updatedJogo.totalParticipacoes).toBe(1);
    expect(updatedJogo.totalAngariado).toBe(5);
  });
});
