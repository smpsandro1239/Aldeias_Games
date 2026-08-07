import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const denied = await requirePermission(user.id, 'EXECUTE_VENDA');
    if (denied) return denied;

    // Calcular total angariado (soma de pedidos de carregamento confirmados)
    const pedidosConfirmados = await prisma.pedidoCarregamento.findMany({
      where: {
        vendedorId: user.id,
        estado: 'confirmado'
      },
      include: {
        user: { select: { id: true, nome: true, email: true } }
      }
    });

    type PedidoComUser = Prisma.PedidoCarregamentoGetPayload<{
      include: { user: { select: { id: true; nome: true; email: true } } }
    }>;

    const totalAngariado = pedidosConfirmados.reduce((acc: number, p: PedidoComUser) => acc + p.valor, 0);

    // Obter entregas
    const entregas = await prisma.entregaSaldo.findMany({
      where: { vendedorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { admin: true }
    });

    const totalEntregue = entregas
      .filter((e: any) => e.estado === 'concluido')
      .reduce((acc: number, e: any) => acc + e.valor, 0);

    const totalSolicitado = entregas
      .filter((e: any) => e.estado === 'solicitado')
      .reduce((acc: number, e: any) => acc + e.valor, 0);

    const saldoAEntregar = totalAngariado - totalEntregue;

    return NextResponse.json({
      data: {
        totalAngariado,
        totalEntregue,
        totalSolicitado,
        saldoAEntregar,
        historicoPedidos: pedidosConfirmados.map((p: PedidoComUser) => ({
          id: p.id,
          valor: p.valor,
          usuario: p.user?.nome,
          data: p.createdAt,
          estado: p.estado
        })),
        historicoEntregas: entregas.map((e: Prisma.EntregaSaldoGetPayload<{ include: { admin: true } }>) => ({
          id: e.id,
          valor: e.valor,
          estado: e.estado,
          dataSolicitacao: e.dataSolicitacao,
          dataConfirmacao: e.dataConfirmacao,
          dataConclusao: e.dataConclusao,
          admin: e.admin?.nome
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao buscar saldo angariado:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
