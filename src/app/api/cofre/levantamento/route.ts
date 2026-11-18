import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { executeWithRetry } from '@/lib/transaction-retry';
import { criarLevantamentoSchema } from '@/lib/validations';
import { aldeiaScopeDenied } from '@/lib/rbac/aldeia-scope';
import { criarPedidoLevantamentoCofre } from '@/lib/cofre-withdrawal';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const validation = criarLevantamentoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { valor, descricao, destino, observacoes, aldeiaId: bodyAldeiaId } = validation.data;
    const aldeiaId = bodyAldeiaId || user.aldeiaId;
    const scopeDenied = aldeiaScopeDenied(user, aldeiaId);
    if (scopeDenied) return scopeDenied;
    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não especificada' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const levantamento = await executeWithRetry(() =>
      prisma.$transaction((tx: Prisma.TransactionClient) =>
        criarPedidoLevantamentoCofre(tx, {
          valor,
          descricao,
          destino,
          observacoes,
          actorUserId: user.id,
          aldeiaId,
          ip,
          userAgent,
        })
      )
    );

    /* As notificações são posteriores ao commit e não podem invalidar a operação financeira. */
    try {
      const admins = await prisma.user.findMany({
        where: { aldeiaId, role: 'aldeia_admin', deletedAt: null, id: { not: user.id } },
        select: { id: true },
      });
      if (admins.length > 0) {
        await prisma.notificacao.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            tipo: 'levantamento_criado',
            titulo: 'Levantamento do cofre solicitado',
            mensagem: `${user.nome} solicitou um levantamento de ${valor.toFixed(2)}€ do cofre. Destino: ${destino}`,
            lida: false,
          })),
        });
      }
    } catch (notificationError) {
      console.error('Falha ao notificar administradores sobre levantamento:', notificationError);
    }

    return NextResponse.json({
      success: true,
      data: { id: levantamento.id, valor, descricao, destino, estado: 'pendente' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'SALDO_INSUFICIENTE_COFRE') {
      return NextResponse.json({ error: 'Saldo disponível insuficiente no cofre, considerando os levantamentos pendentes' }, { status: 409 });
    }
    if (message === 'COFRE_NAO_ENCONTRADO') {
      return NextResponse.json({ error: 'Cofre não encontrado' }, { status: 404 });
    }
    if (message === 'VALOR_LEVANTAMENTO_INVALIDO') {
      return NextResponse.json({ error: 'Valor de levantamento inválido' }, { status: 400 });
    }
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId') || user.aldeiaId;
    const estado = url.searchParams.get('estado');
    const scopeDenied = aldeiaScopeDenied(user, aldeiaId);
    if (scopeDenied) return scopeDenied;
    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não especificada' }, { status: 400 });
    }

    const vault = await prisma.vault.findUnique({
      where: { aldeiaId },
      select: { id: true },
    });
    if (!vault) return NextResponse.json({ success: true, data: [] });

    const where: Prisma.VaultTransactionWhereInput = {
      vaultId: vault.id,
      tipo: 'levantamento',
    };
    if (estado) where.estado = estado as Prisma.EnumVaultEstadoFilter['equals'];

    const levantamentos = await prisma.vaultTransaction.findMany({
      where,
      include: {
        criadoPor: { select: { id: true, nome: true, email: true } },
        aprovadoPor: { select: { id: true, nome: true } },
      },
      orderBy: { dataCriacao: 'desc' },
      take: 100,
    });
    return NextResponse.json({ success: true, data: levantamentos });
  } catch (error) {
    console.error('Error listing withdrawals:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
