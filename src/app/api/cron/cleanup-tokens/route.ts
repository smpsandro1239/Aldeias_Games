import { NextRequest, NextResponse } from 'next/server';
import { purgeExpiredRefreshTokens } from '@/lib/auth';

/**
 * T3 (Sprint 1 · A4) — Cron de limpeza de refresh tokens.
 *
 * Apaga refresh tokens expirados e revogados (ver src/lib/auth.ts →
 * purgeExpiredRefreshTokens). Executa-se diariamente às 02:00 UTC via
 * Vercel Cron (ver vercel.json), complementando a purga best-effort que
 * já corre a cada rotação de token.
 *
 * Autenticação: header `x-cron-secret` comparado com CRON_SECRET — mesmo
 * padrão dos cron jobs existentes (/api/rate-limits/cleanup, /api/rgpd/purga).
 */
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const deleted = await purgeExpiredRefreshTokens();
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('[CRON] Erro na limpeza de refresh tokens:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET - permite verificação manual (mesmo padrão dos outros crons do repo)
export async function GET(request: NextRequest) {
  return POST(request);
}
