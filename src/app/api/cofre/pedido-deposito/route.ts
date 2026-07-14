import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { criarDepositoSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['vendedor', 'aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Apenas vendedores, admins de aldeia e super admins podem depositar no cofre' }, { status: 401 });
    }

    const body = await request.json();
    const validation = criarDepositoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { valor, descricao, referencias } = validation.data;

    const cashbox = await prisma.vendedorCashbox.findUnique({
      where: { userId: user.id }
    });

    if (!cashbox || cashbox.saldo < valor) {
      return NextResponse.json({ error: 'Saldo insuficiente na caixa do vendedor' }, { status: 400 });
    }

    if (!user.aldeiaId) {
      return NextResponse.json({ error: 'Vendedor sem aldeia associada' }, { status: 400 });
    }

    const pedido = await prisma.pedidoDepositoCofre.create({
      data: {
        vendedorId: user.id,
        aldeiaId: user.aldeiaId,
        valor,
        descricao: descricao || `Depósito de ${valor}€`,
        referencias: referencias ? JSON.stringify(referencias) : null,
        criadoPorId: user.id,
      }
    });

    // Log audit
    const ip = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    logAudit({
      userId: user.id,
      aldeiaId: user.aldeiaId ?? undefined,
      action: 'deposito.criado',
      resource: 'pedido-deposito',
      resourceId: pedido.id,
      metadata: { valor, descricao: descricao || null },
      ip,
      userAgent,
    });

    // Notify admins of this aldeia
    const admins = await prisma.user.findMany({
      where: {
        aldeiaId: user.aldeiaId,
        role: 'aldeia_admin',
        deletedAt: null,
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notificacao.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          tipo: 'deposito_criado',
          titulo: 'Novo pedido de depósito',
          mensagem: `${user.nome} criou um pedido de depósito de ${valor}€`,
          lida: false,
        })),
      });
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
    if (!user || !hasRole(user.role, ['vendedor', 'aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    const aldeiaId = url.searchParams.get('aldeiaId');

    const where: any = {};

    if (user.role === 'vendedor') {
      where.vendedorId = user.id;
    } else if (user.role === 'aldeia_admin' || user.role === 'super_admin') {
      if (aldeiaId) where.aldeiaId = aldeiaId;
      else if (user.aldeiaId) where.aldeiaId = user.aldeiaId;
    } else {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (estado) where.estado = estado;

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
