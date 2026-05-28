import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        saldo: true,
        transacoes: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    }) as any;

    const premios = await prisma.participacao.findMany({
      where: {
        userId: user.id,
        ganhador: true,
      },
      select: {
        id: true,
        valorPago: true,
        createdAt: true,
        jogo: {
          select: {
            nome: true,
            tipo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalPremios = premios.reduce((acc: number, p: any) => acc + p.valorPago, 0);

    return NextResponse.json({
      saldo: userData?.saldo || 0,
      transacoes: userData?.transacoes || [],
      historicoPremios: {
        total: totalPremios,
        quantidade: premios.length,
        premios: premios,
      },
    });
  } catch (error) {
    console.error('Erro na carteira:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
