import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId') || user.aldeiaId;

    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não especificada' }, { status: 400 });
    }

    const vault = await prisma.vault.findUnique({
      where: { aldeiaId },
      include: {
        transacoes: {
          orderBy: { dataCriacao: 'desc' },
          take: 500,
          select: {
            tipo: true,
            valor: true,
            estado: true,
            dataCriacao: true,
            descricao: true,
          }
        }
      }
    });

    const cashboxes = await prisma.vendedorCashbox.findMany({
      where: {
        user: { aldeiaId, role: { in: ['vendedor', 'aldeia_admin', 'super_admin'] } }
      },
      include: {
        user: { select: { id: true, nome: true, role: true } },
        transacoes: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            tipo: true,
            valor: true,
            createdAt: true,
          }
        }
      }
    });

    const depositos = await prisma.pedidoDepositoCofre.findMany({
      where: { aldeiaId },
      select: {
        valor: true,
        estado: true,
        createdAt: true,
        confirmadoAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const now = new Date();
    const months: Array<{ month: string; depositos: number; levantamentos: number; saldo: number }> = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });

      const vaultTx = (vault?.transacoes || []).filter(tx => {
        const txDate = new Date(tx.dataCriacao);
        return txDate.getMonth() === d.getMonth() &&
               txDate.getFullYear() === d.getFullYear() &&
               tx.estado === 'confirmado';
      });

      const depositosMes = vaultTx
        .filter(tx => tx.tipo === 'deposito')
        .reduce((sum, tx) => sum + tx.valor, 0);

      const levantamentosMes = vaultTx
        .filter(tx => tx.tipo === 'levantamento')
        .reduce((sum, tx) => sum + tx.valor, 0);

      months.push({
        month: monthLabel,
        depositos: depositosMes,
        levantamentos: levantamentosMes,
        saldo: depositosMes - levantamentosMes,
      });
    }

    const totalCashboxSaldo = cashboxes.reduce((sum, cb) => sum + cb.saldo, 0);

    const cashboxPorRole = {
      vendedores: cashboxes.filter(cb => cb.user.role === 'vendedor').reduce((sum, cb) => sum + cb.saldo, 0),
      adminsAldeia: cashboxes.filter(cb => cb.user.role === 'aldeia_admin').reduce((sum, cb) => sum + cb.saldo, 0),
      superAdmins: cashboxes.filter(cb => cb.user.role === 'super_admin').reduce((sum, cb) => sum + cb.saldo, 0),
    };

    const totalDepositosConfirmados = depositos
      .filter(d => d.estado === 'confirmado')
      .reduce((sum, d) => sum + d.valor, 0);

    const totalDepositosPendentes = depositos
      .filter(d => d.estado === 'pendente')
      .reduce((sum, d) => sum + d.valor, 0);

    const totalLevantamentosConfirmados = (vault?.transacoes || [])
      .filter(tx => tx.tipo === 'levantamento' && tx.estado === 'confirmado')
      .reduce((sum, tx) => sum + tx.valor, 0);

    const totalLevantamentosPendentes = (vault?.transacoes || [])
      .filter(tx => tx.tipo === 'levantamento' && tx.estado === 'pendente')
      .reduce((sum, tx) => sum + tx.valor, 0);

    const distribuicaoDinheiro = {
      cofre: vault?.saldo || 0,
      cashboxes: totalCashboxSaldo,
      porRole: cashboxPorRole,
      total: (vault?.saldo || 0) + totalCashboxSaldo,
    };

    const topCashboxes = cashboxes
      .map(cb => ({
        userId: cb.user.id,
        nome: cb.user.nome,
        role: cb.user.role,
        saldo: cb.saldo,
        totalRecebido: cb.transacoes
          .filter(t => t.tipo === 'RECEBIDO_DO_JOGADOR')
          .reduce((sum, t) => sum + t.valor, 0),
        totalDepositado: cb.transacoes
          .filter(t => t.tipo === 'DEPOSITADO_NO_COFRE')
          .reduce((sum, t) => sum + t.valor, 0),
        totalLevantado: cb.transacoes
          .filter(t => t.tipo === 'LEVANTAMENTO_COFRE')
          .reduce((sum, t) => sum + t.valor, 0),
      }))
      .sort((a, b) => b.saldo - a.saldo);

    const ultimasTransacoes = (vault?.transacoes || []).slice(0, 20).map(tx => ({
      tipo: tx.tipo,
      valor: tx.valor,
      descricao: tx.descricao,
      estado: tx.estado,
      data: tx.dataCriacao,
    }));

    return NextResponse.json({
      success: true,
      data: {
        resumo: {
          saldoCofre: vault?.saldo || 0,
          totalCashbox: totalCashboxSaldo,
          totalGeral: distribuicaoDinheiro.total,
          totalDepositosConfirmados,
          totalDepositosPendentes,
          totalLevantamentosConfirmados,
          totalLevantamentosPendentes,
        },
        distribuicaoDinheiro,
        historicoMensal: months,
        topCashboxes,
        ultimasTransacoes,
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
