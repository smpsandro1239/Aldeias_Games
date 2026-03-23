import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (!hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId');
    const eventoId = url.searchParams.get('eventoId');

    let aldeiaFilter = {};
    if (user.role === 'aldeia_admin' && user.aldeiaId) {
      aldeiaFilter = { aldeiaId: user.aldeiaId };
    } else if (aldeiaId) {
      aldeiaFilter = { aldeiaId };
    }

    const eventosWhere: Record<string, unknown> = {
      ...aldeiaFilter,
      ...(eventoId ? { id: eventoId } : {}),
    };

    const [eventos, jogos, participacoes, vendas] = await Promise.all([
      prisma.evento.findMany({
        where: eventosWhere,
        select: { id: true, nome: true, estado: true, totalAngariado: true, totalParticipacoes: true, dataInicio: true },
      }),
      prisma.jogo.findMany({
        where: eventoId ? { eventoId } : { evento: aldeiaFilter },
        select: { id: true, nome: true, tipo: true, estado: true, totalAngariado: true, totalParticipacoes: true, preco: true },
      }),
      prisma.participacao.findMany({
        where: eventoId ? { jogo: { eventoId } } : { jogo: { evento: aldeiaFilter } },
        select: { valorPago: true, createdAt: true, estadoPagamento: true },
      }),
      prisma.venda.findMany({
        where: {
          vendedor: user.role === 'aldeia_admin' ? { aldeiaId: user.aldeiaId as string } : aldeiaId ? { aldeiaId } : {},
        },
        select: { valor: true, comissao: true, createdAt: true },
      }),
    ]);

    const eventosAtivos = eventos.filter((e: any) => e.estado === 'ativo').length;
    const jogosAtivos = jogos.filter((j: any) => j.estado === 'aberto').length;
    const totalAngariado = participacoes
      .filter((p: any) => p.estadoPagamento === 'concluido')
      .reduce((acc: number, p: any) => acc + p.valorPago, 0);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const evolucaoMensal: Record<string, { valor: number; participacoes: number }> = {};

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
      evolucaoMensal[key] = { valor: 0, participacoes: 0 };
    }

    participacoes
      .filter((p: any) => p.estadoPagamento === 'concluido' && new Date(p.createdAt) >= firstDayOfMonth)
      .forEach((p: any) => {
        const key = new Date(p.createdAt).toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
        if (evolucaoMensal[key]) {
          evolucaoMensal[key].valor += p.valorPago;
          evolucaoMensal[key].participacoes += 1;
        }
      });

    const topVendedores = await prisma.user.findMany({
      where: {
        role: 'vendedor',
        ...(user.role === 'aldeia_admin' && user.aldeiaId ? { aldeiaId: user.aldeiaId as string } : aldeiaId ? { aldeiaId } : {}),
      },
      select: {
        id: true,
        nome: true,
        vendas: { select: { valor: true } },
      },
      take: 5,
    });

    const topVendedoresData = topVendedores.map((v: any) => ({
      id: v.id,
      nome: v.nome,
      totalVendas: v.vendas.length,
      valorTotal: v.vendas.reduce((acc: number, v: any) => acc + v.valor, 0),
    })).sort((a: any, b: any) => b.valorTotal - a.valorTotal);

    const data = {
      totalEventos: eventos.length,
      eventosAtivos,
      totalJogos: jogos.length,
      jogosAtivos,
      totalParticipacoes: participacoes.filter((p: any) => p.estadoPagamento === 'concluido').length,
      totalAngariado,
      evolucaoMensal: Object.entries(evolucaoMensal)
        .map(([mes, dados]) => ({ mes, ...dados }))
        .reverse(),
      topVendedores: topVendedoresData,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro no dashboard stats:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}