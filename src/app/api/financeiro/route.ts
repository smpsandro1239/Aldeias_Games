import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { getPaginationFromRequest, createPagination, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId');
    const dataInicio = url.searchParams.get('dataInicio');
    const dataFim = url.searchParams.get('dataFim');
    const { page, limit } = getPaginationFromRequest(request);

    let aldeiaFilter = {};
    if (user.role === 'aldeia_admin' && user.aldeiaId) {
      aldeiaFilter = { aldeiaId: user.aldeiaId };
    } else if (aldeiaId) {
      aldeiaFilter = { aldeiaId };
    }

    const dateFilter: Record<string, unknown> = {};
    if (dataInicio) dateFilter.gte = new Date(dataInicio);
    if (dataFim) dateFilter.lte = new Date(dataFim);
    const hasDateFilter = dataInicio || dataFim;

    const userWhere = aldeiaId ? { aldeiaId } : user.role === 'aldeia_admin' ? { aldeiaId: user.aldeiaId as string } : {};

    const { skip, take } = createPagination(page, limit);

    const [transacoesRaw, vendasRaw, participacoesRaw, totalTransacoes, totalVendasCount] = await Promise.all([
      any.findMany({
        where: {
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          user: userWhere,
          tipo: { in: ['carregamento_saldo', 'deposito'] },
        },
        include: { user: { select: { id: true, nome: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      any.findMany({
        where: {
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          vendedor: aldeiaId ? { aldeiaId } : user.role === 'aldeia_admin' ? { aldeiaId: user.aldeiaId as string } : {},
        },
        include: { vendedor: { select: { id: true, nome: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      any.findMany({
        where: {
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          estadoPagamento: 'concluido',
          jogo: { evento: aldeiaFilter },
        },
        select: {
          id: true, valorPago: true, metodoPagamento: true, createdAt: true,
          jogo: { select: { nome: true, tipo: true } },
        },
      }),
      any.count({
        where: {
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          user: userWhere,
          tipo: { in: ['carregamento_saldo', 'deposito'] },
        },
      }),
      any.count({
        where: {
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
          vendedor: aldeiaId ? { aldeiaId } : user.role === 'aldeia_admin' ? { aldeiaId: user.aldeiaId as string } : {},
        },
      }),
    ]);

    const totalCarregamentos = transacoesRaw
      .filter((t) => (t.tipo === 'carregamento_saldo' || t.tipo === 'deposito') && t.valor > 0)
      .reduce((acc, t) => acc + t.valor, 0);

    const totalVendas = vendasRaw.reduce((acc, v) => acc + v.valor, 0);
    const totalComissoes = vendasRaw.reduce((acc, v) => acc + v.comissao, 0);
    const totalParticipacoes = participacoesRaw.reduce((acc, p) => acc + p.valorPago, 0);

    const porMetodo: Record<string, { carregamentos: number; vendas: number; participacoes: number }> = {};

    transacoesRaw.forEach((t) => {
      const metodo = t.metodoPagamento || 'dinheiro';
      if (!porMetodo[metodo]) porMetodo[metodo] = { carregamentos: 0, vendas: 0, participacoes: 0 };
      if ((t.tipo === 'carregamento_saldo' || t.tipo === 'deposito') && t.valor > 0) porMetodo[metodo].carregamentos += t.valor;
    });

    participacoesRaw.forEach((p) => {
      const metodo = p.metodoPagamento || 'dinheiro';
      if (!porMetodo[metodo]) porMetodo[metodo] = { carregamentos: 0, vendas: 0, participacoes: 0 };
      porMetodo[metodo].participacoes += p.valorPago;
    });

    vendasRaw.forEach((v) => {
      const metodo = v.metodoPagamento || 'dinheiro';
      if (!porMetodo[metodo]) porMetodo[metodo] = { carregamentos: 0, vendas: 0, participacoes: 0 };
      porMetodo[metodo].vendas += v.valor;
    });

    const totalReceitas = totalParticipacoes + totalCarregamentos;
    const diferenca = totalReceitas - totalVendas;

    const transacoesRecentes = transacoesRaw.slice(skip, skip + take);
    const vendasRecentes = vendasRaw.slice(skip, skip + take);

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
      porMetodo: Object.entries(porMetodo).map(([metodo, valores]) => ({
        metodo,
        ...valores,
      })),
      transacoes: createPaginatedResponse(
        transacoesRecentes.map((t) => ({
          id: t.id, tipo: t.tipo, valor: t.valor, metodo: t.metodoPagamento,
          descricao: t.descricao, referencia: t.referencia, utilizador: t.user?.nome, data: t.createdAt,
        })),
        totalTransacoes,
        page,
        limit,
      ),
      vendas: createPaginatedResponse(
        vendasRecentes.map((v) => ({
          id: v.id, valor: v.valor, comissao: v.comissao, metodo: v.metodoPagamento,
          vendedor: v.vendedor?.nome, data: v.createdAt,
        })),
        totalVendasCount,
        page,
        limit,
      ),
    };

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro no financeiro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
