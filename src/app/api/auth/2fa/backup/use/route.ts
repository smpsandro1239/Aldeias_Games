import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  generateToken,
  generateRefreshToken,
  setAuthCookie,
  setRefreshTokenCookie,
} from '@/lib/auth';
import { verifyBackupCode } from '@/lib/mfa';
import { handle2FAFailure } from '@/lib/lockout';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { logAccess } from '@/lib/auth';

/**
 * T1 (Sprint 1 · A2) — Consumo de backup code single-use como segundo fator.
 *
 * Fluxo: o utilizador já validou password noutro endpoint e está a aguardar
 * o segundo fator; envia email + backup code. Em caso de sucesso emite a
 * sessão normal (JWT 15min + refresh token rotativo, cookies httpOnly).
 * Em caso de falha, incrementa o lockout da conta (falhasLogin) — mesma
 * política das falhas de TOTP no login.
 */
const bodySchema = z.object({
  email: z.string().email().max(254),
  code: z.string().min(6).max(16),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    const { email, code } = parsed.data;

    // Rate limiting específico de 2FA (5 tentativas / 5 min por email)
    const rateLimit = await checkRateLimit(`2fa-backup:${email.toLowerCase()}`, rateLimitConfigs.twoFactor);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetTime);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, nome: true, role: true, aldeiaId: true, emailVerificado: true },
    });

    // Mensagem genérica: não revelar se o email existe nem se há backup codes.
    if (!user || !user.emailVerificado) {
      return NextResponse.json({ error: 'Backup code inválido ou já utilizado' }, { status: 401 });
    }

    const valid = await verifyBackupCode(user.id, code);
    if (!valid) {
      await handle2FAFailure(user.id);
      await logAccess(
        email,
        false,
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        request.headers.get('user-agent') || 'unknown',
        user.id,
        'Backup code 2FA inválido'
      );
      return NextResponse.json({ error: 'Backup code inválido ou já utilizado' }, { status: 401 });
    }

    // Sucesso: emitir sessão normal com rotação de refresh token.
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      aldeiaId: user.aldeiaId || undefined,
    });
    const refreshToken = await generateRefreshToken(user.id);

    const response = NextResponse.json({
      success: true,
      message: 'Autenticação concluída com backup code',
      user: { id: user.id, email: user.email, nome: user.nome, role: user.role, aldeiaId: user.aldeiaId },
    });
    setAuthCookie(response, token);
    setRefreshTokenCookie(response, refreshToken);
    return response;
  } catch (error) {
    console.error('[2FA] Erro no consumo de backup code:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
