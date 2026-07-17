import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requireAnyOfPermissions } from '@/lib/rbac/checkPermission';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requireAnyOfPermissions(user.id, ['EXECUTE_VENDA', 'MANAGE_ALDEIA']);
    if (denied) return denied;

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
