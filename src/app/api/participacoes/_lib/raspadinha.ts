import crypto from 'crypto';
import { GameHandler, JogoWithEvento, ParticipacaoRequestData } from './types';
// @ts-ignore - @prisma/client types generated at build time
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

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

    const config = parseConfig(jogo);
    const maxGanhadores =
      typeof config.maxGanhadores === 'number' && config.maxGanhadores > 0
        ? config.maxGanhadores
        : null;

    if (maxGanhadores !== null) {
      const ganhadoresCount = await prisma.participacao.count({
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
      const winningParticipacoes = await prisma.participacao.findMany({
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
  },

  prepareData(data: ParticipacaoRequestData, jogo: JogoWithEvento) {
    const config: RaspadinhaConfig = typeof jogo.configuracao === 'string'
      ? JSON.parse(jogo.configuracao)
      : jogo.configuracao as RaspadinhaConfig;
    const forceLoss = (data as Record<string, unknown>)._limiteAtingido === true;
    const outcome = determineRaspadinhaOutcome(config, forceLoss);
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
