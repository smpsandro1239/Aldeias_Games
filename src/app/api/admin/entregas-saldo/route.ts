import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { executeWithRetry } from '@/lib/transaction-retry';
import { processarTransicaoEntregaSaldo, type EntregaSaldoAction } from '@/lib/entrega-saldo';
import { getPaginationFromRequest, createPagination, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const aldeiaId = searchParams.get('aldeiaId');
    const { page, limit } = getPaginationFromRequest(request);

    const where: Prisma.EntregaSaldoWhereInput = {};

    if (user.role === 'aldeia_admin' && user.aldeiaId) {
      where.aldeiaId = user.aldeiaId;
    }
    if (estado) where.estado = estado as any;
    if (aldeiaId && user.role === 'super_admin') where.aldeiaId = aldeiaId;

    const { skip, take } = createPagination(page, limit);

    const [entregas, total] = await Promise.all([
      prisma.entregaSaldo.findMany({
        where,
        include: {
          vendedor: { select: { id: true, nome: true, email: true, telefone: true } },
          admin: { select: { id: true, nome: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.entregaSaldo.count({ where }),
    ]);

    return NextResponse.json({
      ...createPaginatedResponse(entregas, total, page, limit),
      resumo: {
        total,
        pendentes: entregas.filter((e) => e.estado === 'solicitado').length,
        valorPendente: entregas.filter((e) => e.estado === 'solicitado').reduce((acc, e) => acc + e.valor, 0),
        confirmadas: entregas.filter((e) => e.estado === 'confirmado').length,
        valorConfirmado: entregas.filter((e) => e.estado === 'confirmado').reduce((acc, e) => acc + e.valor, 0),
        concluidas: entregas.filter((e) => e.estado === 'concluido').length,
        valorConcluido: entregas.filter((e) => e.estado === 'concluido').reduce((acc, e) => acc + e.valor, 0),
      },
    });

  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admins podem confirmar/rejeitar
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const { entregaId, acao, observacoes } = body; // acao: 'confirmar' | 'rejeitar' | 'concluir'

    if (!entregaId || !acao) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Buscar entrega
    const entrega = await prisma.entregaSaldo.findUnique({
      where: { id: entregaId },
      include: {
        vendedor: { select: { id: true, nome: true, email: true, telefone: true } },
        admin: { select: { id: true, nome: true, email: true } }
      }
    });

    if (!entrega) {
      return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });
    }

    // Verificar permissão (admin só mexe na sua aldeia)
    if (user.role === 'aldeia_admin' && user.aldeiaId !== entrega.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado para esta aldeia' }, { status: 403 });
    }

    if (!['confirmar', 'rejeitar', 'concluir'].includes(acao)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    try {
      const entregaAtualizada = await executeWithRetry(() =>
        prisma.$transaction((tx) =>
          processarTransicaoEntregaSaldo(tx, {
            entregaId,
            adminId: user.id,
            acao: acao as EntregaSaldoAction,
            observacoes,
          })
        )
      );


      return NextResponse.json({
        success: true,
        data: entregaAtualizada,
        message: acao === 'confirmar' ? 'Entrega confirmada e saldo transferido com sucesso!' :
                 acao === 'rejeitar' ? 'Entrega rejeitada' :
                 'Entrega marcada como concluída'
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      if (errMsg === 'ENTREGA_JA_PROCESSADA') {
        return NextResponse.json({ error: 'A entrega já foi processada' }, { status: 409 });
      }
      if (errMsg === 'SALDO_INSUFICIENTE_VENDEDOR') {
        return NextResponse.json({ error: 'Saldo insuficiente do vendedor' }, { status: 400 });
      }
      if (errMsg === 'ENTREGA_NAO_ENCONTRADA') {
        return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Erro ao processar entrega:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
