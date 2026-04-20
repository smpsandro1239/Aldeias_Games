import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aldeiaId = searchParams.get('aldeiaId');

    if (!aldeiaId) {
      return NextResponse.json({ error: 'AldeiaID requerido' }, { status: 400 });
    }

    // Buscar vendedores da aldeia
    const vendedores = await prisma.user.findMany({
      where: {
        aldeiaId,
        role: 'vendedor',
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
      },
      orderBy: { nome: 'asc' },
    });

    return NextResponse.json({ success: true, data: vendedores });
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}