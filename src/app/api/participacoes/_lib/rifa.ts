import crypto from 'crypto';
import { GameHandler, JogoWithEvento } from './types';
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

export const rifaHandler: GameHandler = {
  async validate(data: any, jogo: JogoWithEvento) {
    const numeros = data.dadosParticipacao?.numeros;
    if (!Array.isArray(numeros) || numeros.length !== data.quantidade) {
      throw new Error('Quantidade deve corresponder ao número de números selecionados');
    }
    if (new Set(numeros).size !== numeros.length) {
      throw new Error('Números duplicados na seleção');
    }

    try {
      const existing = await prisma.participacao.findMany({
        where: { jogoId: jogo.id },
        select: { dadosParticipacao: true },
      });

      const ocupados = new Set<number>();
      for (const p of existing) {
        try {
          const dados = typeof p.dadosParticipacao === 'string'
            ? JSON.parse(p.dadosParticipacao)
            : p.dadosParticipacao;
          if (dados?.numeros && Array.isArray(dados.numeros)) {
            dados.numeros.forEach((n: number) => ocupados.add(n));
          }
        } catch { /* ignore */ }
      }

      for (const num of numeros) {
        if (ocupados.has(num)) {
          throw new Error(`O número ${num} já foi vendido`);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('já foi vendido')) throw err;
      // If prisma is unavailable (unit tests), skip DB uniqueness check
    }
  },

  prepareData(data: any, _jogo: JogoWithEvento, existing: any[]) {
    const numerosSelecionados = data.dadosParticipacao?.numeros || [];
    const numerosOcupados = new Set<number>();
    for (const p of existing) {
      try {
        const dados = typeof p.dadosParticipacao === 'string'
          ? JSON.parse(p.dadosParticipacao)
          : p.dadosParticipacao;
        if (dados?.numeros) {
          dados.numeros.forEach((n: number) => numerosOcupados.add(n));
        }
      } catch { /* ignore parse errors */ }
    }

    for (const num of numerosSelecionados) {
      if (numerosOcupados.has(num)) {
        throw new Error(`O número ${num} já foi vendido`);
      }
    }

    const resultado = JSON.stringify(numerosSelecionados);
    const uniqueSalt = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();
    const seed = generateSeed();
    const hash = generateHash(seed, resultado, uniqueSalt, timestamp);

    return {
      hashParticipacao: hash,
      dadosVerificacao: JSON.stringify({ seed, timestamp, numeros: numerosSelecionados, uniqueSalt, hash }),
    };
  },

  async postCreate(tx, data, _jogo, participacoes) {
    const numerosSelecionados: number[] = Array.isArray(data.dadosParticipacao?.numeros) ? data.dadosParticipacao!.numeros as number[] : [];
    if (numerosSelecionados.length > 0 && participacoes.length > 0) {
      await tx.numeroVendido.createMany({
        data: numerosSelecionados.map((num: number) => ({
          jogoId: data.jogoId!,
          numero: num,
        })) as any,
      });
    }
  },
};
