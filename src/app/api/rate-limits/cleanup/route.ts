import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredRateLimits } from '@/lib/rate-limit';

// Cron: limpa entradas expiradas da tabela de rate limiting
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const deleted = await cleanupExpiredRateLimits();
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Error cleaning rate limits:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET - permite verificação manual
export async function GET(request: NextRequest) {
  return POST(request);
}
