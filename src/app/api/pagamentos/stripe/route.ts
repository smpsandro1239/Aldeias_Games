import { NextRequest, NextResponse } from 'next/server';
import { getFullUserFromRequest } from '@/lib/auth';
import { stripePaymentSchema } from '@/lib/validations';
import { createCheckoutSession, createPaymentIntent } from '@/lib/stripe';

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
    const isParticipation = Boolean(metadata?.jogoId);
    const isWalletTopup = !isParticipation && metadata?.tipo === 'carregamento_saldo';

    if (!isParticipation && !isWalletTopup) {
      return NextResponse.json(
        { error: 'O tipo de pagamento não pôde ser determinado' },
        { status: 400 }
      );
    }

    // Só são enviados metadados operacionais necessários ao webhook.
    // Campos arbitrários do cliente (incluindo dados pessoais) não são propagados.
    const checkoutMetadata: Record<string, string> = {
      userId: user.id,
      tipo: isParticipation ? 'participacao' : 'carregamento_saldo',
    };
    if (isParticipation && metadata?.jogoId) checkoutMetadata.jogoId = metadata.jogoId;
    if (metadata?.eventoId) checkoutMetadata.eventoId = metadata.eventoId;
    if (metadata?.numeros) checkoutMetadata.numeros = metadata.numeros;

    // Criar sessão de checkout
    const session = await createCheckoutSession({
      valor,
      descricao,
      metadata: checkoutMetadata,
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/pagamento/cancelado`,
    });

    // A participação é criada/associada pelo fluxo de domínio; este endpoint
    // não aceita IDs arbitrários de participação enviados em metadata.

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

    // Consulta read-only: o webhook assinado processa participação, stock e cashback.
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
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
