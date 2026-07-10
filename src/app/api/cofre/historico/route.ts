import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId') || user.aldeiaId;

    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 400 });
    }

    const vault = await prisma.vault.findUnique({
      where: { aldeiaId },
      include: {
        transacoes: {
          include: {
            criadoPor: { select: { id: true, nome: true, email: true } },
            aprovadoPor: { select: { id: true, nome: true } },
          },
          orderBy: { dataCriacao: 'desc' },
          take: 200,
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: vault || { saldo: 0, transacoes: [] }
    });
  } catch (error) {
    console.error('Error fetching vault history:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
