import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { logAudit } from '@/lib/audit';
import { aplicarSoftDelete, ELIMINACAO_TIPOS } from '@/lib/eliminacoes';
import type { EliminacaoTipo } from '@/lib/eliminacao-types';
import {
  notifyEliminacaoSolicitada,
} from '@/lib/jogo-audit-notify';

const TIPOS = ELIMINACAO_TIPOS;

// GET - Listar pedidos de eliminação (super_admin: todos; aldeia_admin: da sua aldeia)
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const isSuperAdmin = user.role === 'super_admin';
    const isAdmin = user.role === 'aldeia_admin';
    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado') || 'pendente';
    const tipo = searchParams.get('tipo');

    const where: any = {};
    if (estado && estado !== 'all') where.estado = estado;
    if (tipo && TIPOS.includes(tipo as EliminacaoTipo)) where.tipo = tipo;
    if (!isSuperAdmin) {
      if (!user.aldeiaId) return NextResponse.json({ pedidos: [], total: 0 });
      where.aldeiaId = user.aldeiaId;
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedidoEliminacao.findMany({
        where,
        include: {
          requestedBy: { select: { id: true, nome: true, email: true } },
          decidedBy: { select: { id: true, nome: true } },
          aldeia: { select: { id: true, nome: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pedidoEliminacao.count({ where }),
    ]);

    return NextResponse.json({ pedidos, total });
  } catch (error) {
    console.error('Erro ao listar pedidos de eliminação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar pedido de eliminação (super_admin auto-aprova; aldeia_admin requer 2ª aprovação)
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const { tipo, recursoId, motivo } = body;

    if (!TIPOS.includes(tipo) || !recursoId || !motivo?.trim()) {
      return NextResponse.json({ error: 'Dados inválidos (tipo, recursoId e motivo são obrigatórios)' }, { status: 400 });
    }

    // Localizar recurso e a sua aldeia
    let recursoNome: string;
    let aldeiaId: string | null = null;

    if (tipo === 'jogo') {
      const jogo = await prisma.jogo.findUnique({ where: { id: recursoId }, include: { evento: true } });
      if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
      recursoNome = jogo.nome;
      aldeiaId = jogo.evento.aldeiaId;
    } else if (tipo === 'evento') {
      const evento = await prisma.evento.findUnique({ where: { id: recursoId } });
      if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
      recursoNome = evento.nome;
      aldeiaId = evento.aldeiaId;
    } else {
      const aldeia = await prisma.aldeia.findUnique({ where: { id: recursoId } });
      if (!aldeia) return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 });
      recursoNome = aldeia.nome;
      aldeiaId = aldeia.id;
    }

    const isSuperAdmin = user.role === 'super_admin';

    // Admin de aldeia só pode eliminar recursos da sua aldeia
    if (!isSuperAdmin) {
      if (!user.aldeiaId || user.aldeiaId !== aldeiaId) {
        return NextResponse.json({ error: 'Não autorizado para este recurso' }, { status: 403 });
      }
    }

    // Verificar pedido pendente existente
    const existente = await prisma.pedidoEliminacao.findFirst({
      where: { tipo, recursoId, estado: 'pendente' },
    });
    if (existente) {
      return NextResponse.json({ error: 'Já existe um pedido pendente para este recurso' }, { status: 409 });
    }

    const aldeiaNome = aldeiaId ? (await prisma.aldeia.findUnique({ where: { id: aldeiaId }, select: { nome: true } }))?.nome : undefined;

    // Super admin: auto-aprovação (pode realizar sozinho)
    if (isSuperAdmin) {
      const aplicado = await aplicarSoftDelete(tipo, recursoId);
      const pedido = await prisma.pedidoEliminacao.create({
        data: {
          tipo,
          recursoId,
          recursoNome,
          aldeiaId,
          motivo: motivo.trim(),
          estado: 'aprovado',
          requestedById: user.id,
          decidedById: user.id,
          decidedAt: new Date(),
          observacoes: aplicado ? 'Eliminação executada automaticamente pelo super administrador' : null,
        },
      });

      await logAudit({
        userId: user.id,
        action: 'delete',
        resource: tipo,
        resourceId: recursoId,
        metadata: { nome: recursoNome, pedidoId: pedido.id, autoAprovado: true },
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
      await notifyEliminacaoSolicitada({
        tipo,
        recursoNome,
        aldeiaNome,
        aldeiaId: aldeiaId || undefined,
        solicitanteNome: user.nome || 'Super administrador',
        motivo: motivo.trim(),
        autoAprovado: true,
      });

      return NextResponse.json({ success: true, autoAprovado: true, pedido });
    }

    // Admin de aldeia: cria pedido pendente (requer 2ª pessoa)
    const pedido = await prisma.pedidoEliminacao.create({
      data: {
        tipo,
        recursoId,
        recursoNome,
        aldeiaId,
        motivo: motivo.trim(),
        estado: 'pendente',
        requestedById: user.id,
      },
    });

    await logAudit({
      userId: user.id,
      action: 'delete_request',
      resource: tipo,
      resourceId: recursoId,
      metadata: { nome: recursoNome, pedidoId: pedido.id },
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });
    await notifyEliminacaoSolicitada({
      tipo,
      recursoNome,
      aldeiaNome,
      aldeiaId: aldeiaId || undefined,
      solicitanteNome: user.nome || 'Administrador',
      motivo: motivo.trim(),
    });

    return NextResponse.json({ success: true, autoAprovado: false, pedido });
  } catch (error) {
    console.error('Erro ao criar pedido de eliminação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
