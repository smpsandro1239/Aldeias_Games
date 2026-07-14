import crypto from 'crypto';
import { GameHandler, JogoWithEvento } from './types';

interface RaspadinhaOutcome {
  hasWin: boolean;
  winningPrize: any | null;
  roll: number;
}

function determineRaspadinhaOutcome(config: Record<string, any>): RaspadinhaOutcome {
  const premios = (config.premios as any[]) || [];
  const rollInt = crypto.randomInt(0, 10000);
  const roll = rollInt / 10000;

  let cumulativeBp = 0;
  for (const premio of premios) {
    const probBp = Math.round((premio.percentagem || 0) * 100);
    cumulativeBp += probBp;
    if (rollInt < cumulativeBp) {
      return { hasWin: true, winningPrize: premio, roll };
    }
  }

  return { hasWin: false, winningPrize: null, roll };
}

function buildGridFromOutcome(outcome: RaspadinhaOutcome, config: Record<string, any>): any[] {
  const premios = (config.premios as any[]) || [];
  const grid: any[] = [];

  if (premios.length === 0) {
    return Array.from({ length: 9 }, () => ({ nome: 'Sem prémio', valorDinheiroAlternative: 0 }));
  }

  if (outcome.hasWin && outcome.winningPrize) {
    const winningPrize = outcome.winningPrize;
    for (let i = 0; i < 3; i++) grid.push({ ...winningPrize });

    const otherPrizes = premios.filter((p: any) => p.nome !== winningPrize.nome);
    const fillerPool = otherPrizes.length > 0 ? otherPrizes : premios;

    for (let i = 0; i < 6; i++) {
      const pick = fillerPool[crypto.randomInt(0, fillerPool.length)];
      grid.push({ ...pick });
    }

    const counts = new Map<string, number>();
    grid.forEach((p) => counts.set(p.nome, (counts.get(p.nome) || 0) + 1));

    for (const [nome, count] of counts) {
      if (nome !== winningPrize.nome && count >= 3) {
        const idx = grid.findIndex((p) => p.nome === nome);
        if (idx !== -1) {
          grid[idx] = { ...fillerPool[crypto.randomInt(0, fillerPool.length)] };
        }
      }
    }
  } else {
    const maxPerPrize = 2;
    const counts = new Map<string, number>();

    for (let i = 0; i < 9; i++) {
      let attempts = 0;
      while (attempts < 50) {
        const pick = premios[crypto.randomInt(0, premios.length)];
        const currentCount = counts.get(pick.nome) || 0;
        if (currentCount < maxPerPrize) {
          grid.push({ ...pick });
          counts.set(pick.nome, currentCount + 1);
          break;
        }
        attempts++;
      }
      if (i >= grid.length) {
        const sorted = [...premios].sort((a, b) =>
          (a.valorDinheiroAlternative || 0) - (b.valorDinheiroAlternative || 0)
        );
        grid.push({ ...sorted[0] });
      }
    }
  }

  for (let i = grid.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }

  return grid;
}

function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateHash(seed: string, resultado: string, salt: string, timestamp?: string): string {
  const data = timestamp
    ? `${seed}:${resultado}:${salt}:${timestamp}`
    : `${seed}:${resultado}:${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export const raspadinhaHandler: GameHandler = {
  prepareData(data: any, jogo: JogoWithEvento) {
    const config = typeof jogo.configuracao === 'string'
      ? JSON.parse(jogo.configuracao)
      : jogo.configuracao;
    const outcome = determineRaspadinhaOutcome(config);
    const grid = buildGridFromOutcome(outcome, config);
    const rngSeed = crypto.randomBytes(32).toString('hex');
    const uniqueSalt = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();

    const hash = generateHash(rngSeed, outcome.hasWin ? (outcome.winningPrize?.nome || 'no_win') : 'no_win', uniqueSalt, timestamp);

    return {
      seedRaspe: rngSeed,
      hashRaspe: hash,
      resultadoRaspe: outcome.hasWin ? outcome.winningPrize?.nome : 'sem_premio',
      dadosParticipacao: JSON.stringify({
        grid,
        winningPrize: outcome.hasWin ? outcome.winningPrize : null,
        hasWin: outcome.hasWin,
        generatedAt: new Date().toISOString(),
        rngSeed,
        uniqueSalt,
        roll: outcome.roll,
      }),
    };
  },
};
