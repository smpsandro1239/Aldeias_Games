import { NextRequest, NextResponse } from 'next/server';
import { getFullUserFromRequest } from '@/lib/auth';
import { stripePaymentSchema } from '@/lib/validations';
import { createCheckoutSession, createPaymentIntent } from '@/lib/stripe';
import { prisma } from '@/lib/db';

// POST - Criar sessão de checkout Stripe
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = stripePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { valor, descricao, metadata } = validation.data;

    // Criar sessão de checkout
    const session = await createCheckoutSession({
      valor,
      descricao,
      metadata: {
        ...metadata,
        userId: user.id,
      },
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pagamento/cancelado`,
    });

    // Se há uma participação associada, atualizar referência
    if (metadata?.participacaoId) {
      await prisma.participacao.update({
        where: { id: metadata.participacaoId },
        data: {
          referenciaPagamento: session.id,
          estadoPagamento: 'processando',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error('Erro no pagamento Stripe:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Verificar estado do pagamento
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID é obrigatório' },
        { status: 400 }
      );
    }

    const { getCheckoutSession } = await import('@/lib/stripe');
    const session = await getCheckoutSession(sessionId);

    // Atualizar participação se pagamento concluído
    if (session.payment_status === 'paid') {
      const participacao = await prisma.participacao.findFirst({
        where: { referenciaPagamento: sessionId },
      });

      if (participacao && participacao.estadoPagamento !== 'concluido') {
        await prisma.participacao.update({
          where: { id: participacao.id },
          data: {
            estadoPagamento: 'concluido',
            dataPagamento: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.payment_status,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar pagamento Stripe:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
