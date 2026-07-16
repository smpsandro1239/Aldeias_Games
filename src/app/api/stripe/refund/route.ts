import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { sanitizeObject } from '@/lib/sanitization';
// @ts-ignore - stripe types
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { participacaoId, valor, motivo } = body;

    if (!participacaoId) {
      return NextResponse.json({ error: 'ID da participação é obrigatório' }, { status: 400 });
    }

    const participacao = await prisma.participacao.findUnique({
      where: { id: participacaoId },
      include: { jogo: true },
    });

    if (!participacao) {
      return NextResponse.json({ error: 'Participação não encontrada' }, { status: 404 });
    }

    if (participacao.estadoPagamento !== 'concluido') {
      return NextResponse.json({ error: 'Participação não foi paga' }, { status: 400 });
    }

    const valorReembolso = valor || participacao.valorPago;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-02-24.acacia',
    });

    let refundId: string | null = null;

    const paymentIntentId = participacao.dadosParticipacao
      ? JSON.parse(participacao.dadosParticipacao).stripePaymentIntent
      : null;

    if (paymentIntentId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: Math.round(valorReembolso * 100),
          reason: 'requested_by_customer',
        });
        refundId = refund.id;
      } catch (stripeError) {
        console.error('Erro ao criar refund no Stripe:', stripeError);
      }
    }

    await prisma.$transaction([
      prisma.participacao.update({
        where: { id: participacaoId },
        data: {
          estadoPagamento: 'reembolsado',
          dadosParticipacao: JSON.stringify(sanitizeObject({
            ...JSON.parse(participacao.dadosParticipacao || '{}'),
            refundId,
            valorReembolso,
            motivo,
            dataReembolso: new Date().toISOString(),
          })),
        },
      }),
      prisma.jogo.update({
        where: { id: participacao.jogoId },
        data: {
          stockAtual: { increment: 1 },
          totalParticipacoes: { decrement: 1 },
          totalAngariado: { decrement: valorReembolso },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Reembolso processado com sucesso',
      refundId,
    });
  } catch (error) {
    console.error('Erro ao processar reembolso:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
