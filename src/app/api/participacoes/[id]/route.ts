import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission, requireAnyOfPermissions } from '@/lib/rbac/checkPermission';
import { aldeiaScopeDenied } from '@/lib/rbac/aldeia-scope';

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const participacao = await prisma.participacao.findUnique({
      where: { id },
      include: {
        jogo: { include: { evento: { include: { aldeia: true } } } },
        user: true,
      },
    });

    if (!participacao) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

    // Verificar se o usuário pode ver esta participação
    if (user.role === 'user' && participacao.userId !== user.id) {
       return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({ data: participacao });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requireAnyOfPermissions(user.id, ['MANAGE_ALDEIA', 'EXECUTE_VENDA']);
    if (denied) return denied;

    const body = await request.json();

    const participacao = await prisma.participacao.findUnique({
      where: { id },
      include: { jogo: { select: { evento: { select: { aldeiaId: true } } } } },
    });

    if (!participacao) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Lista de campos permitidos para atualização via admin/vendedor
    const updateData: Prisma.ParticipacaoUpdateInput = {};
    if (body.estadoPagamento) updateData.estadoPagamento = body.estadoPagamento;
    if (body.revelado !== undefined) updateData.revelado = body.revelado;

    // Entrega de prémio: operação sensível, exclusiva de quem gere a aldeia
    if (body.premioEntregue !== undefined) {
      const adminDenied = await requirePermission(user.id, 'MANAGE_ALDEIA');
      if (adminDenied) return adminDenied;

      const scopeDenied = aldeiaScopeDenied(user, participacao.jogo.evento?.aldeiaId);
      if (scopeDenied) return scopeDenied;

      if (body.premioEntregue === true) {
        if (!participacao.ganhador) {
          return NextResponse.json({ error: 'Esta participação não é vencedora' }, { status: 400 });
        }
        if (participacao.premioEntregue) {
          return NextResponse.json({ error: 'O prémio desta participação já foi entregue' }, { status: 400 });
        }
        const metodoEntrega = typeof body.metodoEntrega === 'string' ? body.metodoEntrega.trim() : '';
        const observacoes = typeof body.observacoes === 'string' ? body.observacoes.trim() : '';
        if (!metodoEntrega) {
          return NextResponse.json({ error: 'Indique o método de entrega (ex.: presencial, correio)' }, { status: 400 });
        }
        if (observacoes.length < 3) {
          return NextResponse.json({ error: 'Indique uma observação (mínimo 3 caracteres) para registar na auditoria' }, { status: 400 });
        }

        updateData.premioEntregue = true;
        await prisma.alteracaoParticipacao.create({
          data: {
            participacaoId: id,
            userId: user.id,
            tipoAlteracao: 'entrega_premio',
            dadosAnteriores: JSON.stringify({ premioEntregue: false }),
            motivo: `Entrega do prémio registada por ${user.nome}. Método: ${metodoEntrega}. Observações: ${observacoes}`,
            ip,
          },
        });
      } else {
        if (!participacao.premioEntregue) {
          return NextResponse.json({ error: 'O prémio desta participação ainda não foi entregue' }, { status: 400 });
        }
        updateData.premioEntregue = false;
        await prisma.alteracaoParticipacao.create({
          data: {
            participacaoId: id,
            userId: user.id,
            tipoAlteracao: 'desfazer_entrega_premio',
            dadosAnteriores: JSON.stringify({ premioEntregue: true }),
            motivo: `Entrega do prémio anulada por ${user.nome}${typeof body.observacoes === 'string' && body.observacoes.trim() ? `: ${body.observacoes.trim()}` : ''}`,
            ip,
          },
        });
      }
    }

    const updated = await prisma.participacao.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erro ao atualizar participação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    await prisma.participacao.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
