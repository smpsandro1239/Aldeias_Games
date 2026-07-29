import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

export async function PUT(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const { userId, role, comissaoPercentual, comissaoAtiva } = body;

    if (!userId) {
      return NextResponse.json({ error: 'UserId requerido' }, { status: 400 });
    }

    // Verificar se o utilizador pertence à aldeia do admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Admin só pode gerir utilizadores da sua aldeia
    if (user.role === 'aldeia_admin' && targetUser.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: 'Não pode gerir utilizadores de outra aldeia' }, { status: 403 });
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (role) {
      // Converter role
      if (!['user', 'vendedor', 'aldeia_admin'].includes(role)) {
        return NextResponse.json({ error: 'Role inválida' }, { status: 400 });
      }
      updateData.role = role;
    }

    if (comissaoPercentual !== undefined) {
      // Atualizar % de comissão
      const percent = parseFloat(comissaoPercentual);
      if (isNaN(percent) || percent < 0 || percent > 100) {
        return NextResponse.json({ error: 'Percentagem inválida' }, { status: 400 });
      }
      updateData.comissaoPercentual = percent;
    }

    if (comissaoAtiva !== undefined) {
      updateData.comissaoAtiva = Boolean(comissaoAtiva);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Criar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        aldeiaId: user.aldeiaId,
        action: 'UPDATE_USER_ROLE',
        resource: 'user',
        resourceId: userId,
        metadata: { role, comissaoPercentual, comissaoAtiva },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        nome: updated.nome,
        role: updated.role,
        comissaoPercentual: updated.comissaoPercentual,
        comissaoAtiva: updated.comissaoAtiva,
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const aldeiaId = searchParams.get('aldeiaId');

    if (!aldeiaId) {
      return NextResponse.json({ error: 'AldeiaID requerido' }, { status: 400 });
    }

    // Buscar vendedores da aldeia com comissões
    const vendedores = await prisma.user.findMany({
      where: {
        aldeiaId,
        role: 'vendedor',
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        comissaoPercentual: true,
        comissaoAtiva: true,
        comissaoTotal: true,
        saldo: true,
      },
      orderBy: { nome: 'asc' },
    });

    // Calcular estatísticas em tempo real
    const stats = {
      totalVendedores: vendedores.length,
      comissaoTotalGeral: vendedores.reduce((sum: number, v: any) => sum + (v.comissaoTotal || 0), 0),
      vendedoresAtivos: vendedores.filter((v: any) => v.comissaoAtiva).length,
    };

    return NextResponse.json({ data: vendedores, stats });
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const { vendaId, comissaoPercentual } = body;

    if (!vendaId) {
      return NextResponse.json({ error: 'VendaID requerido' }, { status: 400 });
    }

    // Buscar venda
    const venda = await any.findUnique({
      where: { id: vendaId },
      include: { user: true }
    });

    if (!venda) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    }

    // Calcular comissão
    const percent = comissaoPercentual || venda.user?.comissaoPercentual || 10;
    const comissao = (venda.valor * percent) / 100;

    // Atualizar comissão do vendedor
    if (venda.id) {
      await prisma.user.update({
        where: { id: venda.id },
        data: { comissaoTotal: { increment: comissao } }
      });
    }

    return NextResponse.json({ success: true, comissao });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}