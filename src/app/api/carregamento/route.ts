import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

function generatePassword(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { valor, aldeiaId, metodoPagamento } = body;

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia requerida' }, { status: 400 });
    }

    const passwordOneTime = generatePassword(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create carregamento request
    const pedido = await prisma.pedidoCarregamento.create({
      data: {
        userId: user.id,
        aldeiaId,
        valor,
        metodoPagamento: metodoPagamento || 'dinheiro',
        passwordOneTime,
        expiresAt,
        estado: 'pendente',
      },
    });

    // TODO: Send notifications (email/SMS)

    return NextResponse.json({
      success: true,
      data: {
        pedidoId: pedido.id,
        password: passwordOneTime,
        expiresAt: expiresAt.toISOString(),
        requerAutorizacao: pedido.requerAutorizacao,
      }
    });
  } catch (error) {
    console.error('Error creating carregamento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo'); // 'pendente', 'aprovacao'

    let where: any = {};

    if (tipo === 'pendente') {
      // Vendedor seeing pending carregamentos
      if (user.role === 'vendedor') {
        where = {
          aldeiaId: user.aldeiaId,
          estado: 'pendente',
          pagamentoConfirmado: false,
        };
      } else if (user.role === 'aldeia_admin') {
        where = {
          aldeiaId: user.aldeiaId,
          estado: 'pendente',
        };
      }
    } else if (tipo === 'aprovacao') {
      // Admin seeing requests needing authorization
      if (user.role === 'aldeia_admin') {
        where = {
          aldeiaId: user.aldeiaId,
          requerAutorizacao: true,
          autorizado: false,
        };
      }
    } else {
      // User's own requests
      where = { userId: user.id };
    }

    const pedidos = await prisma.pedidoCarregamento.findMany({
      where,
      include: {
        user: { select: { id: true, nome: true, email: true, telefone: true } },
        vendedor: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ data: pedidos });
  } catch (error) {
    console.error('Error fetching carregamentos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}