import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { executeWithRetry } from '@/lib/transaction-retry';
import { processarLevantamentoSchema } from '@/lib/validations';
import { aldeiaScopeDenied } from '@/lib/rbac/aldeia-scope';
import { processarLevantamentoCofre } from '@/lib/cofre-withdrawal';

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
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

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
      include: {
        vault: { select: { id: true, aldeiaId: true } },
        criadoPor: { select: { id: true, nome: true } },
      },
    });
    if (!levantamento) {
      return NextResponse.json({ error: 'Levantamento não encontrado' }, { status: 404 });
    }

    const aldeiaId = levantamento.vault.aldeiaId;
    const scopeDenied = aldeiaScopeDenied(user, aldeiaId);
    if (scopeDenied) return scopeDenied;
    if (levantamento.tipo !== 'levantamento') {
      return NextResponse.json({ error: 'Tipo de transação inválido' }, { status: 400 });
    }
    if (levantamento.estado !== 'pendente') {
      return NextResponse.json({ error: 'Levantamento já foi processado' }, { status: 409 });
    }

    if (levantamento.criadoPorId === user.id) {
      const otherAdmins = await prisma.user.count({
        where: {
          aldeiaId,
          role: { in: ['aldeia_admin', 'super_admin'] },
          deletedAt: null,
          id: { not: user.id },
        },
      });
      if (otherAdmins > 0) {
        return NextResponse.json(
          { error: 'Não pode aprovar o próprio levantamento. Aguarde outro administrador.' },
          { status: 403 }
        );
      }
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    await executeWithRetry(() =>
      prisma.$transaction((tx: Prisma.TransactionClient) =>
        processarLevantamentoCofre(tx, {
          levantamentoId: id,
          acao,
          observacoes,
          actorUserId: user.id,
          aldeiaId,
          ip,
          userAgent,
        })
      )
    );

    /* Notificações fora da transação: uma falha não pode mascarar o commit financeiro. */
    try {
      if (acao === 'confirmar') {
        const vendedores = await prisma.user.findMany({
          where: { aldeiaId, role: 'vendedor', deletedAt: null },
          select: { id: true },
        });
        await prisma.notificacao.createMany({
          data: [
            {
              userId: levantamento.criadoPorId,
              tipo: 'levantamento_confirmado',
              titulo: 'Levantamento aprovado',
              mensagem: `O teu levantamento de ${levantamento.valor.toFixed(2)}€ foi aprovado por ${user.nome}.`,
              lida: false,
            },
            ...vendedores.map((vendedor) => ({
              userId: vendedor.id,
              tipo: 'levantamento_confirmado',
              titulo: 'Levantamento do cofre',
              mensagem: `Foi realizado um levantamento de ${levantamento.valor.toFixed(2)}€ do cofre da aldeia por ${user.nome}. Motivo: ${levantamento.descricao || 'Não especificado'}.`,
              lida: false,
            })),
          ],
        });
      } else {
        await prisma.notificacao.create({
          data: {
            userId: levantamento.criadoPorId,
            tipo: 'levantamento_rejeitado',
            titulo: 'Levantamento rejeitado',
            mensagem: `O teu levantamento de ${levantamento.valor.toFixed(2)}€ foi rejeitado${observacoes ? `: ${observacoes}` : ''}.`,
            lida: false,
          },
        });
      }
    } catch (notificationError) {
      console.error('Falha ao notificar sobre levantamento:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: acao === 'confirmar' ? 'Levantamento confirmado' : 'Levantamento rejeitado',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'LEVANTAMENTO_JA_PROCESSADO') {
      return NextResponse.json({ error: 'Levantamento já foi processado' }, { status: 409 });
    }
    if (message === 'LEVANTAMENTO_NAO_ENCONTRADO') {
      return NextResponse.json({ error: 'Levantamento não encontrado' }, { status: 404 });
    }
    if (message === 'LEVANTAMENTO_FORA_DO_ESCOPO') {
      return NextResponse.json({ error: 'Levantamento fora do âmbito da aldeia' }, { status: 403 });
    }
    if (message === 'SALDO_INSUFICIENTE_COFRE') {
      return NextResponse.json({ error: 'Saldo insuficiente no cofre' }, { status: 409 });
    }
    console.error('Error processing withdrawal:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
