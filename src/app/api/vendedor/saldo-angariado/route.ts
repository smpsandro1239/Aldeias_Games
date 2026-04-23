import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!hasRole(user.role, ['vendedor'])) {
      return NextResponse.json({ error: 'Apenas vendedores' }, { status: 403 });
    }

    // Calcular total angariado (soma de pedidos de carregamento confirmados)
    const pedidosConfirmados = await prisma.pedidoCarregamento.findMany({
      where: {
        vendedorId: user.id,
        estado: 'confirmado'
      }
    });

    const totalAngariado = pedidosConfirmados.reduce((acc, p) => acc + p.valor, 0);

    // Obter entregas
    const entregas = await prisma.entregaSaldo.findMany({
      where: { vendedorId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const totalEntregue = entregas
      .filter(e => e.estado === 'concluido')
      .reduce((acc, e) => acc + e.valor, 0);

    const totalSolicitado = entregas
      .filter(e => e.estado === 'solicitado')
      .reduce((acc, e) => acc + e.valor, 0);

    const saldoAEntregar = totalAngariado - totalEntregue;

    return NextResponse.json({
      data: {
        totalAngariado,
        totalEntregue,
        totalSolicitado,
        saldoAEntregar,
        historicoPedidos: pedidosConfirmados.map(p => ({
          id: p.id,
          valor: p.valor,
          usuario: p.user?.nome,
          data: p.createdAt,
          estado: p.estado
        })),
        historicoEntregas: entregas.map(e => ({
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
