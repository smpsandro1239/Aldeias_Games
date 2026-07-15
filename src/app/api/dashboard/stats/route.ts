import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
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
    const dataInicio = url.searchParams.get('dataInicio');
    const dataFim = url.searchParams.get('dataFim');

    let aldeiaFilter = {};
    if (user.role === 'aldeia_admin' && user.aldeiaId) {
      aldeiaFilter = { aldeiaId: user.aldeiaId };
    } else if (aldeiaId) {
      aldeiaFilter = { aldeiaId };
    }

    const dateFilter: Record<string, unknown> = {};
    if (dataInicio) {
      dateFilter.gte = new Date(dataInicio);
    }
    if (dataFim) {
      dateFilter.lte = new Date(dataFim);
    }

    const hasDateFilter = dataInicio || dataFim;

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
        select: { valorPago: true, createdAt: true, estadoPagamento: true, metodoPagamento: true },
      }),
      prisma.venda.findMany({
        where: {
          vendedor: user.role === 'aldeia_admin' ? { aldeiaId: user.aldeiaId as string } : aldeiaId ? { aldeiaId } : {},
        },
        select: { valor: true, comissao: true, createdAt: true },
      }),
    ]);

    const eventosAtivos = eventos.filter((e: Prisma.Evento) => e.estado === 'ativo').length;
    const jogosAtivos = jogos.filter((j: Prisma.Jogo) => j.estado === 'aberto').length;
    const totalAngariado = participacoes
      .filter((p: Prisma.Participacao) => p.estadoPagamento === 'concluido')
      .reduce((acc: number, p: Prisma.Participacao) => acc + p.valorPago, 0);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const evolucaoMensal: Record<string, { valor: number; participacoes: number }> = {};

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
      evolucaoMensal[key] = { valor: 0, participacoes: 0 };
    }

    participacoes
      .filter((p: Prisma.Participacao) => p.estadoPagamento === 'concluido' && new Date(p.createdAt) >= firstDayOfMonth)
      .forEach((p: Prisma.Participacao) => {
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

    const topVendedoresData = topVendedores.map((v: Prisma.UserGetPayload<{ select: { id: true; nome: true; vendas: { select: { valor: true } } } }>) => ({
      id: v.id,
      nome: v.nome,
      totalVendas: v.vendas.length,
      valorTotal: v.vendas.reduce((acc: number, v: { valor: number }) => acc + v.valor, 0),
    })).sort((a: { valorTotal: number }, b: { valorTotal: number }) => b.valorTotal - a.valorTotal);

    const data = {
      totalEventos: eventos.length,
      eventosAtivos,
      totalJogos: jogos.length,
      jogosAtivos,
      totalParticipacoes: participacoes.filter((p: Prisma.Participacao) => p.estadoPagamento === 'concluido').length,
      totalAngariado,
      evolucaoMensal: Object.entries(evolucaoMensal)
        .map(([mes, dados]) => ({ mes, ...dados }))
        .reverse(),
      topVendedores: topVendedoresData,
      jogosPorTipo: jogos.reduce((acc: Record<string, number>, j: Prisma.Jogo) => {
        const tipoMap: Record<string, string> = {
          rifa: 'Rifas',
          euromilhoes: 'Euromilhões',
          poio_da_vaca: 'Poio da Vaca',
          raspadinha: 'Raspadinhas',
        };
        const tipo = tipoMap[j.tipo] || 'Outros';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {}),
      vendasPorMetodo: participacoes
        .filter((p: Prisma.Participacao) => p.estadoPagamento === 'concluido')
        .reduce((acc: Record<string, number>, p: Prisma.Participacao) => {
          const metodo = p.metodoPagamento || 'dinheiro';
          acc[metodo] = (acc[metodo] || 0) + p.valorPago;
          return acc;
        }, {}),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro no dashboard stats:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}