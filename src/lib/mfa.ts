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

export const generateMFAQRCode = async (email: string, secret: string, issuer: string = 'Aldeias Games') => {
  const totp = new TOTP({ issuer });
  const otpauthUrl = totp.toURI({ label: email, secret });
  return await toDataURL(otpauthUrl);
};