import crypto from 'crypto';

/**
 * Utilitários partilhados do fluxo provably-fair (commit + reveal).
 */

// Prefixo para distinguir o commit da client seed de outras hashes
const CLIENT_SEED_PREFIX = 'clientSeed:';

export function hashClientSeed(clientSeed: string): string {
  return crypto.createHash('sha256').update(`${CLIENT_SEED_PREFIX}${clientSeed}`).digest('hex');
}

export function computeFinalHash(serverSeed: string, clientSeed: string): string {
  return crypto.createHash('sha256').update(`${serverSeed}:${clientSeed}`).digest('hex');
}

export function isValidSha256Hash(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}

// Reduz um hash hex a um número inteiro entre 0 e max-1 (determinístico)
export function hashToIndex(hash: string, max: number): number {
  return Number(BigInt('0x' + hash.substring(0, 12)) % BigInt(max));
}