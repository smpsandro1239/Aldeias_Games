import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { purgeOldData } from '@/lib/rgpd';

// RGPD: purga automática de dados anónimos e registos operacionais (cron)
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const result = await purgeOldData(prisma as any);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error purging old data:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET - permite verificação manual
export async function GET(request: NextRequest) {
  return POST(request);
}