import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requireAnyOfPermissions } from '@/lib/rbac/checkPermission';
import { executeWithRetry } from '@/lib/transaction-retry';
import { criarDepositoSchema } from '@/lib/validations';
import { aldeiaScopeDenied } from '@/lib/rbac/aldeia-scope';
import { criarPedidoDepositoCofre } from '@/lib/cofre-deposit';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const denied = await requireAnyOfPermissions(user.id, ['EXECUTE_VENDA', 'MANAGE_ALDEIA']);
    if (denied) return denied;

    const body = await request.json();
    const validation = criarDepositoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { valor, descricao, referencias, aldeiaId: bodyAldeiaId } = validation.data;
    if (Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-8) {
      return NextResponse.json({ error: 'O valor deve ter no máximo duas casas decimais' }, { status: 400 });
    }

    const aldeiaId = bodyAldeiaId || user.aldeiaId;
    const scopeDenied = aldeiaScopeDenied(user, aldeiaId);
    if (scopeDenied) return scopeDenied;
    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não especificada' }, { status: 400 });
    }

    const isAdmin = user.role === 'aldeia_admin' || user.role === 'super_admin';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const pedido = await executeWithRetry(() =>
      prisma.$transaction((tx: Prisma.TransactionClient) =>
        criarPedidoDepositoCofre(tx, {
          vendedorId: user.id,
          actorUserId: user.id,
          aldeiaId,
          valor,
          descricao,
          referencias,
          isAdmin,
          ip,
          userAgent,
        })
      )
    );

    if (!isAdmin) {
      try {
        const admins = await prisma.user.findMany({
          where: { aldeiaId, role: 'aldeia_admin', deletedAt: null },
          select: { id: true },
        });
        if (admins.length > 0) {
          await prisma.notificacao.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              tipo: 'deposito_criado' as const,
              titulo: 'Novo pedido de depósito',
              mensagem: `${user.nome} criou um pedido de depósito de ${valor}€`,
              lida: false,
            })),
          });
        }
      } catch (notificationError) {
        console.error('Falha ao notificar administradores sobre depósito:', notificationError);
      }
    }

    return NextResponse.json({ success: true, data: pedido }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'SALDO_INSUFICIENTE_CAIXA') {
      return NextResponse.json({ error: 'Saldo disponível insuficiente na caixa, considerando os pedidos pendentes' }, { status: 400 });
    }
    if (message === 'VALOR_DEPOSITO_INVALIDO') {
      return NextResponse.json({ error: 'Valor de depósito inválido' }, { status: 400 });
    }
    console.error('Erro ao criar pedido de depósito:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const denied = await requireAnyOfPermissions(user.id, ['EXECUTE_VENDA', 'MANAGE_ALDEIA']);
    if (denied) return denied;

    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    const aldeiaId = url.searchParams.get('aldeiaId');
    const where: Prisma.PedidoDepositoCofreWhereInput = {};

    if (user.role === 'vendedor') {
      where.vendedorId = user.id;
    } else if (user.role === 'aldeia_admin' || user.role === 'super_admin') {
      if (aldeiaId) {
        const scopeDenied = aldeiaScopeDenied(user, aldeiaId);
        if (scopeDenied) return scopeDenied;
        where.aldeiaId = aldeiaId;
      } else if (user.aldeiaId) {
        where.aldeiaId = user.aldeiaId;
      }
    } else {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (estado) where.estado = estado as any;

    const pedidos = await prisma.pedidoDepositoCofre.findMany({
      where,
      include: {
        vendedor: { select: { id: true, nome: true, email: true } },
        criadoPor: { select: { id: true, nome: true } },
        confirmadoPor: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: pedidos });
  } catch (error) {
    console.error('Erro ao listar pedidos de depósito:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
