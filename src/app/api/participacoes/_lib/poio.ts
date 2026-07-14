import crypto from 'crypto';
import { GameHandler, JogoWithEvento } from './types';

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
