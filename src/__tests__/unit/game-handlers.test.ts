// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

vi.mock('@/lib/db', () => ({
  prisma: {
    grelhaEuromilhoes: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/time', () => ({
  getOfficialTime: vi.fn().mockResolvedValue(new Date('2026-07-14T18:00:00Z')),
  getNextFriday: vi.fn((ref: Date) => new Date(ref.getTime() + 86400000)),
  getBloqueioData: vi.fn((ref: Date) => new Date(ref.getTime() - 7200000)),
}));

import { raspadinhaHandler } from '@/app/api/participacoes/_lib/raspadinha';
import { rifaHandler } from '@/app/api/participacoes/_lib/rifa';
import { poioHandler } from '@/app/api/participacoes/_lib/poio';
import { euromilhoesHandler } from '@/app/api/participacoes/_lib/euromilhoes';
import { getGameHandler } from '@/app/api/participacoes/_lib';
import { prisma } from '@/lib/db';
import { getOfficialTime } from '@/lib/time';

function makeJogo(overrides: Record<string, any> = {}) {
  return {
    id: 'jogo-1',
    nome: 'Jogo Teste',
    tipo: 'rifa',
    preco: 2,
    stockAtual: 100,
    estado: 'aberto',
    configuracao: '{}',
    evento: { id: 'ev-1', nome: 'Evento Teste', aldeiaId: 'al-1' },
    ...overrides,
  } as any;
}

describe('Game Handler Registry (index.ts)', () => {
  it('deve retornar handler para raspadinha', () => {
    expect(getGameHandler('raspadinha')).toBe(raspadinhaHandler);
  });

  it('deve retornar handler para rifa', () => {
    expect(getGameHandler('rifa')).toBe(rifaHandler);
  });

  it('deve retornar handler para poio_da_vaca', () => {
    expect(getGameHandler('poio_da_vaca')).toBe(poioHandler);
  });

  it('deve retornar handler para euromilhoes', () => {
    expect(getGameHandler('euromilhoes')).toBe(euromilhoesHandler);
  });

  it('deve retornar null para tipo desconhecido', () => {
    expect(getGameHandler('jogo_desconhecido')).toBeNull();
  });

  it('todos os handlers têm prepareData', () => {
    for (const tipo of ['raspadinha', 'rifa', 'poio_da_vaca', 'euromilhoes']) {
      const h = getGameHandler(tipo);
      expect(h).toBeDefined();
      expect(typeof h!.prepareData).toBe('function');
    }
  });
});

describe('Raspadinha Handler', () => {
  const config = {
    premios: [
      { nome: 'Euro', valorDinheiroAlternative: 100, percentagem: 30 },
      { nome: 'Bebida', valorDinheiroAlternative: 10, percentagem: 50 },
      { nome: 'Nada', valorDinheiroAlternative: 0, percentagem: 20 },
    ],
  };

  const jogo = makeJogo({ tipo: 'raspadinha', configuracao: JSON.stringify(config) });

  it('deve retornar dados com estrutura correta', () => {
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

  it('deve gerar grid com 9 itens', () => {
    const result = raspadinhaHandler.prepareData({}, jogo, []);
    const dados = JSON.parse(result.dadosParticipacao as string);
    expect(dados.grid).toHaveLength(9);
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
    for (let i = 0; i < 20; i++) {
      const result = raspadinhaHandler.prepareData({}, jogo, []);
      const nomesPremios = config.premios.map((p: any) => p.nome);
      expect(
        nomesPremios.includes(result.resultadoRaspe as string) ||
        result.resultadoRaspe === 'sem_premio'
      ).toBe(true);
    }
  });

  it('deve aceitar config como objeto (não string)', () => {
    const jogoObj = makeJogo({ tipo: 'raspadinha', configuracao: config });
    const result = raspadinhaHandler.prepareData({}, jogoObj, []);
    expect(result).toHaveProperty('hashRaspe');
  });

  it('hash deve ser determinístico para mesmo seed+resultado+salt', () => {
    const hash1 = crypto.createHash('sha256').update('test:win:salt:ts').digest('hex');
    const hash2 = crypto.createHash('sha256').update('test:win:salt:ts').digest('hex');
    expect(hash1).toBe(hash2);
  });

  it('hash deve ser diferente para seeds diferentes', () => {
    const hash1 = crypto.createHash('sha256').update('seed1:win:salt:ts').digest('hex');
    const hash2 = crypto.createHash('sha256').update('seed2:win:salt:ts').digest('hex');
    expect(hash1).not.toBe(hash2);
  });

  it('deve funcionar com premios vazios (fallback)', () => {
    const jogoSemPremios = makeJogo({ tipo: 'raspadinha', configuracao: { premios: [] } });
    const result = raspadinhaHandler.prepareData({}, jogoSemPremios, []);
    expect(result).toHaveProperty('hashRaspe');
  });
});

describe('Rifa Handler', () => {
  const jogo = makeJogo({ tipo: 'rifa' });

  describe('validate', () => {
    it('deve aceitar dados válidos', async () => {
      const data = { quantidade: 3, dadosParticipacao: { numeros: [1, 5, 10] } };
      await expect(rifaHandler.validate!(data, jogo)).resolves.toBeUndefined();
    });

    it('deve rejeitar quando numeros não é array', async () => {
      const data = { quantidade: 1, dadosParticipacao: {} };
      await expect(rifaHandler.validate!(data, jogo)).rejects.toThrow('Quantidade deve corresponder');
    });

    it('deve rejeitar quando quantidade não corresponde', async () => {
      const data = { quantidade: 3, dadosParticipacao: { numeros: [1, 2] } };
      await expect(rifaHandler.validate!(data, jogo)).rejects.toThrow('Quantidade deve corresponder');
    });

    it('deve rejeitar números duplicados', async () => {
      const data = { quantidade: 3, dadosParticipacao: { numeros: [1, 2, 1] } };
      await expect(rifaHandler.validate!(data, jogo)).rejects.toThrow('Números duplicados');
    });

    it('deve aceitar quantidade 1 com array de 1', async () => {
      const data = { quantidade: 1, dadosParticipacao: { numeros: [42] } };
      await expect(rifaHandler.validate!(data, jogo)).resolves.toBeUndefined();
    });
  });

  describe('prepareData', () => {
    it('deve retornar hashParticipacao e dadosVerificacao', () => {
      const data = { dadosParticipacao: { numeros: [1, 2, 3] } };
      const result = rifaHandler.prepareData(data, jogo, []);

      expect(result).toHaveProperty('hashParticipacao');
      expect(result).toHaveProperty('dadosVerificacao');
      expect((result.hashParticipacao as string).length).toBe(64);
    });

    it('cada participação fica com UM número (1 participação = 1 número)', () => {
      const data = { dadosParticipacao: { numeros: [7, 14, 21] } };
      const primeira = rifaHandler.prepareData(data, jogo, []);
      expect(JSON.parse(primeira.dadosParticipacao as string)).toEqual({ numero: 7 });

      const segunda = rifaHandler.prepareData(data, jogo, [{ id: 'p0' }]);
      expect(JSON.parse(segunda.dadosParticipacao as string)).toEqual({ numero: 14 });

      const terceira = rifaHandler.prepareData(data, jogo, [{ id: 'p0' }, { id: 'p1' }]);
      expect(JSON.parse(terceira.dadosParticipacao as string)).toEqual({ numero: 21 });
    });

    it('dadosVerificacao deve conter o número, seed e hash', () => {
      const data = { dadosParticipacao: { numeros: [7, 14, 21] } };
      const result = rifaHandler.prepareData(data, jogo, []);
      const verificacao = JSON.parse(result.dadosVerificacao as string);

      expect(verificacao.numero).toBe(7);
      expect(verificacao).toHaveProperty('seed');
      expect(verificacao).toHaveProperty('timestamp');
      expect(verificacao).toHaveProperty('uniqueSalt');
      expect(verificacao).toHaveProperty('hash');
      expect(verificacao.hash).toBe(result.hashParticipacao);
    });

    it('hash cobre o número exato da participação', () => {
      const data = { dadosParticipacao: { numeros: [42] } };
      const result = rifaHandler.prepareData(data, jogo, []);
      const v = JSON.parse(result.dadosVerificacao as string);
      const recomputado = crypto.createHash('sha256')
        .update(`${v.seed}:${JSON.stringify([42])}:${v.uniqueSalt}:${v.timestamp}`)
        .digest('hex');
      expect(recomputado).toBe(result.hashParticipacao);
    });

    it('quantidade > numeros existentes -> número inválido', () => {
      const data = { quantidade: 3, dadosParticipacao: { numeros: [1, 2] } };
      expect(() => rifaHandler.prepareData(data, jogo, [{ id: 'p0' }, { id: 'p1' }])).toThrow('Número inválido');
    });
  });
});

describe('Poio da Vaca Handler', () => {
  const jogo = makeJogo({ tipo: 'poio_da_vaca' });

  it('deve retornar hashParticipacao e dadosVerificacao', () => {
    const data = { dadosParticipacao: { coordenadas: ['A1', 'B5', 'C3'] } };
    const result = poioHandler.prepareData(data, jogo, []);

    expect(result).toHaveProperty('hashParticipacao');
    expect(result).toHaveProperty('dadosVerificacao');
      expect((result.hashParticipacao as string).length).toBe(64);
  });

  it('dadosVerificacao deve conter coordenadas', () => {
    const data = { dadosParticipacao: { coordenadas: ['A1', 'B5'] } };
    const result = poioHandler.prepareData(data, jogo, []);
    const verificacao = JSON.parse(result.dadosVerificacao as string);

    expect(verificacao.coordenadas).toEqual(['A1', 'B5']);
    expect(verificacao).toHaveProperty('seed');
    expect(verificacao).toHaveProperty('timestamp');
  });

  it('deve funcionar com coordenadas vazias', () => {
    const data = { dadosParticipacao: { coordenadas: [] } };
    const result = poioHandler.prepareData(data, jogo, []);
    expect(result).toHaveProperty('hashParticipacao');
  });

  it('deve funcionar sem dadosParticipacao', () => {
    const data = {};
    const result = poioHandler.prepareData(data, jogo, []);
    expect(result).toHaveProperty('hashParticipacao');
  });
});

describe('Euromilhões Handler', () => {
  const jogo = makeJogo({ tipo: 'euromilhoes' });

  describe('validate', () => {
    const mockGrelha = {
      id: 'grelha-1',
      estado: 'aberta',
      bloqueioData: new Date('2026-07-17T15:00:00Z'),
      numerosOcupados: '[]',
    };

    beforeEach(() => {
      vi.clearAllMocks();
      (prisma.grelhaEuromilhoes.findUnique as any).mockResolvedValue(mockGrelha);
      (getOfficialTime as any).mockResolvedValue(new Date('2026-07-14T18:00:00Z'));
    });

    it('deve aceitar dados válidos', async () => {
      const data = { grelhaId: 'grelha-1', numerosSelecionados: [1, 25, 50] };
      await expect(euromilhoesHandler.validate!(data, jogo)).resolves.not.toThrow();
    });

    it('deve rejeitar sem grelhaId quando o jogo não tem id', async () => {
      const data = { numerosSelecionados: [1, 25] };
      await expect(euromilhoesHandler.validate!(data, {} as any)).rejects.toThrow('Grelha ID é obrigatório');
    });

    it('deve usar grelha aberta existente quando grelhaId não é enviado', async () => {
      (prisma.grelhaEuromilhoes.findFirst as any).mockResolvedValue(mockGrelha);
      const data = { numerosSelecionados: [1, 25] };
      await euromilhoesHandler.validate!(data, jogo);
      expect(data.grelhaId).toBe('grelha-1');
    });

    it('deve auto-criar grelha quando o jogo não tem nenhuma', async () => {
      (prisma.grelhaEuromilhoes.findFirst as any).mockResolvedValue(null);
      (prisma.grelhaEuromilhoes.findMany as any).mockResolvedValue([]);
      (prisma.grelhaEuromilhoes.create as any).mockResolvedValue({ id: 'grelha-nova', estado: 'aberta', numerosOcupados: '[]' });
      (prisma.grelhaEuromilhoes.findUnique as any).mockResolvedValue({ ...mockGrelha, id: 'grelha-nova' });
      const data = { numerosSelecionados: [1, 25] };
      await euromilhoesHandler.validate!(data, jogo);
      expect(data.grelhaId).toBe('grelha-nova');
      expect(prisma.grelhaEuromilhoes.create).toHaveBeenCalled();
    });

    it('deve rejeitar grelha inexistente', async () => {
      (prisma.grelhaEuromilhoes.findUnique as any).mockResolvedValue(null);
      const data = { grelhaId: 'inexistente', numerosSelecionados: [1] };
      await expect(euromilhoesHandler.validate!(data, jogo)).rejects.toThrow('Grelha não encontrada');
    });

    it('deve rejeitar grelha fechada', async () => {
      (prisma.grelhaEuromilhoes.findUnique as any).mockResolvedValue({
        ...mockGrelha,
        estado: 'fechada',
      });
      const data = { grelhaId: 'grelha-1', numerosSelecionados: [1] };
      await expect(euromilhoesHandler.validate!(data, jogo)).rejects.toThrow('não está disponível');
    });

    it('deve rejeitar grelha bloqueada temporalmente', async () => {
      (getOfficialTime as any).mockResolvedValue(new Date('2026-07-17T16:00:00Z'));
      const data = { grelhaId: 'grelha-1', numerosSelecionados: [1] };
      await expect(euromilhoesHandler.validate!(data, jogo)).rejects.toThrow('bloqueada');
    });

    it('deve rejeitar array de números vazio', async () => {
      const data = { grelhaId: 'grelha-1', numerosSelecionados: [] };
      await expect(euromilhoesHandler.validate!(data, jogo)).rejects.toThrow('Selecione entre 1');
    });

    it('deve rejeitar mais de 50 números', async () => {
      const data = { grelhaId: 'grelha-1', numerosSelecionados: Array.from({ length: 51 }, (_, i) => i + 1) };
      await expect(euromilhoesHandler.validate!(data, jogo)).rejects.toThrow('Selecione entre 1');
    });

    it('deve rejeitar números fora do range (0)', async () => {
      const data = { grelhaId: 'grelha-1', numerosSelecionados: [0, 1, 2] };
      await expect(euromilhoesHandler.validate!(data, jogo)).rejects.toThrow('devem estar entre 1 e 50');
    });

    it('deve rejeitar números fora do range (51)', async () => {
      const data = { grelhaId: 'grelha-1', numerosSelecionados: [1, 51] };
      await expect(euromilhoesHandler.validate!(data, jogo)).rejects.toThrow('devem estar entre 1 e 50');
    });

    it('deve rejeitar números duplicados', async () => {
      const data = { grelhaId: 'grelha-1', numerosSelecionados: [1, 25, 1] };
      await expect(euromilhoesHandler.validate!(data, jogo)).rejects.toThrow('duplicados');
    });
  });

  describe('prepareData', () => {
    it('deve retornar hashParticipacao, numerosSelecionados e grelhaId', () => {
      const data = { grelhaId: 'grelha-1', numerosSelecionados: [5, 10, 15] };
      const result = euromilhoesHandler.prepareData(data, jogo, []);

      expect(result).toHaveProperty('hashParticipacao');
      expect(result).toHaveProperty('dadosVerificacao');
      expect(result).toHaveProperty('numerosSelecionados');
      expect(result).toHaveProperty('grelhaId');
      expect(result.grelhaId).toBe('grelha-1');
      expect(result.numerosSelecionados).toBe(JSON.stringify([5, 10, 15]));
    });

    it('dadosVerificacao deve conter numeros', () => {
      const data = { grelhaId: 'grelha-1', numerosSelecionados: [1, 2, 3] };
      const result = euromilhoesHandler.prepareData(data, jogo, []);
      const verificacao = JSON.parse(result.dadosVerificacao as string);

      expect(verificacao.numeros).toEqual([1, 2, 3]);
      expect(verificacao).toHaveProperty('seed');
      expect(verificacao).toHaveProperty('uniqueSalt');
    });
  });
});
