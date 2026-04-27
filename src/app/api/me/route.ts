import { NextRequest, NextResponse } from 'next/server';
import { getFullUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';

/**
 * GET /api/me
 * Returns current user profile with all related data (for export)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Fetch all user-related data
    const [
      participacoes,
      transacoes,
      vendas,
      badges,
      levels,
      pushSubs,
      notificacoes,
      pedidosCarregamento,
      entregas,
      permissoes
    ] = await Promise.all([
      prisma.participacao.findMany({
        where: { userId: user.id },
        include: { jogo: { include: { evento: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      prisma.transacao.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      prisma.venda.findMany({
        where: { vendedorId: user.id },
        include: { jogo: { include: { evento: true } } },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      prisma.userBadge.findMany({
        where: { userId: user.id },
        include: { badge: true },
        orderBy: { conquistadoEm: 'desc' },
      }),
      prisma.userLevel.findMany({
        where: { userId: user.id },
        orderBy: { atribuidoEm: 'desc' },
      }),
      prisma.pushSubscription.findMany({
        where: { userId: user.id },
      }),
      prisma.notificacao.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.pedidoCarregamento.findMany({
        where: { vendedorId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.entregaSaldo.findMany({
        where: { vendedorId: user.id },
        orderBy: { dataSolicitacao: 'desc' },
      }),
      prisma.userPermission.findMany({
        where: { userId: user.id },
        include: { permission: true },
      }),
    ]);

    // Compile data
    const exportData = {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        role: user.role,
        saldo: user.saldo,
        comissaoPercentual: user.comissaoPercentual,
        comissaoTotal: user.comissaoTotal,
        emailVerificado: user.emailVerificado,
        notificacoesEmail: user.notificacoesEmail,
        aldeiaId: user.aldeiaId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      participacoes: participacoes.map(p => ({
        id: p.id,
        jogoId: p.jogoId,
        jogoNome: p.jogo?.nome,
        eventoNome: p.jogo?.evento?.nome,
        numeros: p.numeros,
        valor: p.valor,
        ganhou: p.ganhou,
        premiado: p.premiado,
        createdAt: p.createdAt,
      })),
      transacoes: transacoes.map(t => ({
        id: t.id,
        tipo: t.tipo,
        valor: t.valor,
        descricao: t.descricao,
        estado: t.estado,
        createdAt: t.createdAt,
      })),
      vendas: vendas.map(v => ({
        id: v.id,
        jogoId: v.jogoId,
        jogoNome: v.jogo?.nome,
        eventoNome: v.jogo?.evento?.nome,
        valor: v.valor,
        comissao: v.comissao,
        metodoPagamento: v.metodoPagamento,
        createdAt: v.createdAt,
      })),
      badges: badges.map(ub => ({
        id: ub.id,
        badge: {
          id: ub.badge.id,
          nome: ub.badge.nome,
          descricao: ub.badge.descricao,
          raro: ub.badge.raro,
        },
        conquistadoEm: ub.conquistadoEm,
      })),
      levels: levels.map(l => ({
        level: l.level,
        xpAtual: l.xpAtual,
        atribuidoEm: l.atribuidoEm,
      })),
      pushSubscriptions: pushSubs.map(ps => ({
        endpoint: ps.endpoint,
        p256dh: ps.p256dh,
        auth: ps.auth,
      })),
      notificacoes: notificacoes.map(n => ({
        id: n.id,
        titulo: n.titulo,
        mensagem: n.mensagem,
        lida: n.lida,
        createdAt: n.createdAt,
      })),
      pedidosCarregamento: pedidosCarregamento.map(p => ({
        id: p.id,
        valor: p.valor,
        estado: p.estado,
        metodoPagamento: p.metodoPagamento,
        createdAt: p.createdAt,
      })),
      entregasSaldo: entregas.map(e => ({
        id: e.id,
        valor: e.valor,
        estado: e.estado,
        dataSolicitacao: e.dataSolicitacao,
        dataConfirmacao: e.dataConfirmacao,
        dataConclusao: e.dataConclusao,
      })),
      permissoes: permissoes.map(p => ({
        permission: p.permission?.nome,
      })),
    };

    return NextResponse.json({ data: exportData });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

/**
 * POST /api/me/request-deletion
 * User requests account deletion (GDPR right to erasure)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { motivo } = body;

    // Check if there's already a pending request
    const existing = await prisma.direitoEsquecimento.findFirst({
      where: { userId: user.id, estado: 'pendente' },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Já existe um pedido de eliminação pendente. Aguarde processamento.' },
        { status: 400 }
      );
    }

    // Create deletion request
    const deletionRequest = await prisma.direitoEsquecimento.create({
      data: {
        userId: user.id,
        motivo: motivo || null,
        estado: 'pendente',
      },
    });

    // Audit log
    await logAudit(
      user.id,
      'delete',
      'user_account_request',
      user.id,
      null,
      { requestId: deletionRequest.id, motivo },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    // TODO: Notify admin about deletion request

    return NextResponse.json({ success: true, data: deletionRequest });
  } catch (error) {
    console.error('Erro ao solicitar eliminação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
