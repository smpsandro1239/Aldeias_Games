import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const participacao = await prisma.participacao.findUnique({
      where: { id },
      include: {
        jogo: { include: { evento: { include: { aldeia: true } } } },
        user: true,
      },
    });

    if (!participacao) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

    // Verificar se o usuário pode ver esta participação
    if (user.role === 'user' && participacao.userId !== user.id) {
       return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({ data: participacao });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin', 'vendedor'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    
    // Lista de campos permitidos para atualização via admin/vendedor
    const updateData: Prisma.ParticipacaoUpdateInput = {};
    if (body.estadoPagamento) updateData.estadoPagamento = body.estadoPagamento;
    if (body.premioEntregue !== undefined) updateData.premioEntregue = body.premioEntregue;
    if (body.revelado !== undefined) updateData.revelado = body.revelado;

    const updated = await prisma.participacao.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erro ao atualizar participação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await prisma.participacao.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
