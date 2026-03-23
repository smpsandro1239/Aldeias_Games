import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Signature em falta' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET não configurado');
      return NextResponse.json({ error: 'Configuração em falta' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err) {
      console.error('Erro verificar signature:', err);
      return NextResponse.json({ error: 'Signature inválida' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, jogoId, eventoId, tipo } = session.metadata || {};

        if (tipo === 'participacao' && jogoId) {
          const valor = session.amount_total ? session.amount_total / 100 : 0;

          await prisma.participacao.create({
            data: {
              jogoId,
              userId: userId || null,
              valorPago: valor,
              metodoPagamento: 'stripe',
              estadoPagamento: 'concluido',
              dadosParticipacao: JSON.stringify({
                stripeSessionId: session.id,
                stripePaymentIntent: session.payment_intent,
              }),
            },
          });

          if (eventoId) {
            await prisma.jogo.update({
              where: { id: jogoId },
              data: {
                stockAtual: { decrement: 1 },
                totalParticipacoes: { increment: 1 },
                totalAngariado: { increment: valor },
              },
            });
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook Stripe:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
