/**
 * T1 (Sprint 1 · A2) — Lockout partilhado para falhas de 2FA.
 *
 * Antes, apenas a password incorreta incrementava `falhasLogin`; as falhas
 * de código TOTP / backup code não contavam para o lockout, permitindo
 * brute-force ilimitado do segundo fator. Este módulo unifica o registo de
 * falhas usado pelo login (route.ts) e pelo endpoint de backup codes.
 */
import prisma from './db';

export const MAX_FAILED_ATTEMPTS = Number(process.env.MAX_FAILED_ATTEMPTS ?? 5);
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Regista uma falha de autenticação de segundo fator para um utilizador.
 * Incrementa `falhasLogin` e marca `ultimaFalhaLogin`; ao atingir o limite,
 * o login passa a ser bloqueado durante LOCKOUT_DURATION_MS (lógica já
 * existente em src/app/api/auth/login/route.ts, que lê estes campos).
 */
export async function handle2FAFailure(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        falhasLogin: { increment: 1 },
        ultimaFalhaLogin: new Date(),
      },
    });
  } catch (error) {
    // Nunca deixar o fluxo de auth falhar por um erro de bookkeeping.
    console.error('[LOCKOUT] Falha ao registar falha 2FA:', error);
  }
}
