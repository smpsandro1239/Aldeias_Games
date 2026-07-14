import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [totalAldeias, totalUtilizadores, totalAngariado] = await Promise.all([
      prisma.aldeia.count(),
      prisma.user.count(),
      prisma.participacao.aggregate({ _sum: { valorPago: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        aldeias: totalAldeias,
        utilizadores: totalUtilizadores,
        angariado: totalAngariado._sum.valorPago || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao obter estatísticas' },
      { status: 500 }
    );
  }
}
