import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { anonymizeParticipacoes } from '@/lib/rgpd';

// RGPD: anonimização automática de dados de clientes após 365 dias (cron)
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const result = await anonymizeParticipacoes(prisma as any);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error anonymizing participações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET - permite verificação manual
export async function GET(request: NextRequest) {
  return POST(request);
}