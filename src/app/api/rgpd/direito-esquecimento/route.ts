import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    
    if (!user || !hasRole(user.role, ['super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    const userId = url.searchParams.get('userId');

    let where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (userId) where.id = userId;

    const pedidos = await prisma.direitoEsquecimento.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, nome: true }
        }
      },
      orderBy: { solicitadoEm: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: pedidos,
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se já existe pedido pendente
    const pedidoExistente = await prisma.direitoEsquecimento.findFirst({
      where: {
        userId: user.id,
        estado: 'pendente',
      },
    });

    if (pedidoExistente) {
      return NextResponse.json({ error: 'Já existe um pedido pendente' }, { status: 400 });
    }

    const pedido = await prisma.direitoEsquecimento.create({
      data: {
        userId: user.id,
        estado: 'pendente',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pedido de direito ao esquecimento registado. Seremos contactados em breve.',
      data: pedido,
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    
    if (!user || !hasRole(user.role, ['super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { pedidoId, acao, notas } = body;

    if (!pedidoId || !acao) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    if (acao === 'processar') {
      // Marcar como processado
      const pedido = await prisma.direitoEsquecimento.update({
        where: { id: pedidoId },
        data: {
          estado: 'processado',
          processadoEm: new Date(),
          notas,
        },
        include: {
          user: {
            select: { id: true, email: true, nome: true }
          }
        }
      });

      // Anonimizar dados do utilizador
      const targetUserId = pedido.userId;

      // Delete personal data from related tables
      await prisma.$transaction([
        prisma.pushSubscription.deleteMany({ where: { userId: targetUserId } }),
        prisma.notificacao.deleteMany({ where: { userId: targetUserId } }),
        prisma.consentimento.deleteMany({ where: { userId: targetUserId } }),
        prisma.userPermission.deleteMany({ where: { userId: targetUserId } }),
      ]);

      // Anonimize user record
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          nome: 'Utilizador Anónimo',
          telefone: null,
          password: 'DELETED_' + Date.now(),
          email: `deleted_${Date.now()}_${targetUserId.substring(0, 8)}@deleted.local`,
          emailVerificado: false,
          notificacoesEmail: false,
          saldo: 0,
          comissaoTotal: 0,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Pedido processado. Dados do utilizador foram anonimizados.',
        data: pedido,
      });
    }

    if (acao === 'rejeitar') {
      const pedido = await prisma.direitoEsquecimento.update({
        where: { id: pedidoId },
        data: {
          estado: 'rejeitado',
          processadoEm: new Date(),
          notas,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Pedido rejeitado.',
        data: pedido,
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
