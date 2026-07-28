import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { createNotificacaoSchema } from '@/lib/validations';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';

// GET - Listar notificações do utilizador
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { page, limit } = getPaginationFromRequest(request);
    const skip = (page - 1) * limit;

    const url = new URL(request.url);
    const apenasNaoLidas = url.searchParams.get('naoLidas') === 'true';

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (apenasNaoLidas) {
      where.lida = false;
    }

    const [notificacoes, total, naoLidas] = await Promise.all([
      prisma.notificacao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notificacao.count({ where }),
      prisma.notificacao.count({
        where: { userId: user.id, lida: false },
      }),
    ]);

    return NextResponse.json({
      ...createPaginatedResponse(notificacoes, total, page, limit),
      naoLidas,
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar notificação (admin apenas)
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const validation = createNotificacaoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Se for admin de aldeia, verificar se pode notificar este utilizador
    if (user.role === 'aldeia_admin') {
      const targetUser = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { aldeiaId: true },
      });

      if (targetUser?.aldeiaId !== user.aldeiaId) {
        return NextResponse.json(
          { error: 'Não pode enviar notificações para utilizadores de outra aldeia' },
          { status: 403 }
        );
      }
    }

    const notificacao = await prisma.notificacao.create({
      data: {
        tipo: data.tipo,
        titulo: data.titulo,
        mensagem: data.mensagem,
        dados: data.dados ? JSON.stringify(data.dados) : null,
        userId: data.userId,
        lida: false,
      },
    });

    return NextResponse.json(
      { success: true, data: notificacao },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Marcar todas como lidas
export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    await prisma.notificacao.updateMany({
      where: {
        userId: user.id,
        lida: false,
      },
      data: {
        lida: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Todas as notificações marcadas como lidas',
    });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
