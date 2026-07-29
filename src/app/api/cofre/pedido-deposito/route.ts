import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requireAnyOfPermissions } from '@/lib/rbac/checkPermission';
import { logAudit } from '@/lib/audit';
import { criarDepositoSchema } from '@/lib/validations';

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

    const aldeiaId = bodyAldeiaId || user.aldeiaId;
    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não especificada' }, { status: 400 });
    }

    const isAdmin = user.role === 'aldeia_admin' || user.role === 'super_admin';

    if (!isAdmin) {
      const cashbox = await prisma.vendedorCashbox.findUnique({
        where: { userId: user.id }
      });

      if (!cashbox || cashbox.saldo < valor) {
        return NextResponse.json({ error: 'Saldo insuficiente na caixa do vendedor' }, { status: 400 });
      }
    }

    const pedido = await prisma.pedidoDepositoCofre.create({
      data: {
        vendedorId: user.id,
        aldeiaId,
        valor,
        descricao: descricao || `Depósito de ${valor}€`,
        referencias: referencias ? JSON.stringify(referencias) : null,
        criadoPorId: user.id,
        ...(isAdmin ? { estado: 'confirmado' as const, confirmadoPorId: user.id, confirmadoAt: new Date() } : {}),
      }
    });

    if (isAdmin) {
      const vault = await prisma.vault.upsert({
        where: { aldeiaId },
        update: { saldo: { increment: valor } },
        create: { aldeiaId, saldo: valor },
      });

      await prisma.vaultTransaction.create({
        data: {
          vaultId: vault.id,
          tipo: 'deposito',
          valor,
          descricao: descricao || `Depósito de ${valor}€`,
          estado: 'confirmado',
          criadoPorId: user.id,
          aprovadoPorId: user.id,
          dataAprovacao: new Date(),
        }
      });
    }

    // Log audit
    const ip = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    logAudit({
      userId: user.id,
      aldeiaId,
      action: isAdmin ? 'deposito.cofre_direto' : 'deposito.criado',
      resource: 'pedido-deposito',
      resourceId: pedido.id,
      metadata: { valor, descricao: descricao || null, autoConfirmado: isAdmin },
      ip,
      userAgent,
    });

    if (!isAdmin) {
      // Notify admins of this aldeia (only for vendedor deposits)
      const admins = await prisma.user.findMany({
        where: {
          aldeiaId,
          role: 'aldeia_admin',
          deletedAt: null,
        },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notificacao.createMany({
          data: admins.map((admin: any) => ({
            userId: admin.id,
            tipo: 'deposito_criado',
            titulo: 'Novo pedido de depósito',
            mensagem: `${user.nome} criou um pedido de depósito de ${valor}€`,
            lida: false,
          })),
        });
      }
    }

    return NextResponse.json({ success: true, data: pedido });
  } catch (error) {
    console.error('Error creating deposit request:', error);
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
      if (aldeiaId) where.aldeiaId = aldeiaId;
      else if (user.aldeiaId) where.aldeiaId = user.aldeiaId;
    } else {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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
    console.error('Error listing deposit requests:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
