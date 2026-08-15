export interface Coordenada {
  letra: string;
  numero: number;
}

export interface PoioConfigNormalized {
  letras: string[];
  numerosPorLetra: number;
  x: number;
  y: number;
}

// Config de poio normalizada: letras/numerosPorLetra/dimensoesCampo são
// gerados automaticamente quando ausentes (jogos legacy criados sem config).
// - letras: A..Z (recicladas além de 26 colunas: "A1", "B1", ...)
// - numerosPorLetra: y (linhas do campo)
export function normalizePoioConfig(
  config: Record<string, unknown> | null | undefined,
  dimensoesCampo?: string | null
): PoioConfigNormalized {
  const cfg = config || {};
  let x = 10;
  let y = 10;

  if (dimensoesCampo) {
    try {
      const dims = JSON.parse(dimensoesCampo);
      if (dims && typeof dims.x === 'number' && typeof dims.y === 'number') {
        x = dims.x;
        y = dims.y;
      }
    } catch { /* ignore */ }
  }

  const letrasConfig = Array.isArray(cfg.letras) ? cfg.letras : [];
  const letras =
    letrasConfig.length > 0
      ? letrasConfig.map(String)
      : generateLetras(x);

  const numerosPorLetra =
    typeof cfg.numerosPorLetra === 'number'
      ? cfg.numerosPorLetra
      : y;

  return { letras, numerosPorLetra, x, y };
}

export function generateLetras(x: number): string[] {
  const base = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const out: string[] = [];
  for (let i = 0; i < x; i++) {
    out.push(base[i % 26] + (i >= 26 ? Math.floor(i / 26) + 1 : ''));
  }
  return out;
}

// Aceita {letra, numero} (novo formato) ou {x, y} (legacy) e normaliza
// internamente para letra/numero. Devolve null se a coordenada for inválida.
export function normalizeCoordenada(c: any): Coordenada | null {
  if (!c || typeof c !== 'object') return null;

  if (typeof c.letra === 'string' && typeof c.numero === 'number') {
    return { letra: c.letra.toUpperCase(), numero: c.numero };
  }
  if (typeof c.x === 'number' && typeof c.y === 'number') {
    return { letra: String.fromCharCode(64 + c.x), numero: c.y };
  }
  return null;
}

export function coordenadaKey(c: Coordenada): string {
  return `${c.letra}-${c.numero}`;
}

// id 1-based do quadrado (como a página apresenta): col = (id-1) % x,
// linha = floor((id-1)/x); letra = letras[col], numero = linha + 1
export function squareIdToCoord(id: number, cfg: PoioConfigNormalized): Coordenada {
  const col = (id - 1) % cfg.x;
  const row = Math.floor((id - 1) / cfg.x);
  return { letra: cfg.letras[col] ?? String.fromCharCode(64 + col + 1), numero: row + 1 };
}

export function coordToSquareId(c: Coordenada, cfg: PoioConfigNormalized): number | null {
  const col = cfg.letras.indexOf(c.letra);
  if (col < 0 || c.numero < 1 || c.numero > cfg.numerosPorLetra) return null;
  return (c.numero - 1) * cfg.x + col + 1;
}
