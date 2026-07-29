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

export const poioHandler: GameHandler = {
  async validate(data: any, jogo: JogoWithEvento) {
    const coordenadas = data.dadosParticipacao?.coordenadas;
    if (!Array.isArray(coordenadas) || coordenadas.length === 0) {
      throw new Error('Coordenadas são obrigatórias para Poio da Vaca');
    }

    const existing = await any.findMany({
      where: { jogoId: jogo.id },
      select: { dadosParticipacao: true },
    });

    const ocupadas = new Set<string>();
    for (const p of existing) {
      try {
        const dados = typeof p.dadosParticipacao === 'string'
          ? JSON.parse(p.dadosParticipacao)
          : p.dadosParticipacao;
        if (Array.isArray(dados?.coordenadas)) {
          for (const c of dados.coordenadas) {
            ocupadas.add(`${c.x},${c.y}`);
          }
        }
      } catch { /* ignore parse errors */ }
    }

    for (const c of coordenadas) {
      const key = `${c.x},${c.y}`;
      if (ocupadas.has(key)) {
        throw new Error(`A coordenada (${c.x},${c.y}) já foi vendida`);
      }
    }
  },

  prepareData(data: any) {
    const coordenadas = data.dadosParticipacao?.coordenadas || [];
    const resultado = JSON.stringify(coordenadas);
    const uniqueSalt = crypto.randomBytes(32).toString('hex');
    const seed = generateSeed();
    const timestamp = new Date().toISOString();
    const hash = generateHash(seed, resultado, uniqueSalt, timestamp);

    return {
      hashParticipacao: hash,
      dadosVerificacao: JSON.stringify({ seed, timestamp, coordenadas, uniqueSalt, hash }),
    };
  },
};
