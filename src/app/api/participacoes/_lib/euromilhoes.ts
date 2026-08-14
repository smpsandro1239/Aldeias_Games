import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { GameHandler, JogoWithEvento } from './types';
import { getOfficialTime, getNextFriday, getBloqueioData } from '@/lib/time';
import { prisma } from '@/lib/db';

function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateHash(seed: string, resultado: string, salt: string, timestamp?: string): string {
  const data = timestamp
    ? `${seed}:${resultado}:${salt}:${timestamp}`
    : `${seed}:${resultado}:${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function parseConfig(jogo: JogoWithEvento): Record<string, unknown> {
  if (typeof jogo.configuracao === 'string') {
    try {
      return JSON.parse(jogo.configuracao) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (jogo?.configuracao && typeof jogo.configuracao === 'object') {
    return jogo.configuracao as Record<string, unknown>;
  }
  return {};
}

function readNumeros(data: any): number[] {
  const raw = data.dadosParticipacao?.numeros ?? data.numerosSelecionados;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
}

export const euromilhoesHandler: GameHandler = {
  async validate(data: any, _jogo: JogoWithEvento) {
    if (!data.grelhaId && _jogo?.id) {
      const existente = await prisma.grelhaEuromilhoes.findFirst({
        where: { jogoId: _jogo.id, estado: 'aberta' },
        orderBy: { numero: 'asc' },
      });
      if (existente) {
        data.grelhaId = existente.id;
      } else {
        const [ultima] = await prisma.grelhaEuromilhoes.findMany({
          where: { jogoId: _jogo.id },
          orderBy: { numero: 'desc' },
          take: 1,
          select: { numero: true },
        });
        const horaOficial = await getOfficialTime();
        const sorteioData = getNextFriday(horaOficial);
        const nova = await prisma.grelhaEuromilhoes.create({
          data: {
            jogoId: _jogo.id,
            numero: (ultima?.numero ?? 0) + 1,
            estado: 'aberta',
            numerosOcupados: '[]',
            sorteioData,
            bloqueioData: getBloqueioData(sorteioData),
          },
        });
        data.grelhaId = nova.id;
      }
    }

    if (!data.grelhaId) {
      throw new Error('Grelha ID é obrigatório para Euromilhões');
    }

    const grelhaAtual = await prisma.grelhaEuromilhoes.findUnique({ where: { id: data.grelhaId } });
    if (!grelhaAtual) {
      throw new Error('Grelha não encontrada');
    }
    if (grelhaAtual.estado !== 'aberta') {
      throw new Error('Grelha não está disponível para participação');
    }
    if (grelhaAtual.bloqueioData && (await getOfficialTime()) >= grelhaAtual.bloqueioData) {
      throw new Error('Grelha bloqueada — o prazo de participação terminou');
    }

    const numeros = readNumeros(data);
    const config = parseConfig(_jogo);
    const maxNumeros =
      typeof config.maxNumeros === 'number' && config.maxNumeros > 0
        ? Math.min(config.maxNumeros, 50)
        : 50;

    if (!Array.isArray(numeros) || numeros.length < 1 || numeros.length > maxNumeros) {
      throw new Error(`Selecione entre 1 a ${maxNumeros} números para o Euromilhões`);
    }
    for (const num of numeros) {
      if (num < 1 || num > 50) {
        throw new Error('Números devem estar entre 1 e 50');
      }
    }
    if (new Set(numeros).size !== numeros.length) {
      throw new Error('Números duplicados na seleção');
    }

    const ocupados: number[] = JSON.parse(grelhaAtual.numerosOcupados || '[]');
    for (const num of numeros) {
      if (ocupados.includes(num)) {
        throw new Error(`O número ${num} já foi vendido nesta grelha`);
      }
    }
  },

  // Verificação atómica da grelha DENTRO da transação (após o lock de stock do
  // updateMany). Vendas concorrentes do mesmo número na mesma grelha não passam
  // (o erro contém "já foi vendido" para o route devolver 400).
  async validateInTransaction(
    tx: Prisma.TransactionClient,
    data: any,
    _jogo: JogoWithEvento
  ) {
    const numeros = readNumeros(data);
    if (numeros.length === 0 || !data.grelhaId) return;

    const grelha = await tx.grelhaEuromilhoes.findUnique({
      where: { id: data.grelhaId },
      select: { numerosOcupados: true },
    });
    if (!grelha) return;

    const ocupados: number[] = JSON.parse(grelha.numerosOcupados || '[]');
    for (const num of numeros) {
      if (ocupados.includes(num)) {
        throw new Error(`O número ${num} já foi vendido nesta grelha`);
      }
    }
  },

  // 1 participação = 1 número. O route chama prepareData uma vez por
  // participação; `existing.length` dá o índice do número desta participação.
  prepareData(data: any, _jogo: JogoWithEvento, existing: any[] = []) {
    const numerosSelecionados = readNumeros(data);
    const index = existing.length;
    const numero = numerosSelecionados[index];
    if (numero === undefined) {
      throw new Error('Número inválido na seleção');
    }

    const resultado = JSON.stringify([numero]);
    const uniqueSalt = crypto.randomBytes(32).toString('hex');
    const seed = generateSeed();
    const timestamp = new Date().toISOString();
    const hash = generateHash(seed, resultado, uniqueSalt, timestamp);

    return {
      hashParticipacao: hash,
      dadosParticipacao: JSON.stringify({ numero }),
      dadosVerificacao: JSON.stringify({ seed, timestamp, numero, uniqueSalt, hash }),
      numerosSelecionados: JSON.stringify([numero]),
      grelhaId: data.grelhaId,
    };
  },

  async postCreate(tx, data, _jogo, _participacoes) {
    const nums = readNumeros(data);
    if (data.grelhaId && nums.length > 0) {
      const grelha = await tx.grelhaEuromilhoes.findUnique({
        where: { id: data.grelhaId },
      });
      if (grelha) {
        const ocupados: number[] = JSON.parse(grelha.numerosOcupados);
        for (const num of nums) {
          if (!ocupados.includes(num)) {
            ocupados.push(num);
          }
        }
        ocupados.sort((a, b) => a - b);
        const updateData: Record<string, unknown> = { numerosOcupados: JSON.stringify(ocupados) };
        if (ocupados.length >= 50) {
          updateData.estado = 'preenchida';
          updateData.dataFecho = new Date();
        }
        await tx.grelhaEuromilhoes.update({
          where: { id: data.grelhaId },
          data: updateData as Prisma.GrelhaEuromilhoesUpdateInput,
        });
      }
    }
  },
};
