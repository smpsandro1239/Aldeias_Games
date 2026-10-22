import { NextRequest, NextResponse } from 'next/server';
import { ensureSeeded, getSeedStatus } from '@/lib/db-init';
import { getFullUserFromRequest } from '@/lib/auth';

/**
 * VULNERABILIDADE CORRIGIDA (C1 · RONDA SEGURANÇA 1 — CRÍTICA):
 * A rota /api/seed estava totalmente desprotegida — qualquer pessoa não
 * autenticada podia disparar POST /api/seed e criar utilizadores super_admin
 * com credenciais conhecidas (admin@aldeias.pt).
 *
 * Correção (defesa em profundidade):
 *  1. BLOQUEIO ABSOLUTO em produção — nenhuma flag de override. Em prod, o
 *     seed é feito via `prisma db seed` / pipeline controlado, nunca por HTTP.
 *  2. Sem autenticação → 401 Unauthorized.
 *  3. Autenticado mas não super_admin → 403 Forbidden.
 *  4. Token de bootstrap (SEED_TOKEN, comparação em tempo constante) apenas
 *     fora de produção, para permitir o primeiro seed com a BD vazia.
 *  5. src/proxy.ts exige super_admin em adminOnlyRoutes (camada adicional).
 *  6. SeedInitializer removido do layout (auto-seed anónimo eliminado).
 */
async function guard(request: NextRequest): Promise<NextResponse | null> {
  // 1. Bloqueio absoluto em produção (sem override por design)
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed desativado em produção' },
      { status: 403 }
    );
  }

  // 2. Exigir autenticação
  const user = await getFullUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // 3. Exigir role super_admin
  if (user.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Apenas super_admin pode executar seed' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Guard específico do GET de estado: também bloqueado em produção e exige
 * autenticação; permite o token de bootstrap fora de produção para que o
 * primeiro arranque possa verificar o estado da BD antes de existir admin.
 */
async function guardStatus(request: NextRequest): Promise<NextResponse | null> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed desativado em produção' },
      { status: 403 }
    );
  }

  const user = await getFullUserFromRequest(request);
  if (user?.role === 'super_admin') return null;

  // Fallback de bootstrap (apenas fora de produção): segredo forte via env,
  // comparação em tempo constante.
  const seedToken = process.env.SEED_TOKEN;
  if (seedToken) {
    const provided = request.headers.get('x-seed-token') || '';
    const { timingSafeEqual, createHash } = await import('crypto');
    const a = createHash('sha256').update(String(provided)).digest();
    const b = createHash('sha256').update(String(seedToken)).digest();
    if (provided.length > 0 && timingSafeEqual(a, b)) return null;
  }

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  return NextResponse.json(
    { error: 'Apenas super_admin pode consultar o estado do seed' },
    { status: 403 }
  );
}

export async function GET(request: NextRequest) {
  const denied = await guardStatus(request);
  if (denied) return denied;
  try {
    const status = await getSeedStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ seeded: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const result = await ensureSeeded();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ seeded: false, error: String(error) }, { status: 500 });
  }
}
