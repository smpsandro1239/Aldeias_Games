import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const aldeias = await prisma.aldeia.findMany({
      where: { ativo: true },
      include: {
        vault: {
          include: {
            transacoes: {
              orderBy: { dataCriacao: 'desc' },
              take: 50,
            }
          }
        },
        _count: {
          select: { users: { where: { role: 'vendedor' } } }
        }
      }
    });

    const pendentes = await prisma.pedidoDepositoCofre.findMany({
      where: { estado: 'pendente' },
      include: {
        vendedor: { select: { id: true, nome: true } },
        aldeia: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = aldeias.map((aldeia: any) => ({
      id: aldeia.id,
      nome: aldeia.nome,
      slug: aldeia.slug,
      saldoCofre: aldeia.vault?.saldo || 0,
      numVendedores: aldeia._count.users,
      movimentosRecentes: aldeia.vault?.transacoes || [],
      totalAngariado: aldeia.vault?.transacoes
        .filter((t: any) => t.tipo === 'deposito')
        .reduce((sum: number, t: any) => sum + t.valor, 0) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        aldeias: data,
        pendentes: pendentes.map((p: any) => ({
          id: p.id,
          valor: p.valor,
          descricao: p.descricao,
          estado: p.estado,
          createdAt: p.createdAt,
          vendedor: p.vendedor,
          aldeia: p.aldeia,
        })),
        totalGeral: data.reduce((sum: number, a: any) => sum + a.saldoCofre, 0),
        totalPendentes: pendentes.reduce((sum: number, p: any) => sum + p.valor, 0),
      }
    });
  } catch (error) {
    console.error('Error fetching superadmin cofre:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
