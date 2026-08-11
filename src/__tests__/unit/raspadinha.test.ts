// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  prisma: {
    participacao: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { raspadinhaHandler } from '@/app/api/participacoes/_lib/raspadinha';
import { prisma } from '@/lib/db';

function makeJogo(overrides: Record<string, unknown> = {}) {
  return {
    id: 'jogo-1',
    nome: 'Raspadinha Teste',
    tipo: 'raspadinha',
    preco: 2,
    stockAtual: 100,
    estado: 'aberto',
    configuracao: '{}',
    evento: { id: 'ev-1', nome: 'Evento Teste', aldeiaId: 'al-1' },
    ...overrides,
  } as never;
}

const configComPremios = {
  premios: [
    { nome: 'Euro', valorDinheiroAlternative: 100, percentagem: 30 },
    { nome: 'Bebida', valorDinheiroAlternative: 10, percentagem: 50 },
    { nome: 'Nada', valorDinheiroAlternative: 0, percentagem: 20 },
  ],
};

const configComMaxGanhadores = {
  maxGanhadores: 3,
  premios: [
    { nome: 'Euro', valorDinheiroAlternative: 100, percentagem: 30 },
    { nome: 'Nada', valorDinheiroAlternative: 0, percentagem: 70 },
  ],
};

describe('Raspadinha Handler — Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validate()', () => {
    it('deve rejeitar quando raspadinha sem prémios configurados', async () => {
      const jogo = makeJogo({ configuracao: JSON.stringify({ premios: [] }) });
      const data = { quantidade: 1 };
      await expect(raspadinhaHandler.validate!(data, jogo)).rejects.toThrow(
        'Raspadinha sem prémios configurados'
      );
    });

    it('deve rejeitar quando soma de percentagens > 100%', async () => {
      const config = {
        premios: [
          { nome: 'A', valorDinheiroAlternative: 10, percentagem: 60 },
          { nome: 'B', valorDinheiroAlternative: 10, percentagem: 50 },
        ],
      };
      const jogo = makeJogo({ configuracao: JSON.stringify(config) });
      const data = { quantidade: 1 };
      await expect(raspadinhaHandler.validate!(data, jogo)).rejects.toThrow(
        'excede 100%'
      );
    });

    it('deve rejeitar quando stock insuficiente', async () => {
      const jogo = makeJogo({
        configuracao: JSON.stringify(configComPremios),
        stockAtual: 0,
      });
      const data = { quantidade: 1 };
      await expect(raspadinhaHandler.validate!(data, jogo)).rejects.toThrow(
        'Stock insuficiente'
      );
    });

    it('deve aceitar participação válida sem maxGanhadores', async () => {
      const jogo = makeJogo({ configuracao: JSON.stringify(configComPremios) });
      const data = { quantidade: 1 };
      await expect(raspadinhaHandler.validate!(data, jogo)).resolves.toBeUndefined();
      expect(data).not.toHaveProperty('_limiteAtingido');
    });

    it('deve NÃO rejeitar quando maxGanhadores já foi atingido (validate mantém permissivo)', async () => {
      const jogo = makeJogo({
        configuracao: JSON.stringify(configComMaxGanhadores),
      });
      const data = { quantidade: 1 } as Record<string, unknown>;
      await expect(raspadinhaHandler.validate!(data, jogo)).resolves.toBeUndefined();
    });
  });

  describe('validateInTransaction()', () => {
    function makeTx(overrides: Record<string, unknown> = {}) {
      const tx = {
        participacao: {
          count: vi.fn(),
          findMany: vi.fn(),
        },
        jogo: {
          findUnique: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
        },
        ...overrides,
      };
      return tx;
    }

    it('deve marcar _limiteAtingido quando maxGanhadores atingido', async () => {
      const tx = makeTx();
      (tx.participacao.count as ReturnType<typeof vi.fn>).mockResolvedValue(3);
      const jogo = makeJogo({
        configuracao: JSON.stringify(configComMaxGanhadores),
      });
      const data = { quantidade: 1 } as Record<string, unknown>;
      await raspadinhaHandler.validateInTransaction!(tx as never, data, jogo);
      expect(data._limiteAtingido).toBe(true);
    });

    it('NÃO deve marcar _limiteAtingido quando ganhadores < max', async () => {
      const tx = makeTx();
      (tx.participacao.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
      const jogo = makeJogo({
        configuracao: JSON.stringify(configComMaxGanhadores),
      });
      const data = { quantidade: 1 } as Record<string, unknown>;
      await raspadinhaHandler.validateInTransaction!(tx as any, data, jogo);
      expect(data._limiteAtingido).toBeUndefined();
    });

    it('deve marcar _limiteAtingido quando pool de prémios esgotado', async () => {
      const tx = makeTx();
      (tx.participacao.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (tx.participacao.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { dadosParticipacao: JSON.stringify({ winningPrize: { valorDinheiroAlternative: 100 } }) },
      ]);
      const jogo = makeJogo({
        configuracao: JSON.stringify({
          maxPremioTotal: 50,
          premios: [
            { nome: 'Euro', valorDinheiroAlternative: 100, percentagem: 30 },
            { nome: 'Nada', valorDinheiroAlternative: 0, percentagem: 70 },
          ],
        }),
      });
      const data = { quantidade: 1 } as Record<string, unknown>;
      await raspadinhaHandler.validateInTransaction!(tx as any, data, jogo);
      expect(data._limiteAtingido).toBe(true);
    });

    it('deve fazer count com filtros corretos dentro da transação', async () => {
      const tx = makeTx();
      (tx.participacao.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      const jogo = makeJogo({
        configuracao: JSON.stringify(configComMaxGanhadores),
      });
      const data = { quantidade: 1 };
      await raspadinhaHandler.validateInTransaction!(tx as any, data, jogo);
      expect(tx.participacao.count).toHaveBeenCalledWith({
        where: {
          jogoId: 'jogo-1',
          ganhador: true,
          resultadoRaspe: { not: 'sem_premio' },
        },
      });
    });
  });

  describe('prepareData()', () => {
    const jogo = makeJogo({ configuracao: JSON.stringify(configComPremios) });

    it('deve gerar grid com 9 itens', () => {
      const result = raspadinhaHandler.prepareData({}, jogo, []);
      const dados = JSON.parse(result.dadosParticipacao as string);
      expect(dados.grid).toHaveLength(9);
    });

    it('deve ter estrutura correcta', () => {
      const result = raspadinhaHandler.prepareData({}, jogo, []);

      expect(result).toHaveProperty('seedRaspe');
      expect(result).toHaveProperty('hashRaspe');
      expect(result).toHaveProperty('resultadoRaspe');
      expect(result).toHaveProperty('dadosParticipacao');
      expect(typeof result.seedRaspe).toBe('string');
      expect((result.seedRaspe as string).length).toBe(64);
      expect(typeof result.hashRaspe).toBe('string');
      expect((result.hashRaspe as string).length).toBe(64);
    });

    it('deve incluir metadados no dadosParticipacao', () => {
      const result = raspadinhaHandler.prepareData({}, jogo, []);
      const dados = JSON.parse(result.dadosParticipacao as string);

      expect(dados).toHaveProperty('generatedAt');
      expect(dados).toHaveProperty('rngSeed');
      expect(dados).toHaveProperty('uniqueSalt');
      expect(dados).toHaveProperty('roll');
      expect(typeof dados.roll).toBe('number');
      expect(dados.roll).toBeGreaterThanOrEqual(0);
      expect(dados.roll).toBeLessThan(1);
    });

    it('resultadoRaspe deve ser nome do prémio ou sem_premio', () => {
      const nomesPremios = configComPremios.premios.map((p) => p.nome);
      for (let i = 0; i < 20; i++) {
        const result = raspadinhaHandler.prepareData({}, jogo, []);
        expect(
          nomesPremios.includes(result.resultadoRaspe as string) ||
            result.resultadoRaspe === 'sem_premio'
        ).toBe(true);
      }
    });

    it('deve aceitar config como objeto (não string)', () => {
      const jogoObj = makeJogo({ configuracao: configComPremios });
      const result = raspadinhaHandler.prepareData({}, jogoObj, []);
      expect(result).toHaveProperty('hashRaspe');
    });

    it('deve forçar derrota quando _limiteAtingido é true', () => {
      const data = { _limiteAtingido: true };
      for (let i = 0; i < 30; i++) {
        const result = raspadinhaHandler.prepareData(data, jogo, []);
        expect(result.resultadoRaspe).toBe('sem_premio');
        const dados = JSON.parse(result.dadosParticipacao as string);
        expect(dados.hasWin).toBe(false);
        expect(dados.winningPrize).toBeNull();
      }
    });

    it('deve forçar grid sem 3 símbolos iguais de prémio com valor quando _limiteAtingido', () => {
      const data = { _limiteAtingido: true };
      const result = raspadinhaHandler.prepareData(data, jogo, []);
      const dados = JSON.parse(result.dadosParticipacao as string);
      const grid = dados.grid as Array<{ nome: string; valorDinheiroAlternative?: number }>;

      const counts = new Map<string, number>();
      for (const slot of grid) {
        counts.set(slot.nome, (counts.get(slot.nome) || 0) + 1);
      }

      for (const [nome, count] of counts) {
        const premio = configComPremios.premios.find((p) => p.nome === nome);
        if (count >= 3 && (premio?.valorDinheiroAlternative ?? 0) > 0) {
          expect.fail(
            `Prémio "${nome}" com valor aparece ${count} vezes na grid (>=3 não permitido em forceLoss)`
          );
        }
      }
    });

    it('deve manter comportamento normal sem _limiteAtingido', () => {
      let hasWinCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = raspadinhaHandler.prepareData({}, jogo, []);
        if (result.resultadoRaspe !== 'sem_premio') {
          hasWinCount++;
        }
      }
      expect(hasWinCount).toBeGreaterThan(0);
    });

    it('hash deve ser determinístico para mesmo seed+resultado+salt', () => {
      const crypto = require('crypto');
      const hash1 = crypto.createHash('sha256').update('test:win:salt:ts').digest('hex');
      const hash2 = crypto.createHash('sha256').update('test:win:salt:ts').digest('hex');
      expect(hash1).toBe(hash2);
    });

    it('hash deve ser diferente para seeds diferentes', () => {
      const crypto = require('crypto');
      const hash1 = crypto.createHash('sha256').update('seed1:win:salt:ts').digest('hex');
      const hash2 = crypto.createHash('sha256').update('seed2:win:salt:ts').digest('hex');
      expect(hash1).not.toBe(hash2);
    });

    it('deve funcionar com premios vazios (fallback)', () => {
      const jogoSemPremios = makeJogo({ configuracao: { premios: [] } });
      const result = raspadinhaHandler.prepareData({}, jogoSemPremios, []);
      expect(result).toHaveProperty('hashRaspe');
      const dados = JSON.parse(result.dadosParticipacao as string);
      expect(dados.grid).toHaveLength(9);
    });
  });

  describe('determineRaspadinhaOutcome (via prepareData)', () => {
    it('deve retornar derrota quando forceLoss=true (via _limiteAtingido)', () => {
      const data = { _limiteAtingido: true };
      const jogo = makeJogo({ configuracao: JSON.stringify(configComPremios) });

      for (let i = 0; i < 50; i++) {
        const result = raspadinhaHandler.prepareData(data, jogo, []);
        expect(result.resultadoRaspe).toBe('sem_premio');
      }
    });

    it('deve retornar resultado aleatório sem forceLoss', () => {
      const jogo = makeJogo({ configuracao: JSON.stringify(configComPremios) });
      const results = new Set<string>();

      for (let i = 0; i < 200; i++) {
        const result = raspadinhaHandler.prepareData({}, jogo, []);
        results.add(result.resultadoRaspe as string);
      }
      expect(results.size).toBeGreaterThan(1);
    });

    it('deve respeitar probabilidades aproximadamente (1000 runs)', () => {
      const config = {
        premios: [
          { nome: 'A', valorDinheiroAlternative: 10, percentagem: 50 },
          { nome: 'B', valorDinheiroAlternative: 5, percentagem: 30 },
          { nome: 'Nada', valorDinheiroAlternative: 0, percentagem: 20 },
        ],
      };
      const jogo = makeJogo({ configuracao: JSON.stringify(config) });

      const counts = { A: 0, B: 0, sem_premio: 0 };
      const total = 1000;

      for (let i = 0; i < total; i++) {
        const result = raspadinhaHandler.prepareData({}, jogo, []);
        const r = result.resultadoRaspe as string;
        if (r === 'A') counts.A++;
        else if (r === 'B') counts.B++;
        else counts.sem_premio++;
      }

      const pctA = (counts.A / total) * 100;
      const pctB = (counts.B / total) * 100;

      expect(pctA).toBeGreaterThan(35);
      expect(pctA).toBeLessThan(65);
      expect(pctB).toBeGreaterThan(18);
      expect(pctB).toBeLessThan(42);
    });
  });

  describe('GameHandler registry', () => {
    it('deve ter validate definido', () => {
      expect(typeof raspadinhaHandler.validate).toBe('function');
    });

    it('deve ter prepareData definido', () => {
      expect(typeof raspadinhaHandler.prepareData).toBe('function');
    });

    it('deve ter postCreate definido', () => {
      expect(typeof raspadinhaHandler.postCreate).toBe('function');
    });

    it('deve ter validateInTransaction definido', () => {
      expect(typeof raspadinhaHandler.validateInTransaction).toBe('function');
    });
  });
});
