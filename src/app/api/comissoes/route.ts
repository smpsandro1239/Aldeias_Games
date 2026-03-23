import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const vendedorId = url.searchParams.get('vendedorId');

    let where: Record<string, unknown> = {};

    if (user.role === 'vendedor') {
      where.vendedorId = user.id;
    } else if (user.role === 'aldeia_admin' && user.aldeiaId) {
      where.vendedor = { aldeiaId: user.aldeiaId };
    } else if (vendedorId) {
      where.vendedorId = vendedorId;
    }

    const comissoes = await prisma.transacao.findMany({
      where,
      include: {
        user: {
          select: { id: true, nome: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalComissao = comissoes
      .filter(t => t.tipo === 'comissao')
      .reduce((acc, t) => acc + t.valor, 0);

    return NextResponse.json({
      success: true,
      data: {
        comissoes,
        totalComissao,
      },
    });
  } catch (error) {
    console.error('Erro ao listar comissões:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { vendedorId, percentual, metaVendas, bônusMeta } = body;

    if (!vendedorId || !percentual) {
      return NextResponse.json(
        { error: 'ID do vendedor e percentagem são obrigatórios' },
        { status: 400 }
      );
    }

    if (percentual < 0 || percentual > 50) {
      return NextResponse.json(
        { error: 'Percentagem deve estar entre 0% e 50%' },
        { status: 400 }
      );
    }

    const vendedor = await prisma.user.findUnique({
      where: { id: vendedorId },
      select: { id: true, role: true, aldeiaId: true },
    });

    if (!vendedor || vendedor.role !== 'vendedor') {
      return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
    }

    const comissao = await prisma.comissao.upsert({
      where: { vendedorId },
      update: {
        percentual,
        metaVendas: metaVendas || null,
        bonusMeta: bonusMeta || null,
      },
      create: {
        vendedorId,
        percentual,
        metaVendas: metaVendas || null,
        bonusMeta: bonusMeta || null,
        aldeiaId: vendedor.aldeiaId,
      },
    });

    return NextResponse.json({
      success: true,
      data: comissao,
    });
  } catch (error) {
    console.error('Erro ao configurar comissão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
