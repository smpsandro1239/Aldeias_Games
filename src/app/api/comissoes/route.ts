import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

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
      .filter((t: (typeof comissoes)[number]) => t.tipo === 'comissao')
      .reduce((acc: number, t: (typeof comissoes)[number]) => acc + t.valor, 0);

    return NextResponse.json({
      success: true,
      data: {
        comissoes,
        totalComissao,
      },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro ao listar comissões:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const { vendedorId, percentual, metaVendas, bonusMeta } = body;

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

    const existingComissao = await prisma.comissao.findFirst({
      where: { vendedorId },
    });

    let comissao;
    if (existingComissao) {
      comissao = await prisma.comissao.update({
        where: { id: existingComissao.id },
        data: {
          percentual,
          metaVendas: metaVendas || null,
          bonusMeta: bonusMeta || null,
        },
      });
    } else {
      comissao = await prisma.comissao.create({
        data: {
          vendedorId,
          percentual,
          metaVendas: metaVendas || null,
          bonusMeta: bonusMeta || null,
          aldeiaId: vendedor.aldeiaId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: comissao,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro ao configurar comissão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
