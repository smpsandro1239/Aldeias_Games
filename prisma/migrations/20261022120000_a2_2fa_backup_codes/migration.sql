-- Ronda Segurança 2 (A2): backup codes single-use para 2FA.
-- Armazena apenas um array JSON de hashes SHA-256 — os códigos em claro
-- nunca são persistidos (mostrados ao utilizador uma única vez).
ALTER TABLE "two_factor_auths" ADD COLUMN "backupCodes" TEXT;
