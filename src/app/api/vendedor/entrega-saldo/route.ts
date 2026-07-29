import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas vendedores podem solicitar entrega
    const denied = await requirePermission(user.id, 'EXECUTE_VENDA');
    if (denied) return denied;

    const body = await request.json();
    const { valor, observacoes } = body;

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    // Verificar saldo a entregar (total angariado - total entregue)
    const pedidosConfirmados = await prisma.pedidoCarregamento.count({
      where: {
        vendedorId: user.id,
        estado: 'confirmado'
      }
    });

    // Calcular total angariado
    const totalAngariado = await prisma.pedidoCarregamento.aggregate({
      where: {
        vendedorId: user.id,
        estado: 'confirmado'
      },
      _sum: { valor: true }
    });
    const totalAngariadoValor = totalAngariado._sum.valor || 0;

    // Calcular total entregue (entregas concluídas)
    const totalEntregue = await prisma.entregaSaldo.aggregate({
      where: {
        vendedorId: user.id,
        estado: 'concluido'
      },
      _sum: { valor: true }
    });
    const totalEntregueValor = totalEntregue._sum.valor || 0;

    const saldoAEntregar = totalAngariadoValor - totalEntregueValor;

    // Verificar se há saldo suficiente
    if (valor > saldoAEntregar) {
      return NextResponse.json(
        { error: `Saldo insuficiente. Saldo a entregar: €${saldoAEntregar.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Obter aldeia do vendedor
    if (!user.aldeiaId) {
      return NextResponse.json({ error: 'Vendedor não tem aldeia associada' }, { status: 400 });
    }

    // Buscar admin da aldeia
    const admin = await prisma.user.findFirst({
      where: {
        aldeiaId: user.aldeiaId,
        role: 'aldeia_admin'
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Nenhum administrador encontrado para esta aldeia' }, { status: 404 });
    }

    // Criar solicitação de entrega
    const entrega = await prisma.entregaSaldo.create({
      data: {
        vendedorId: user.id,
        adminId: admin.id,
        aldeiaId: user.aldeiaId,
        valor,
        estado: 'solicitado',
        observacoes,
      },
      include: {
        vendedor: {
          select: { id: true, nome: true, email: true, telefone: true }
        },
        admin: {
          select: { id: true, nome: true, email: true, telefone: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: entrega
    });

  } catch (error) {
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

    // Verificar se é vendedor
    const denied = await requirePermission(user.id, 'EXECUTE_VENDA');
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');

    let where: Prisma.EntregaSaldoWhereInput = {
      vendedorId: user.id
    };

    if (estado) {
      where.estado = estado as any;
    }

    const entregas = await prisma.entregaSaldo.findMany({
      where,
      include: {
        admin: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Calcular total de entregas pendentes
    const pendentes = entregas.filter((e: any) => e.estado === 'solicitado' || e.estado === 'confirmado');
    const totalPendente = pendentes.reduce((acc: number, e: any) => acc + e.valor, 0);

    return NextResponse.json({
      data: entregas,
      resumo: {
        totalSolicitado: entregas.reduce((acc: number, e: any) => acc + e.valor, 0),
        totalPendente,
        totalConcluido: entregas.filter((e: any) => e.estado === 'concluido').reduce((acc: number, e: any) => acc + e.valor, 0)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
