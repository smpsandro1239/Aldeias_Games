/**
 * Compara montantes monetários em euros ao cêntimo.
 * Rejeita valores não finitos, zero ou negativos para evitar créditos inválidos.
 */
export function amountMatches(expected: number, received: number): boolean {
  if (
    !Number.isFinite(expected) ||
    !Number.isFinite(received) ||
    expected <= 0 ||
    received <= 0
  ) {
    return false;
  }

  return Math.round(expected * 100) === Math.round(received * 100);
}
