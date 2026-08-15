import crypto from 'crypto';
import { GameHandler, JogoWithEvento, ParticipacaoRequestData } from './types';
import { prisma } from '@/lib/db';
import { normalizePoioConfig, normalizeCoordenada, coordenadaKey, Coordenada } from '@/lib/poio-utils';

function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateHash(seed: string, resultado: string, salt: string, timestamp?: string): string {
  const data = timestamp
    ? `${seed}:${resultado}:${salt}:${timestamp}`
    : `${seed}:${resultado}:${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Normaliza as coordenadas do pedido (aceita {letra, numero} E {x, y}) contra
// a config real do jogo: x é o índice da coluna (1-based) dentro de letras.
function normalizarCoordenadas(data: ParticipacaoRequestData, jogo: JogoWithEvento): Coordenada[] {
  const raw = data.dadosParticipacao?.coordenadas;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Coordenadas são obrigatórias para Poio da Vaca');
  }

  const cfg = normalizePoioConfig(
    typeof jogo.configuracao === 'string' ? JSON.parse(jogo.configuracao || '{}') : jogo.configuracao,
    jogo.dimensoesCampo
  );

  const out: Coordenada[] = [];
  const vistos = new Set<string>();

  for (const c of raw) {
    let coord: Coordenada | null = null;
    if (typeof c?.letra === 'string' && typeof c?.numero === 'number') {
      coord = { letra: String(c.letra).toUpperCase(), numero: c.numero };
    } else if (typeof c?.x === 'number' && typeof c?.y === 'number') {
      // Formato legacy {x, y}: x = coluna 1-based dentro de letras
      const col = Math.floor(c.x) - 1;
      if (col >= 0 && col < cfg.letras.length) {
        coord = { letra: cfg.letras[col], numero: Math.floor(c.y) };
      }
    }

    if (!coord) {
      throw new Error(`Coordenada inválida: ${JSON.stringify(c)}`);
    }

    const colIdx = cfg.letras.indexOf(coord.letra);
    if (colIdx < 0) {
      throw new Error(`A letra "${coord.letra}" não existe no campo (colunas: ${cfg.letras.join(', ')})`);
    }
    if (coord.numero < 1 || coord.numero > cfg.numerosPorLetra) {
      throw new Error(`A coordenada ${coord.letra}${coord.numero} está fora do campo (1-${cfg.numerosPorLetra})`);
    }

    const key = coordenadaKey(coord);
    if (vistos.has(key)) {
      throw new Error(`Coordenada duplicada: ${coord.letra}${coord.numero}`);
    }
    vistos.add(key);
    out.push(coord);
  }

  return out;
}

export const poioHandler: GameHandler = {
  async validate(data: ParticipacaoRequestData, jogo: JogoWithEvento) {
    const coordenadas = normalizarCoordenadas(data, jogo);

    const existing = await prisma.participacao.findMany({
      where: { jogoId: jogo.id },
      select: { dadosParticipacao: true },
    });

    const cfg = normalizePoioConfig(
      typeof jogo.configuracao === 'string' ? JSON.parse(jogo.configuracao || '{}') : jogo.configuracao,
      jogo.dimensoesCampo
    );

    const ocupadas = new Set<string>();
    for (const p of existing) {
      try {
        const dados = typeof p.dadosParticipacao === 'string'
          ? JSON.parse(p.dadosParticipacao)
          : p.dadosParticipacao;
        const coords = Array.isArray(dados?.coordenadas) ? dados.coordenadas : [];
        for (const c of coords) {
          const norm = normalizeCoordenada(c);
          if (!norm) continue;
          const colIdx = cfg.letras.indexOf(norm.letra);
          if (colIdx >= 0) ocupadas.add(coordenadaKey(norm));
        }
      } catch { /* ignore parse errors */ }
    }

    for (const c of coordenadas) {
      if (ocupadas.has(coordenadaKey(c))) {
        throw new Error(`A coordenada ${c.letra}${c.numero} já foi vendida`);
      }
    }
  },

  // Guard atómico DENTRO da transação (após o lock de stock): relê as
  // participações do jogo e rejeita coordenadas vendidas em venda concorrente.
  async validateInTransaction(
    tx: any,
    data: ParticipacaoRequestData,
    jogo: JogoWithEvento
  ) {
    const coordenadas = normalizarCoordenadas(data, jogo);
    if (coordenadas.length === 0) return;

    const cfg = normalizePoioConfig(
      typeof jogo.configuracao === 'string' ? JSON.parse(jogo.configuracao || '{}') : jogo.configuracao,
      jogo.dimensoesCampo
    );

    const existing = await tx.participacao.findMany({
      where: { jogoId: jogo.id },
      select: { dadosParticipacao: true },
    });

    const ocupadas = new Set<string>();
    for (const p of existing) {
      try {
        const dados = typeof p.dadosParticipacao === 'string'
          ? JSON.parse(p.dadosParticipacao)
          : p.dadosParticipacao;
        const coords = Array.isArray(dados?.coordenadas) ? dados.coordenadas : [];
        for (const c of coords) {
          const norm = normalizeCoordenada(c);
          if (!norm) continue;
          const colIdx = cfg.letras.indexOf(norm.letra);
          if (colIdx >= 0) ocupadas.add(coordenadaKey(norm));
        }
      } catch { /* ignore parse errors */ }
    }

    for (const c of coordenadas) {
      if (ocupadas.has(coordenadaKey(c))) {
        throw new Error(`A coordenada ${c.letra}${c.numero} já foi vendida`);
      }
    }
  },

  // 1 participação = 1 quadrado. O route chama prepareData uma vez por
  // participação; `existing.length` dá o índice da coordenada desta
  // participação. Cada uma fica com a SUA coordenada, hash e dadosVerificacao.
  prepareData(data: ParticipacaoRequestData, jogo: JogoWithEvento, existing: any[] = []) {
    const coordenadas = normalizarCoordenadas(data, jogo);
    const index = existing.length;
    const coord = coordenadas[index];
    if (!coord) {
      throw new Error('Coordenada inválida na seleção');
    }

    const resultado = JSON.stringify([coord]);
    const uniqueSalt = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();
    const seed = generateSeed();
    const hash = generateHash(seed, resultado, uniqueSalt, timestamp);

    return {
      hashParticipacao: hash,
      dadosParticipacao: JSON.stringify({ coordenadas: [coord] }),
      dadosVerificacao: JSON.stringify({ seed, timestamp, coordenadas: [coord], uniqueSalt, hash }),
    };
  },
};
