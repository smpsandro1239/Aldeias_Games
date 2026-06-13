import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

/**
 * Gera um segredo aleatório para MFA
 */
export const generateMFASecret = () => {
  return authenticator.generateSecret();
};

/**
 * Verifica se um token TOTP é válido para um segredo
 */
export const verifyMFAOTP = (token: string, secret: string) => {
  return authenticator.verify({ token, secret });
};

/**
 * Gera um QR Code para configurar na app do utilizador
 */
export const generateMFAQRCode = async (email: string, secret: string, issuer: string = 'Aldeia Viva') => {
  const otpauthUrl = authenticator.keyuri(email, issuer, secret);
  return await toDataURL(otpauthUrl);
};
