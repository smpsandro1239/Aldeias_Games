import { NextRequest, NextResponse } from 'next/server';
import { EstadoEntrega, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { executeWithRetry } from '@/lib/transaction-retry';
import { solicitarEntregaSaldo } from '@/lib/solicitar-entrega-saldo';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (user.role !== 'vendedor') {
      return NextResponse.json({ error: 'Apenas vendedores podem solicitar entregas' }, { status: 403 });
    }

    const denied = await requirePermission(user.id, 'EXECUTE_VENDA', user.aldeiaId);
    if (denied) return denied;

    const body = await request.json();
    const { valor, observacoes } = body ?? {};

    if (
      typeof valor !== 'number' ||
      !Number.isFinite(valor) ||
      valor <= 0 ||
      Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-8
    ) {
      return NextResponse.json({ error: 'Valor inválido (deve ser positivo e ter no máximo duas casas decimais)' }, { status: 400 });
    }

    if (observacoes !== undefined && observacoes !== null && (typeof observacoes !== 'string' || observacoes.length > 1000)) {
      return NextResponse.json({ error: 'Observações inválidas (máximo 1000 caracteres)' }, { status: 400 });
    }

    if (!user.aldeiaId) {
      return NextResponse.json({ error: 'Vendedor não tem aldeia associada' }, { status: 400 });
    }

    const entrega = await executeWithRetry(() =>
      prisma.$transaction((tx) =>
        solicitarEntregaSaldo(tx, {
          vendedorId: user.id,
          aldeiaId: user.aldeiaId,
          valor,
          observacoes,
          actorUserId: user.id,
          ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        })
      )
    );

    return NextResponse.json({ success: true, data: entrega }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'SALDO_A_ENTREGAR_INSUFICIENTE') {
      return NextResponse.json({ error: 'Saldo disponível insuficiente para esta entrega' }, { status: 400 });
    }
    if (message === 'VENDEDOR_NAO_ELEGIVEL') {
      return NextResponse.json({ error: 'Apenas vendedores associados a uma aldeia podem solicitar entregas' }, { status: 403 });
    }
    if (message === 'ADMIN_ALDEIA_NAO_ENCONTRADO') {
      return NextResponse.json({ error: 'Nenhum administrador encontrado para esta aldeia' }, { status: 404 });
    }
    console.error('Erro ao solicitar entrega de saldo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (user.role !== 'vendedor') {
      return NextResponse.json({ error: 'Apenas vendedores podem consultar as suas entregas' }, { status: 403 });
    }

    const denied = await requirePermission(user.id, 'EXECUTE_VENDA', user.aldeiaId);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const estadosValidos = ['solicitado', 'confirmado', 'cancelado', 'concluido'];
    if (estado && !estadosValidos.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const where: Prisma.EntregaSaldoWhereInput = { vendedorId: user.id };
    if (estado) where.estado = estado as EstadoEntrega;

    const entregas = await prisma.entregaSaldo.findMany({
      where,
      include: {
        admin: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const pendentes = entregas.filter((e) => e.estado === 'solicitado' || e.estado === 'confirmado');
    const totalPendente = pendentes.reduce((acc, e) => acc + e.valor, 0);

    return NextResponse.json({
      data: entregas,
      resumo: {
        totalSolicitado: entregas.reduce((acc, e) => acc + e.valor, 0),
        totalPendente,
        totalConcluido: entregas.filter((e) => e.estado === 'concluido').reduce((acc, e) => acc + e.valor, 0),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
