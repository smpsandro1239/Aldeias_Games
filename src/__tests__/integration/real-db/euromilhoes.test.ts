// @vitest-environment node
import { describe, beforeAll, afterAll, beforeEach, it, expect } from "vitest";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";
import { NextRequest } from "next/server";

async function seedBase(prisma: any) {
  const aldeia = await prisma.aldeia.create({
    data: {
      nome: "Aldeia Teste",
      slug: `aldeia-${Date.now()}`,
      tipoOrganizacao: "aldeia",
      telefone: "912345678",
      email: "teste@aldeia.pt",
      morada: "Rua Teste, 123",
    },
  });
  const evento = await prisma.evento.create({
    data: {
      nome: "Evento Euromilhões",
      slug: `evento-euro-${Date.now()}`,
      dataInicio: new Date("2026-01-01"),
      dataFim: new Date("2099-12-31"),
      estado: "ativo",
      aldeiaId: aldeia.id,
    },
  });
  const jogo = await prisma.jogo.create({
    data: {
      nome: "Euro Semanal",
      tipo: "euromilhoes",
      preco: 2,
      stockInicial: 500,
      stockAtual: 500,
      totalParticipacoes: 0,
      totalAngariado: 0,
      estado: "aberto",
      eventoId: evento.id,
      configuracao: JSON.stringify({ recorrente: true, premioValor: 1000000 }),
    },
  });
  return { aldeia, evento, jogo };
}

describe("Real DB: Euromilhões — grelhas, bloqueio e processRecorrentes", () => {
  let prisma: any;
  let handler: any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    handler = (await import("@/app/api/participacoes/_lib/euromilhoes")).euromilhoesHandler;
    process.env.CRON_SECRET = "test-cron-secret";
  });

  afterAll(async () => {
    delete process.env.CRON_SECRET;
    await teardownTestDatabase();
  });

  describe("validate — grelhas e bloqueio pré-sorteio", () => {
    let grelha: any;

    beforeEach(async () => {
      const { jogo } = await seedBase(prisma);
      const future = new Date(Date.now() + 86400000); // +1 dia
      grelha = await prisma.grelhaEuromilhoes.create({
        data: {
          jogoId: jogo.id,
          numero: 1,
          estado: "aberta",
          numerosOcupados: "[7, 14]",
          sorteioData: future,
          bloqueioData: future,
        },
      });
    });

    it("rejeita sem grelhaId", async () => {
      await expect(handler.validate({}, {})).rejects.toThrow("Grelha ID é obrigatório");
    });

    it("rejeita grelha inexistente", async () => {
      await expect(
        handler.validate({ grelhaId: "nonexistent" }, {})
      ).rejects.toThrow("Grelha não encontrada");
    });

    it("rejeita grelha fechada", async () => {
      await prisma.grelhaEuromilhoes.update({ where: { id: grelha.id }, data: { estado: "preenchida" } });
      await expect(
        handler.validate({ grelhaId: grelha.id }, {})
      ).rejects.toThrow("Grelha não está disponível");
    });

    it("rejeita grelha bloqueada (bloqueioData no passado)", async () => {
      await prisma.grelhaEuromilhoes.update({
        where: { id: grelha.id },
        data: { bloqueioData: new Date(Date.now() - 3600000) },
      });
      await expect(
        handler.validate({ grelhaId: grelha.id }, {})
      ).rejects.toThrow("Grelha bloqueada");
    });

    it("rejeita números fora do intervalo 1-50", async () => {
      await expect(
        handler.validate({ grelhaId: grelha.id, numerosSelecionados: [0, 51] }, {})
      ).rejects.toThrow("entre 1 e 50");
    });

    it("rejeita números duplicados", async () => {
      await expect(
        handler.validate({ grelhaId: grelha.id, numerosSelecionados: [3, 3] }, {})
      ).rejects.toThrow("Números duplicados");
    });

    it("rejeita número já ocupado na grelha", async () => {
      await expect(
        handler.validate({ grelhaId: grelha.id, numerosSelecionados: [7] }, {})
      ).rejects.toThrow("já foi selecionado");
    });

    it("aceita seleção válida", async () => {
      await expect(
        handler.validate({ grelhaId: grelha.id, numerosSelecionados: [3, 12] }, {})
      ).resolves.toBeUndefined();
    });
  });

  describe("postCreate — ocupação da grelha", () => {
    it("regista números escolhidos e marca preenchida aos 50", async () => {
      const { jogo } = await seedBase(prisma);
      const grelha = await prisma.grelhaEuromilhoes.create({
        data: {
          jogoId: jogo.id,
          numero: 1,
          estado: "aberta",
          numerosOcupados: "[]",
          bloqueioData: new Date(Date.now() + 86400000),
        },
      });

      await handler.postCreate(
        prisma,
        { grelhaId: grelha.id, numerosSelecionados: [10, 20, 30] },
        {},
        []
      );

      const updated = await prisma.grelhaEuromilhoes.findUnique({ where: { id: grelha.id } });
      expect(JSON.parse(updated.numerosOcupados)).toEqual([10, 20, 30]);
      expect(updated.estado).toBe("aberta");

      const nums = Array.from({ length: 50 }, (_, i) => i + 1);
      await handler.postCreate(prisma, { grelhaId: grelha.id, numerosSelecionados: nums }, {}, []);

      const full = await prisma.grelhaEuromilhoes.findUnique({ where: { id: grelha.id } });
      expect(full.estado).toBe("preenchida");
      expect(full.dataFecho).toBeTruthy();
    });
  });

  describe("processRecorrentes (cron)", () => {
    async function callRecorrentes(secretOn: boolean) {
      const req = new NextRequest("http://localhost/api/euromilhoes/recorrentes", {
        method: "GET",
        headers: secretOn ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : {},
      });
      const { GET } = await import("@/app/api/euromilhoes/recorrentes/route");
      return GET(req);
    }

    it("rejeita 401 sem token de cron", async () => {
      const res = await callRecorrentes(false);
      expect(res.status).toBe(401);
    });

    it("cria grelha para jogo recorrente em atraso", async () => {
      const { jogo } = await seedBase(prisma);
      await prisma.jogo.update({
        where: { id: jogo.id },
        data: { recorrente: true, ativo: true, proximaDataCriacao: new Date(Date.now() - 86400000) },
      });

      const res = await callRecorrentes(true);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.created).toBe(1);

      const [grelha] = await prisma.grelhaEuromilhoes.findMany({ where: { jogoId: jogo.id } });
      expect(grelha).toBeDefined();
      expect(grelha.numero).toBe(1);
    });

    it("é idempotente — não duplica grelha no mesmo sorteio", async () => {
      const { jogo } = await seedBase(prisma);
      await prisma.jogo.update({
        where: { id: jogo.id },
        data: { recorrente: true, ativo: true, proximaDataCriacao: new Date(Date.now() - 86400000) },
      });

      await callRecorrentes(true);
      const second = await callRecorrentes(true);
      const json = await second.json();
      expect(json.created).toBe(0);

      expect(
        await prisma.grelhaEuromilhoes.count({ where: { jogoId: jogo.id } })
      ).toBe(1);
    });

    it("respeita a numeração seguinte quando a 1 já existe", async () => {
      const { jogo } = await seedBase(prisma);
      await prisma.jogo.update({
        where: { id: jogo.id },
        data: { recorrente: true, ativo: true, proximaDataCriacao: new Date(Date.now() - 86400000) },
      });
      await prisma.grelhaEuromilhoes.create({
        data: {
          jogoId: jogo.id,
          numero: 1,
          estado: "preenchida",
          numerosOcupados: "[]",
          sorteioData: new Date(2000, 0, 1),
        },
      });

      const res = await callRecorrentes(true);
      const json = await res.json();
      expect(json.created).toBe(1);

      const grelhas = await prisma.grelhaEuromilhoes.findMany({
        where: { jogoId: jogo.id },
        orderBy: { numero: "asc" },
      });
      expect(grelhas.map((g: { numero: number }) => g.numero)).toEqual([1, 2]);
    });

    it("ignora jogos com próximo agendamento no futuro", async () => {
      const { jogo } = await seedBase(prisma);
      await prisma.jogo.update({
        where: { id: jogo.id },
        data: { recorrente: true, ativo: true, proximaDataCriacao: new Date(Date.now() + 86400000) },
      });

      const res = await callRecorrentes(true);
      const json = await res.json();
      expect(json.created).toBe(0);
      expect(
        await prisma.grelhaEuromilhoes.count({ where: { jogoId: jogo.id } })
      ).toBe(0);
    });
  });
});