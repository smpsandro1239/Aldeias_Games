import { NextRequest, NextResponse } from 'next/server';
import { getFullUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logCRUD as logAudit } from '@/lib/audit';

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
         orderBy: { atualizadoEm: 'desc' },
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
       participacoes: participacoes.map((p: any) => ({
         id: p.id,
         jogoId: p.jogoId,
         jogoNome: p.jogo?.nome,
         eventoNome: p.jogo?.evento?.nome,
         numeros: p.dadosParticipacao ? JSON.parse(p.dadosParticipacao).numeros || [] : [],
         valor: p.valorPago,
         ganhou: p.ganhador,
         premiado: p.premioEntregue,
         createdAt: p.createdAt,
       })),
      transacoes: transacoes.map((t: any) => ({
        id: t.id,
        tipo: t.tipo,
        valor: t.valor,
        descricao: t.descricao,
        estado: t.estado,
        createdAt: t.createdAt,
      })),
       vendas: vendas.map((v: any) => ({
         id: v.id,
         valor: v.valor,
         comissao: v.comissao,
         metodoPagamento: v.metodoPagamento,
         createdAt: v.createdAt,
       })),
      badges: badges.map((ub: any) => ({
        id: ub.id,
        badge: {
          id: ub.badge.id,
          nome: ub.badge.nome,
          descricao: ub.badge.descricao,
          raro: ub.badge.raro,
        },
        conquistadoEm: ub.conquistadoEm,
      })),
       levels: levels.map((l: any) => ({
         level: l.nivel,
         xpAtual: l.pontos,
         atribuidoEm: l.atualizadoEm,
       })),
      pushSubscriptions: pushSubs.map((ps: any) => ({
        endpoint: ps.endpoint,
        p256dh: ps.p256dh,
        auth: ps.auth,
      })),
      notificacoes: notificacoes.map((n: any) => ({
        id: n.id,
        titulo: n.titulo,
        mensagem: n.mensagem,
        lida: n.lida,
        createdAt: n.createdAt,
      })),
      pedidosCarregamento: pedidosCarregamento.map((p: any) => ({
        id: p.id,
        valor: p.valor,
        estado: p.estado,
        metodoPagamento: p.metodoPagamento,
        createdAt: p.createdAt,
      })),
      entregasSaldo: entregas.map((e: any) => ({
        id: e.id,
        valor: e.valor,
        estado: e.estado,
        dataSolicitacao: e.dataSolicitacao,
        dataConfirmacao: e.dataConfirmacao,
        dataConclusao: e.dataConclusao,
      })),
       permissoes: permissoes.map((p: any) => ({
         permission: p.permission?.key,
       })),
    };

    return NextResponse.json({ data: exportData });
  } catch (error: any) {
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
         notas: motivo || null,
         estado: 'pendente',
       },
     });

    // Audit log
    await logAudit(
      user.id,
      'delete',
      'user',
      user.id,
      { requestId: deletionRequest.id, motivo },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    // TODO: Notify admin about deletion request
    // Notify admins about new deletion request
    try {
      // Find super admins and aldeia admins (if user belongs to an aldeia)
      const admins = await prisma.user.findMany({
        where: {
          OR: [
            { role: 'super_admin' },
            { role: 'aldeia_admin', aldeiaId: user.aldeiaId }
          ]
        },
        select: { id: true, nome: true, email: true }
      });

      for (const admin of admins) {
        await (prisma.notificacao as any).create({
          data: {
            userId: admin.id,
            tipo: 'sistema',
            titulo: '🗑️ Novo pedido de eliminação de conta',
            mensagem: `Utilizador ${user.nome} (ID: ${user.id}) solicitou eliminação de conta. Motivo: ${motivo || 'Não especificado'}.`,
            estado: 'pendente',
            dadosAdicionais: {
              deletionRequestId: deletionRequest.id,
              userId: user.id,
              userNome: user.nome,
              userEmail: user.email,
              motivo
            }
          }
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar notificação para admins sobre pedido de eliminação:', error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true, data: deletionRequest });
  } catch (error: any) {
    console.error('Erro ao solicitar eliminação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
