import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
      throw new Error('STRIPE_SECRET_KEY é obrigatório em produção');
    }
    stripeInstance = new Stripe(STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = {
  get instance() {
    return getStripe();
  }
};

/**
 * Criar sessão de checkout
 */
export async function createCheckoutSession(
  params: {
    valor: number;
    descricao: string;
    metadata?: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
  }
) {
  const session = await stripe.instance.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: params.descricao,
          },
          unit_amount: Math.round(params.valor * 100), // Converter para cêntimos
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  });

  return session;
}

/**
 * Criar intent de pagamento (para pagamentos customizados)
 */
export async function createPaymentIntent(
  params: {
    valor: number;
    descricao: string;
    metadata?: Record<string, string>;
  }
) {
  const paymentIntent = await stripe.instance.paymentIntents.create({
    amount: Math.round(params.valor * 100),
    currency: 'eur',
    description: params.descricao,
    metadata: params.metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

/**
 * Verificar webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.instance.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Obter sessão de checkout
 */
export async function getCheckoutSession(sessionId: string) {
  return stripe.instance.checkout.sessions.retrieve(sessionId);
}

/**
 * Criar cliente Stripe
 */
export async function createCustomer(
  params: {
    email: string;
    name: string;
    phone?: string;
  }
) {
  return stripe.instance.customers.create(params);
}

/**
 * Criar subscrição
 */
export async function createSubscription(
  params: {
    customerId: string;
    priceId: string;
    metadata?: Record<string, string>;
  }
) {
  return stripe.instance.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    metadata: params.metadata,
  });
}

/**
 * Cancelar subscrição
 */
export async function cancelSubscription(subscriptionId: string) {
  return stripe.instance.subscriptions.cancel(subscriptionId);
}
