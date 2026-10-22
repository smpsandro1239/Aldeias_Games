-- Ronda Segurança 1 (C1): suporte anti-replay TOTP em TwoFactorAuth
-- Guarda o último código aceite para rejeitar replay na mesma janela de 30s.
ALTER TABLE "two_factor_auths" ADD COLUMN "lastUsedToken" TEXT;
