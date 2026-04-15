import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const consentimentos = await prisma.consentimento.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: consentimentos,
    });
  } catch (error) {
    console.error('Erro ao listar consentimentos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, concedeu, ip, userAgent } = body;

    // Validar tipo de consentimento
    const tiposValidos = ['cookies', 'marketing', 'publicidade', 'analytics'];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de consentimento inválido' }, { status: 400 });
    }

    // Tentar obter utilizador (opcional para visitantes anonimos)
    const user = await getFullUserFromRequest(request);

    const consentimento = await prisma.consentimento.create({
      data: {
        tipo,
        concedeu,
        ip: ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: userAgent || request.headers.get('user-agent') || 'unknown',
        userId: user?.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: consentimento,
    });
  } catch (error) {
    console.error('Erro ao registar consentimento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
