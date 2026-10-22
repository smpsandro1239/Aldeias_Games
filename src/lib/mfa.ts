import { TOTP } from 'otplib';
import { toDataURL } from 'qrcode';

export const generateMFASecret = () => {
  return new TOTP().generateSecret();
};

export const generateMFAOTP = (secret: string) => {
  const totp = new TOTP({ secret });
  return totp.generate();
};

export const verifyMFAOTP = (token: string, secret: string) => {
  const totp = new TOTP({ secret });
  return totp.verify(token, { secret });
};

/**
 * FIX (segurança): verificação de TOTP com proteção anti-replay.
 * O mesmo código de 6 dígitos é válido durante ~30s (até 60-90s com window);
 * sem esta proteção um atacante que interceptasse um código (phishing em
 * tempo real, screenshot, etc.) poderia reutilizá-lo para iniciar sessão.
 * Guardamos o último código aceite no registo TwoFactorAuth.lastUsedToken
 * e recusamos repetições do mesmo código.
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

  const valid = verifyMFAOTP(token, tfa.secret);
  if (!valid) return false;

  await db.twoFactorAuth.update({
    where: { userId },
    data: { lastUsedToken: token },
  });
  return true;
}

export const generateMFAQRCode = async (email: string, secret: string, issuer: string = 'Aldeias Games') => {
  const totp = new TOTP({ issuer });
  const otpauthUrl = totp.toURI({ label: email, secret });
  return await toDataURL(otpauthUrl);
};
