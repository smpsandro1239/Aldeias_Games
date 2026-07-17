import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { logAudit } from '@/lib/audit';
import { processarLevantamentoSchema } from '@/lib/validations';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json();
    const validation = processarLevantamentoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { acao, observacoes } = validation.data;

    const levantamento = await prisma.vaultTransaction.findUnique({
      where: { id },
      include: { vault: true, criadoPor: true },
    });

    if (!levantamento) {
      return NextResponse.json({ error: 'Levantamento não encontrado' }, { status: 404 });
    }

    if (levantamento.tipo !== 'levantamento') {
      return NextResponse.json({ error: 'Tipo de transação inválido' }, { status: 400 });
    }

    if (levantamento.estado !== 'pendente') {
      return NextResponse.json({ error: 'Levantamento já foi processado' }, { status: 400 });
    }

    if (levantamento.criadoPorId === user.id) {
      const otherAdmins = await prisma.user.count({
        where: {
          aldeiaId: levantamento.vault.aldeiaId,
          role: { in: ['aldeia_admin', 'super_admin'] },
          deletedAt: null,
          id: { not: user.id },
        },
      });
      if (otherAdmins > 0) {
        return NextResponse.json({ error: 'Não pode aprovar o próprio levantamento. Aguarde outro administrador.' }, { status: 403 });
      }
    }

    if (acao === 'confirmar') {
      if (levantamento.vault.saldo < levantamento.valor) {
        return NextResponse.json({
          error: `Saldo insuficiente no cofre. Disponível: ${levantamento.vault.saldo.toFixed(2)}€`
        }, { status: 400 });
      }

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.vaultTransaction.update({
          where: { id },
          data: {
            estado: 'confirmado',
            aprovadoPorId: user.id,
            dataAprovacao: new Date(),
            observacoes: [
              levantamento.observacoes || null,
              observacoes || null,
              `Aprovado por: ${user.nome}`,
            ].filter(Boolean).join('\n'),
          }
        });

        await tx.vault.update({
          where: { id: levantamento.vaultId },
          data: { saldo: { decrement: levantamento.valor } }
        });
      });

      const ip = request.headers.get('x-forwarded-for') || undefined;
      const userAgent = request.headers.get('user-agent') || undefined;
      logAudit({
        userId: user.id,
        aldeiaId: levantamento.vault.aldeiaId,
        action: 'levantamento.confirmado',
        resource: 'cofre-levantamento',
        resourceId: levantamento.id,
        metadata: {
          valor: levantamento.valor,
          solicitadoPor: levantamento.criadoPor.nome,
          descricao: levantamento.descricao,
        },
        ip,
        userAgent,
      });

      await prisma.notificacao.create({
        data: {
          userId: levantamento.criadoPorId,
          tipo: 'sistema',
          titulo: 'Levantamento aprovado',
          mensagem: `O teu levantamento de ${levantamento.valor.toFixed(2)}€ foi aprovado por ${user.nome}.`,
          lida: false,
        },
      });

      const vendedores = await prisma.user.findMany({
        where: {
          aldeiaId: levantamento.vault.aldeiaId,
          role: 'vendedor',
          deletedAt: null,
        },
        select: { id: true },
      });

      if (vendedores.length > 0) {
        await prisma.notificacao.createMany({
          data: vendedores.map((v: { id: string }) => ({
            userId: v.id,
            tipo: 'sistema' as const,
            titulo: 'Levantamento do cofre',
            mensagem: `Foi realizado um levantamento de ${levantamento.valor.toFixed(2)}€ do cofre da aldeia por ${user.nome}. Motivo: ${levantamento.descricao || 'Não especificado'}.`,
            lida: false,
          })),
        });
      }

      return NextResponse.json({ success: true, message: 'Levantamento confirmado' });
    }

    if (acao === 'rejeitar') {
      await prisma.vaultTransaction.update({
        where: { id },
        data: {
          estado: 'rejeitado',
          aprovadoPorId: user.id,
          dataAprovacao: new Date(),
          observacoes: [
            levantamento.observacoes || null,
            `Rejeitado por: ${user.nome}`,
            observacoes ? `Motivo: ${observacoes}` : null,
          ].filter(Boolean).join('\n'),
        }
      });

      const ip = request.headers.get('x-forwarded-for') || undefined;
      const userAgent = request.headers.get('user-agent') || undefined;
      logAudit({
        userId: user.id,
        aldeiaId: levantamento.vault.aldeiaId,
        action: 'levantamento.rejeitado',
        resource: 'cofre-levantamento',
        resourceId: levantamento.id,
        metadata: {
          valor: levantamento.valor,
          solicitadoPor: levantamento.criadoPor.nome,
          motivo: observacoes || null,
        },
        ip,
        userAgent,
      });

      await prisma.notificacao.create({
        data: {
          userId: levantamento.criadoPorId,
          tipo: 'sistema',
          titulo: 'Levantamento rejeitado',
          mensagem: `O teu levantamento de ${levantamento.valor.toFixed(2)}€ foi rejeitado${observacoes ? `: ${observacoes}` : ''}.`,
          lida: false,
        },
      });

      return NextResponse.json({ success: true, message: 'Levantamento rejeitado' });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
