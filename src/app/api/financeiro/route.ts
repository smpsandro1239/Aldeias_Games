import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId');
    const dataInicio = url.searchParams.get('dataInicio');
    const dataFim = url.searchParams.get('dataFim');
    const tipo = url.searchParams.get('tipo'); // 'resumo', 'transacoes', 'conciliacao'

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

    // Buscar transações (carregamentos de carteira)
    const transacoes = await prisma.transacao.findMany({
      where: {
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        user: aldeiaId ? { aldeiaId } : user.role === 'aldeia_admin' ? { aldeiaId: user.aldeiaId as string } : {},
        tipo: { in: ['carregamento_saldo', 'deposito'] },
      },
      include: {
        user: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Buscar vendas
    const vendas = await prisma.venda.findMany({
      where: {
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        vendedor: aldeiaId ? { aldeiaId } : user.role === 'aldeia_admin' ? { aldeiaId: user.aldeiaId as string } : {},
      },
      include: {
        vendedor: {
          select: { id: true, nome: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Buscar participações pagas
    const participacoes = await prisma.participacao.findMany({
      where: {
        ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        estadoPagamento: 'concluido',
        jogo: { evento: aldeiaFilter },
      },
      select: {
        id: true,
        valorPago: true,
        metodoPagamento: true,
        createdAt: true,
        jogo: {
          select: { nome: true, tipo: true }
        }
      },
    });

    // Calcular totais
    const totalCarregamentos = transacoes
      .filter((t: Prisma.TransacaoGetPayload<{ include: { user: { select: { id: true; nome: true; email: true } } } }>) => (t.tipo === 'carregamento_saldo' || t.tipo === 'deposito') && t.valor > 0)
      .reduce((acc: number, t: Prisma.TransacaoGetPayload<{ include: { user: { select: { id: true; nome: true; email: true } } } }>) => acc + t.valor, 0);

    const totalVendas = vendas.reduce((acc: number, v: Prisma.VendaGetPayload<{ include: { vendedor: { select: { id: true; nome: true } } } }>) => acc + v.valor, 0);
    const totalComissoes = vendas.reduce((acc: number, v: Prisma.VendaGetPayload<{ include: { vendedor: { select: { id: true; nome: true } } } }>) => acc + v.comissao, 0);
    const totalParticipacoes = participacoes.reduce((acc: number, p: { id: string; valorPago: number; metodoPagamento: Prisma.MetodoPagamento; createdAt: Date; jogo: { nome: string; tipo: Prisma.TipoJogo } }) => acc + p.valorPago, 0);

    // Agrupar por método de pagamento
    const porMetodo: Record<string, { carregamentos: number; vendas: number; participacoes: number }> = {};
    
    transacoes.forEach((t: Prisma.TransacaoGetPayload<{ include: { user: { select: { id: true; nome: true; email: true } } } }>) => {
      const metodo = t.metodoPagamento || 'dinheiro';
      if (!porMetodo[metodo]) {
        porMetodo[metodo] = { carregamentos: 0, vendas: 0, participacoes: 0 };
      }
      if ((t.tipo === 'carregamento_saldo' || t.tipo === 'deposito') && t.valor > 0) {
        porMetodo[metodo].carregamentos += t.valor;
      }
    });

    participacoes.forEach((p: { id: string; valorPago: number; metodoPagamento: Prisma.MetodoPagamento; createdAt: Date; jogo: { nome: string; tipo: Prisma.TipoJogo } }) => {
      const metodo = p.metodoPagamento || 'dinheiro';
      if (!porMetodo[metodo]) {
        porMetodo[metodo] = { carregamentos: 0, vendas: 0, participacoes: 0 };
      }
      porMetodo[metodo].participacoes += p.valorPago;
    });

    vendas.forEach((v: Prisma.VendaGetPayload<{ include: { vendedor: { select: { id: true; nome: true } } } }>) => {
      const metodo = v.metodoPagamento || 'dinheiro';
      if (!porMetodo[metodo]) {
        porMetodo[metodo] = { carregamentos: 0, vendas: 0, participacoes: 0 };
      }
      porMetodo[metodo].vendas += v.valor;
    });

    // Calcular reconciliação
    const totalReceitas = totalParticipacoes + totalCarregamentos;
    const diferenca = totalReceitas - totalVendas;

    const data = {
      resumo: {
        totalCarregamentos,
        totalVendas,
        totalComissoes,
        totalParticipacoes,
        totalReceitas,
        diferenca,
        percentagemDiferenca: totalReceitas > 0 ? ((diferenca / totalReceitas) * 100).toFixed(2) : '0',
      },
      porMetodo: Object.entries(porMetodo).map(([metodo, valores]: [string, { carregamentos: number; vendas: number; participacoes: number }]) => ({
        metodo,
        ...valores,
      })),
      transacoesRecentes: transacoes.slice(0, 20).map((t: Prisma.TransacaoGetPayload<{ include: { user: { select: { id: true; nome: true; email: true } } } }>) => ({
        id: t.id,
        tipo: t.tipo,
        valor: t.valor,
        metodo: t.metodoPagamento,
        descricao: t.descricao,
        referencia: t.referencia,
        utilizador: t.user?.nome,
        data: t.createdAt,
      })),
      vendasRecentes: vendas.slice(0, 20).map((v: Prisma.VendaGetPayload<{ include: { vendedor: { select: { id: true; nome: true } } } }>) => ({
        id: v.id,
        valor: v.valor,
        comissao: v.comissao,
        metodo: v.metodoPagamento,
        vendedor: v.vendedor?.nome,
        data: v.createdAt,
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro no financeiro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
