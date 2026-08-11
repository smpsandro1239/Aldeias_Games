import crypto from 'crypto';
import { GameHandler, JogoWithEvento, ParticipacaoRequestData } from './types';
// @ts-ignore - @prisma/client types generated at build time
import { Prisma } from '@prisma/client';

interface RaspadinhaPremio {
  nome: string;
  valor?: number;
  percentagem?: number;
  valorDinheiroAlternative?: number;
}

interface RaspadinhaConfig {
  premios: RaspadinhaPremio[];
  [key: string]: unknown;
}

interface RaspadinhaOutcome {
  hasWin: boolean;
  winningPrize: RaspadinhaPremio | null;
  roll: number;
}

export function determineRaspadinhaOutcome(config: RaspadinhaConfig, forceLoss = false): RaspadinhaOutcome {
  const premios = config.premios || [];
  const rollInt = crypto.randomInt(0, 10000);
  const roll = rollInt / 10000;

  if (forceLoss) {
    return { hasWin: false, winningPrize: null, roll };
  }

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

// Pool de prémios — sorteio sem reposição.
// O pool contém exatamente round(stock * percentagem / 100) cópias de cada
// prémio, preenchido com "Sem prémio" até perfazer o stock, e é baralhado
// com Fisher-Yates criptográfico. Garante que saem exatamente os prémios
// configurados (nem mais, nem menos), em posições aleatórias.
export function buildRaspadinhaPool(premios: RaspadinhaPremio[], stock: number): string[] {
  const pool: string[] = [];
  for (const premio of premios) {
    const qtd = Math.max(0, Math.round((premio.percentagem || 0) * stock / 100));
    for (let i = 0; i < qtd; i++) {
      pool.push(premio.nome);
    }
  }
  if (pool.length > stock) {
    pool.length = stock;
  }
  while (pool.length < stock) {
    pool.push('Sem prémio');
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// Consome um item aleatório do pool (sem reposição). "Sem prémio" → perde;
// nome de prémio → ganha o prémio correspondente da lista configurada.
export function drawFromPool(pool: string[], premios: RaspadinhaPremio[]): RaspadinhaOutcome {
  if (!Array.isArray(pool) || pool.length === 0) {
    return { hasWin: false, winningPrize: null, roll: 0 };
  }
  const len = pool.length;
  const idx = crypto.randomInt(0, len);
  const [item] = pool.splice(idx, 1);
  const winningPrize = premios.find((p) => p.nome === item) || null;
  return {
    hasWin: winningPrize !== null,
    winningPrize,
    roll: len > 0 ? idx / len : 0,
  };
}

export function buildGridFromOutcome(outcome: RaspadinhaOutcome, config: RaspadinhaConfig): RaspadinhaPremio[] {
  const premios = config.premios || [];
  const grid: RaspadinhaPremio[] = [];

  if (premios.length === 0) {
    return Array.from({ length: 9 }, () => ({ nome: 'Sem prémio', valorDinheiroAlternative: 0 }));
  }

  if (outcome.hasWin && outcome.winningPrize) {
    const winningPrize = outcome.winningPrize;
    for (let i = 0; i < 3; i++) grid.push({ ...winningPrize });

    const otherPrizes = premios.filter((p) => p.nome !== winningPrize.nome);
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
        grid.push({ nome: 'Sem prémio', valorDinheiroAlternative: 0 });
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

function parseConfig(jogo: JogoWithEvento): RaspadinhaConfig {
  return typeof jogo.configuracao === 'string'
    ? JSON.parse(jogo.configuracao)
    : (jogo.configuracao as RaspadinhaConfig);
}

function getConfiguredPremios(jogo: JogoWithEvento) {
  const config = parseConfig(jogo);
  return config.premios || [];
}

export const raspadinhaHandler: GameHandler = {
  async validate(data: ParticipacaoRequestData, jogo: JogoWithEvento) {
    const premios = getConfiguredPremios(jogo);

    if (premios.length === 0) {
      throw new Error('Raspadinha sem prémios configurados');
    }

    const totalPercentagem = premios.reduce(
      (sum, p) => sum + (p.percentagem || 0),
      0
    );
    if (totalPercentagem > 100) {
      throw new Error(
        `Soma das percentagens (${totalPercentagem}%) excede 100%`
      );
    }

    if (jogo.stockAtual < (data.quantidade || 1)) {
      throw new Error('Stock insuficiente');
    }
  },

  async validateInTransaction(
    tx: Prisma.TransactionClient,
    data: ParticipacaoRequestData,
    jogo: JogoWithEvento
  ) {
    const config = parseConfig(jogo);
    const maxGanhadores =
      typeof config.maxGanhadores === 'number' && config.maxGanhadores > 0
        ? config.maxGanhadores
        : null;

    if (maxGanhadores !== null) {
      const ganhadoresCount = await tx.participacao.count({
        where: {
          jogoId: jogo.id,
          ganhador: true,
          resultadoRaspe: { not: 'sem_premio' },
        },
      });
      if (ganhadoresCount >= maxGanhadores) {
        (data as Record<string, unknown>)._limiteAtingido = true;
      }
    }

    const maxPremioTotal =
      typeof config.maxPremioTotal === 'number' && config.maxPremioTotal > 0
        ? config.maxPremioTotal
        : null;

    if (maxPremioTotal !== null && !(data as Record<string, unknown>)._limiteAtingido) {
      const winningParticipacoes = await tx.participacao.findMany({
        where: {
          jogoId: jogo.id,
          ganhador: true,
          resultadoRaspe: { not: 'sem_premio' },
        },
        select: { dadosParticipacao: true },
      });

      let totalPremiosDistribuidos = 0;
      for (const p of winningParticipacoes) {
        try {
          const dados = JSON.parse(p.dadosParticipacao);
          const prizeValue = dados.winningPrize?.valorDinheiroAlternative || 0;
          totalPremiosDistribuidos += prizeValue;
        } catch {}
      }

      if (totalPremiosDistribuidos >= maxPremioTotal) {
        (data as Record<string, unknown>)._limiteAtingido = true;
      }
    }

    // Sorteio sem reposição: consome itens do pool de prémios configurado na
    // criação do jogo. A leitura é feita DENTRO da transação (a linha do jogo
    // está locked pelo updateMany de stock), garantindo atomicidade.
    const fresh = await tx.jogo.findUnique({
      where: { id: jogo.id },
      select: { configuracao: true },
    });
    const freshConfig = fresh
      ? (typeof fresh.configuracao === 'string' ? JSON.parse(fresh.configuracao) : fresh.configuracao) as RaspadinhaConfig
      : config;
    const pool = Array.isArray(freshConfig.pool) ? [...(freshConfig.pool as string[])] : null;

    if (pool) {
      const results: RaspadinhaOutcome[] = [];
      const qtd = data.quantidade || 1;
      const limiteAtingido = (data as Record<string, unknown>)._limiteAtingido === true;
      for (let i = 0; i < qtd; i++) {
        if (limiteAtingido) {
          // Limite de ganhadores/pool atingido — perde sem consumir o pool.
          results.push({ hasWin: false, winningPrize: null, roll: 0 });
        } else {
          results.push(drawFromPool(pool, freshConfig.premios || []));
        }
      }
      (data as Record<string, unknown>)._poolResults = results;
      await tx.jogo.update({
        where: { id: jogo.id },
        data: { configuracao: JSON.stringify({ ...freshConfig, pool }) },
      });
    }
  },

  prepareData(data: ParticipacaoRequestData, jogo: JogoWithEvento, existing: any[] = []) {
    const config: RaspadinhaConfig = typeof jogo.configuracao === 'string'
      ? JSON.parse(jogo.configuracao)
      : jogo.configuracao as RaspadinhaConfig;
    const forceLoss = (data as Record<string, unknown>)._limiteAtingido === true;

    let outcome: RaspadinhaOutcome;
    const poolResults = (data as Record<string, unknown>)._poolResults as RaspadinhaOutcome[] | undefined;
    if (Array.isArray(poolResults) && poolResults.length > 0) {
      // Jogos com pool: cada bilhete usa o resultado já sorteado na transação.
      outcome = poolResults[existing.length] || determineRaspadinhaOutcome(config, forceLoss);
    } else {
      // Jogos antigos sem pool: fallback estatístico (probabilidade independente).
      outcome = determineRaspadinhaOutcome(config, forceLoss);
    }

    const grid = buildGridFromOutcome(outcome, config);
    const rngSeed = crypto.randomBytes(32).toString('hex');
    const uniqueSalt = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();

    const resultadoStr = outcome.hasWin ? (outcome.winningPrize?.nome || 'sem_premio') : 'sem_premio';
    const hash = generateHash(rngSeed, resultadoStr, uniqueSalt, timestamp);

    return {
      seedRaspe: rngSeed,
      hashRaspe: hash,
      resultadoRaspe: resultadoStr,
      dadosParticipacao: JSON.stringify({
        grid,
        winningPrize: outcome.hasWin ? outcome.winningPrize : null,
        hasWin: outcome.hasWin,
        generatedAt: timestamp,
        rngSeed,
        uniqueSalt,
        roll: outcome.roll,
      }),
    };
  },

  async postCreate(
    tx: Prisma.TransactionClient,
    _data: ParticipacaoRequestData,
    jogo: JogoWithEvento,
    participacoes: any[]
  ) {
    const participacao = participacoes[0];
    if (!participacao || !participacao.ganhador) return;

    const config = parseConfig(jogo);
    const maxGanhadores =
      typeof config.maxGanhadores === 'number' && config.maxGanhadores > 0
        ? config.maxGanhadores
        : null;
    if (maxGanhadores === null) return;

    const ganhadoresCount = await tx.participacao.count({
      where: {
        jogoId: jogo.id,
        ganhador: true,
        resultadoRaspe: { not: 'sem_premio' },
      },
    });

    if (ganhadoresCount >= maxGanhadores) {
      let vendedorNome: string | null = null;
      if (participacao.vendedorId) {
        const vendedor = await tx.user.findUnique({
          where: { id: participacao.vendedorId },
          select: { nome: true },
        });
        vendedorNome = vendedor?.nome ?? null;
      }

      const nomeCliente = participacao.nomeCliente || 'Anónimo';
      const resultado = participacao.resultadoRaspe || 'desconhecido';

      const premiosConfig = config.premios || [];
      const premioConfig = premiosConfig.find((p) => p.nome === resultado);
      const valorPremio = premioConfig?.valorDinheiroAlternative ?? 0;

      const admins = await tx.user.findMany({
        where: { aldeiaId: jogo.evento.aldeiaId, role: 'aldeia_admin' },
        select: { id: true },
      });

      const vendedorIds = new Set<string>();
      if (participacao.vendedorId) {
        vendedorIds.add(participacao.vendedorId);
      }

      const notificacaoData = [
        ...admins.map((admin: { id: string }) => ({
          userId: admin.id,
          tipo: 'sistema' as const,
          titulo: 'Limite de ganhadores atingido',
          mensagem: `O jogo "${jogo.nome}" atingiu o limite de ${maxGanhadores} ganhadores. ` +
            `Último ganhador: ${nomeCliente}` +
            `${vendedorNome ? ` (vendido por ${vendedorNome})` : ''} — ` +
            `Prémio: ${resultado} (${valorPremio}€). ` +
            `O jogo continua aberto para vendas (sem prémios).`,
          lida: false,
        })),
      ];

      for (const vid of vendedorIds) {
        notificacaoData.push({
          userId: vid,
          tipo: 'sistema' as const,
          titulo: 'Limite de ganhadores atingido',
          mensagem: `O jogo "${jogo.nome}" atingiu o limite de ${maxGanhadores} ganhadores. ` +
            `A partir de agora, todas as participações serão sem prémio. ` +
            `O jogo continua aberto para vendas.`,
          lida: false,
        });
      }

      await tx.notificacao.createMany({ data: notificacaoData });
    }
  },
};
