import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['vendedor', 'aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const cashbox = await prisma.vendedorCashbox.findUnique({
      where: { userId: user.id },
      include: {
        transacoes: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: cashbox || { saldo: 0, transacoes: [] }
    });
  } catch (error) {
    console.error('Error fetching cashbox:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
