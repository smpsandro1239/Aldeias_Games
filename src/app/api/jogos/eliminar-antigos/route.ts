import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_USERS');
    if (denied) return denied;

    const body = await request.json();
    const { jogoIds } = body;

    if (!jogoIds || !Array.isArray(jogoIds) || jogoIds.length === 0) {
      return NextResponse.json({ error: 'IDs de jogos inválidos' }, { status: 400 });
    }

    // Apagar jogos com as suas participações e prémios relacionados
    const deleted = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Apagar participações primeiro
      await tx.participacao.deleteMany({
        where: { jogoId: { in: jogoIds } }
      });
      
      // Apagar prémios dos jogos
      await tx.premio.deleteMany({
        where: { jogoId: { in: jogoIds } }
      });
      
      // Apagar sorteios
      await tx.sorteio.deleteMany({
        where: { jogoId: { in: jogoIds } }
      });
      
      // Apagar apostas
      await tx.aposta.deleteMany({
        where: { jogoId: { in: jogoIds } }
      });

      // Apagar os jogos
      return await tx.jogo.deleteMany({
        where: { id: { in: jogoIds } }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: `${deleted.count} jogos eliminados`,
      deletedCount: deleted.count 
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro ao eliminar jogos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET - Listar jogos para eliminar (para o admin escolher)
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_USERS');
    if (denied) return denied;

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId');

    // Buscar todos os jogos que não são dos tipos definitivos
    const jogosAntigos = await any.findMany({
      where: aldeiaId ? { evento: { aldeiaId } } : undefined,
      include: {
        evento: {
          include: { aldeia: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filtrar apenas os jogos que não são dos tipos ativos
    const tiposDefinitivos = ['poio_da_vaca', 'rifa', 'raspadinha'];
    const jogosParaEliminar = jogosAntigos.filter((j: any) => !tiposDefinitivos.includes(j.tipo));

    return NextResponse.json({ data: jogosParaEliminar });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
