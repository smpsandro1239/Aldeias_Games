import { TOTP } from 'otplib';
import { NobleCryptoPlugin } from '@otplib/plugin-crypto-noble';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import crypto from 'crypto';
import { toDataURL } from 'qrcode';

// FIX (R1): otplib v13 exige plugins explícitos (crypto + base32). Sem eles,
// qualquer generate/verify lança CryptoPluginMissingError — ou seja, o 2FA
// rebentava em runtime. Instanciamos os plugins uma vez e reutilizamos.
const OTP_CRYPTO = new NobleCryptoPlugin();
const OTP_BASE32 = new ScureBase32Plugin();

/** Nova instância TOTP com os plugins configurados e tolerância temporal 0. */
function makeTOTP(secret?: string): TOTP {
  return new TOTP({
    ...(secret ? { secret } : {}),
    crypto: OTP_CRYPTO,
    base32: OTP_BASE32,
  });
}

/**
 * Gerar segredo base32 com >=20 bytes de entropia criptográfica.
 * FIX (R3a): API síncrona — generateSecretSync não existe no otplib v13;
 * usar crypto.randomBytes + base32 manual mantém a mesma garantia (>=16 bytes)
 * sem exigir await em todos os callers (setup 2FA).
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const generateMFASecret = () => {
  const bytes = crypto.randomBytes(20); // 160 bits > guardrail otplib v13 (>=16 bytes)
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
};

export const generateMFAOTP = async (secret: string) => {
  return await makeTOTP(secret).generate();
};

/**
 * FIX (segurança, A2): verificação TOTP com tolerância temporal mínima.
 * epochTolerance=0 aceita apenas a janela de 30s actual (antes o default do
 * otplib alargava a janela, ampliando a superfície de replay/brute-force).
 * A proteção anti-replay completa é assegurada por lastUsedToken (abaixo).
 * NOTA: async porque o TOTP do otplib v13 devolve uma Promise<VerifyResult>.
 */
export const verifyMFAOTP = async (token: string, secret: string): Promise<boolean> => {
  // FIX (R3a): usar makeTOTP — new TOTP({secret}) sem plugins lança CryptoPluginMissingError
  const totp = makeTOTP(secret);
  const result = await totp.verify(token, { epochTolerance: 0 });
  return result.valid === true;
};

/**
 * FIX (segurança): verificação de TOTP com proteção anti-replay.
 * O mesmo código de 6 dígitos é válido durante ~30s; sem esta proteção um
 * atacante que interceptasse um código (phishing em tempo real, screenshot)
 * poderia reutilizá-lo para iniciar sessão. Guardamos o último código aceite
 * no registo TwoFactorAuth.lastUsedToken e recusamos repetições.
 */
export async function verifyMFAOTPOnce(
  token: string,
  userId: string,
  prismaClient: typeof import('@/lib/db').default | unknown
): Promise<boolean> {
  const db = prismaClient as {
    twoFactorAuth: {
      findUnique: (args: { where: { userId: string } }) => Promise<{ secret: string; lastUsedToken?: string | null } | null>;
      update: (args: { where: { userId: string }; data: { lastUsedToken: string } }) => Promise<unknown>;
    };
  };

  const tfa = await db.twoFactorAuth.findUnique({ where: { userId } });
  if (!tfa) return false;

  // Rejeitar replay do mesmo código dentro da mesma janela temporal
  if (tfa.lastUsedToken === token) return false;

  const valid = await verifyMFAOTP(token, tfa.secret);
  if (!valid) return false;

  await db.twoFactorAuth.update({
    where: { userId },
    data: { lastUsedToken: token },
  });
  return true;
}

// ============================================
// A2 (Sprint 1) — Backup codes single-use
// ============================================
// 10 códigos aleatórios gerados com CSPRNG (crypto.randomBytes), mostrados
// ao utilizador UMA única vez. Na BD é guardado apenas um array JSON de
// hashes SHA-256 — os códigos em claro nunca são persistidos. Cada código
// só pode ser usado uma vez (o hash correspondente é removido da lista).

const BACKUP_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I/L

function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/** Gerar N backup codes legíveis (8 caracteres) com entropia criptográfica. */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code = '';
    const bytes = crypto.randomBytes(8);
    for (let j = 0; j < 8; j++) {
      code += BACKUP_CODE_ALPHABET[bytes[j] % BACKUP_CODE_ALPHABET.length];
    }
    codes.push(code);
  }
  return codes;
}

/**
 * Gerar + armazenar 10 backup codes para um utilizador 2FA.
 * Retorna os códigos EM CLARO apenas nesta chamada (para mostrar ao user).
 */
export async function setupBackupCodes(userId: string): Promise<string[]> {
  const codes = generateBackupCodes(10);
  const hashes = codes.map(hashBackupCode);
  await prismaUpdateBackupCodes(userId, JSON.stringify(hashes));
  return codes;
}

async function prismaUpdateBackupCodes(userId: string, backupCodes: string | null): Promise<void> {
  const { default: prisma } = await import('./db');
  // FIX (R1): upsert em vez de update — setupBackupCodes não deve falhar
  // se ainda não existir registo TwoFactorAuth para o utilizador.
  await prisma.twoFactorAuth.upsert({
    where: { userId },
    update: { backupCodes },
    create: { userId, secret: '', enabled: false, backupCodes },
  });
}

/**
 * Verificar um backup code (single-use). Em caso de sucesso o código é
 * removido da lista de hashes — não pode ser reutilizado.
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const { default: prisma } = await import('./db');
  const tfa = await prisma.twoFactorAuth.findUnique({ where: { userId } });
  if (!tfa || !tfa.enabled || !tfa.backupCodes) return false;

  let hashes: string[];
  try {
    hashes = JSON.parse(tfa.backupCodes);
  } catch {
    return false;
  }
  if (!Array.isArray(hashes) || hashes.length === 0) return false;

  const candidate = hashBackupCode(code.trim().toUpperCase());
  const idx = hashes.indexOf(candidate);
  if (idx === -1) return false;

  // Consumir: remover o hash (single-use)
  hashes.splice(idx, 1);
  await prismaUpdateBackupCodes(userId, JSON.stringify(hashes));
  return true;
}

export const generateMFAQRCode = async (email: string, secret: string, issuer: string = 'Aldeias Games') => {
  // FIX (R3a): instância com plugins (toURI não usa crypto, mas mantém consistência)
  const totp = makeTOTP();
  const otpauthUrl = totp.toURI({ label: email, secret });
  return await toDataURL(otpauthUrl);
};
