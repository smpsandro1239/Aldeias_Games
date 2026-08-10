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

    const numeros = data.dadosParticipacao?.numeros || data.numerosSelecionados;
    if (!Array.isArray(numeros) || numeros.length < 1 || numeros.length > 50) {
      throw new Error('Selecione entre 1 a 50 números para o Euromilhões');
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
        throw new Error(`O número ${num} já foi selecionado nesta grelha`);
      }
    }
  },

  prepareData(data: any) {
    const numerosSelecionados = data.dadosParticipacao?.numeros || data.numerosSelecionados || [];
    const resultado = JSON.stringify(numerosSelecionados);
    const uniqueSalt = crypto.randomBytes(32).toString('hex');
    const seed = generateSeed();
    const timestamp = new Date().toISOString();
    const hash = generateHash(seed, resultado, uniqueSalt, timestamp);

    return {
      hashParticipacao: hash,
      dadosVerificacao: JSON.stringify({ seed, timestamp, numeros: numerosSelecionados, uniqueSalt, hash }),
      numerosSelecionados: resultado,
      grelhaId: data.grelhaId,
    };
  },

  async postCreate(tx, data, _jogo, _participacoes) {
    const numsRaw = data.dadosParticipacao?.numeros || data.numerosSelecionados;
    const nums: number[] = typeof numsRaw === 'string' ? JSON.parse(numsRaw) : (Array.isArray(numsRaw) ? numsRaw : []);
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
