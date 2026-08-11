import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { logAudit } from '@/lib/audit';
import {
  notifyEliminacaoAprovada,
  notifyEliminacaoRejeitada,
} from '@/lib/jogo-audit-notify';
import { aplicarSoftDelete } from '@/lib/eliminacoes';
import type { EliminacaoTipo } from '@/lib/eliminacao-types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST - Aprovar ou rejeitar pedido de eliminação
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const { acao, observacoes } = body;
    if (!acao || !['aprovar', 'rejeitar'].includes(acao)) {
      return NextResponse.json({ error: 'Ação inválida (aprovar ou rejeitar)' }, { status: 400 });
    }

    const pedido = await prisma.pedidoEliminacao.findUnique({ where: { id } });
    if (!pedido) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    if (pedido.estado !== 'pendente') {
      return NextResponse.json({ error: 'Este pedido já foi decidido' }, { status: 409 });
    }

    const isSuperAdmin = user.role === 'super_admin';
    const isAdmin = user.role === 'aldeia_admin';

    // Autorização: super admin decide qualquer pedido; admin de aldeia decide apenas da sua aldeia
    if (!isSuperAdmin) {
      if (!isAdmin || !user.aldeiaId || user.aldeiaId !== pedido.aldeiaId) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
      }
    }

    // Anti auto-aprovação: quem solicitou não pode decidir (exceto super admin)
    if (!isSuperAdmin && pedido.requestedById === user.id) {
      return NextResponse.json({ error: 'Não pode decidir o seu próprio pedido' }, { status: 403 });
    }

    const aldeia = pedido.aldeiaId
      ? await prisma.aldeia.findUnique({ where: { id: pedido.aldeiaId }, select: { nome: true } })
      : null;
    const aldeiaNome = aldeia?.nome;

    if (acao === 'aprovar') {
      const aplicado = await aplicarSoftDelete(pedido.tipo as EliminacaoTipo, pedido.recursoId);
      if (!aplicado) {
        return NextResponse.json({ error: 'Recurso já não existe' }, { status: 404 });
      }

      await prisma.pedidoEliminacao.update({
        where: { id },
        data: { estado: 'aprovado', decidedById: user.id, decidedAt: new Date(), observacoes: observacoes?.trim() || null },
      });

      await logAudit({
        userId: user.id,
        action: 'delete',
        resource: pedido.tipo,
        resourceId: pedido.recursoId,
        metadata: { nome: pedido.recursoNome, pedidoId: pedido.id },
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
      await notifyEliminacaoAprovada({
        tipo: pedido.tipo as EliminacaoTipo,
        recursoNome: pedido.recursoNome,
        aldeiaNome,
        aldeiaId: pedido.aldeiaId || undefined,
        aprovadorNome: user.nome || 'Administrador',
        solicitanteId: pedido.requestedById,
      });

      return NextResponse.json({ success: true, estado: 'aprovado' });
    }

    await prisma.pedidoEliminacao.update({
      where: { id },
      data: { estado: 'rejeitado', decidedById: user.id, decidedAt: new Date(), observacoes: observacoes?.trim() || null },
    });

    await logAudit({
      userId: user.id,
      action: 'delete_reject',
      resource: pedido.tipo,
      resourceId: pedido.recursoId,
      metadata: { nome: pedido.recursoNome, pedidoId: pedido.id, observacoes },
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    await notifyEliminacaoRejeitada({
      tipo: pedido.tipo as EliminacaoTipo,
      recursoNome: pedido.recursoNome,
      aldeiaNome,
      rejeitadorNome: user.nome || 'Administrador',
      solicitanteId: pedido.requestedById,
      observacoes: observacoes?.trim() || undefined,
    });

    return NextResponse.json({ success: true, estado: 'rejeitado' });
  } catch (error) {
    console.error('Erro ao decidir pedido de eliminação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
