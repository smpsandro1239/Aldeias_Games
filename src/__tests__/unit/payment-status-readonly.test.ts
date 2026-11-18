// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getFullUserFromRequest: vi.fn(),
  getCheckoutSession: vi.fn(),
  createCheckoutSession: vi.fn(),
  checkPaymentStatus: vi.fn(),
  participacaoFindFirst: vi.fn(),
  participacaoUpdate: vi.fn(),
  participacaoUpdateMany: vi.fn(),
  transacaoFindFirst: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getFullUserFromRequest: mocks.getFullUserFromRequest,
}));

vi.mock('@/lib/stripe', () => ({
  getCheckoutSession: mocks.getCheckoutSession,
  createCheckoutSession: mocks.createCheckoutSession,
  createPaymentIntent: vi.fn(),
}));

vi.mock('@/lib/mbway', () => ({
  checkPaymentStatus: mocks.checkPaymentStatus,
  initiatePayment: vi.fn(),
  normalizePhoneNumber: (value: string) => value,
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    participacao: {
      findFirst: mocks.participacaoFindFirst,
      update: mocks.participacaoUpdate,
      updateMany: mocks.participacaoUpdateMany,
    },
    transacao: {
      findFirst: mocks.transacaoFindFirst,
      create: vi.fn(),
    },
  },
}));

import { POST as postStripePayment, GET as getStripePayment } from '@/app/api/pagamentos/stripe/route';
import { GET as getMbwayPayment } from '@/app/api/pagamentos/mbway/route';

function request(url: string) {
  return { url } as import('next/server').NextRequest;
}

function postRequest(body: unknown) {
  return {
    json: async () => body,
  } as import('next/server').NextRequest;
}

describe('Payment status endpoints are read-only', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getFullUserFromRequest.mockResolvedValue({
      id: 'user-1',
      role: 'user',
    });
  });

  it('Stripe POST derives the participation type on the server and filters client metadata', async () => {
    mocks.createCheckoutSession.mockResolvedValue({
      id: 'cs_new',
      url: 'https://checkout.stripe.test/cs_new',
    });

    const response = await postStripePayment(postRequest({
      valor: 10,
      descricao: 'Participação',
      metadata: {
        jogoId: 'jogo-1',
        participante: 'Nome privado',
        participacaoId: 'participacao-de-outro-utilizador',
        tipo: 'carregamento_saldo',
      },
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.sessionId).toBe('cs_new');
    expect(mocks.participacaoUpdate).not.toHaveBeenCalled();
    expect(mocks.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      metadata: {
        userId: 'user-1',
        tipo: 'participacao',
        jogoId: 'jogo-1',
      },
    }));
  });

  it('Stripe POST rejects ambiguous metadata instead of creating an unprocessable checkout', async () => {
    const response = await postStripePayment(postRequest({
      valor: 10,
      descricao: 'Pagamento sem finalidade',
      metadata: { participante: 'Nome privado' },
    }));

    expect(response.status).toBe(400);
    expect(mocks.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('Stripe GET reports a paid session without changing participation state', async () => {
    mocks.getCheckoutSession.mockResolvedValue({
      id: 'cs_user_1',
      payment_status: 'paid',
      amount_total: 2500,
      currency: 'eur',
      metadata: { userId: 'user-1' },
    });

    const response = await getStripePayment(request(
      'https://example.test/api/pagamentos/stripe?sessionId=cs_user_1'
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('paid');
    expect(body.data.amount).toBe(25);
    expect(mocks.participacaoFindFirst).not.toHaveBeenCalled();
    expect(mocks.participacaoUpdate).not.toHaveBeenCalled();
  });

  it('Stripe GET does not disclose a session owned by another user', async () => {
    mocks.getCheckoutSession.mockResolvedValue({
      id: 'cs_other',
      payment_status: 'paid',
      amount_total: 2500,
      currency: 'eur',
      metadata: { userId: 'user-2' },
    });

    const response = await getStripePayment(request(
      'https://example.test/api/pagamentos/stripe?sessionId=cs_other'
    ));

    expect(response.status).toBe(404);
    expect(mocks.participacaoUpdate).not.toHaveBeenCalled();
  });

  it('MB WAY GET reports completed status without changing participation or wallet', async () => {
    mocks.participacaoFindFirst.mockResolvedValue({
      id: 'participacao-1',
      userId: 'user-1',
      estadoPagamento: 'processando',
    });
    mocks.transacaoFindFirst.mockResolvedValue(null);
    mocks.checkPaymentStatus.mockResolvedValue({
      transactionId: 'mb-123',
      status: 'completed',
      amount: 25,
    });

    const response = await getMbwayPayment(request(
      'https://example.test/api/pagamentos/mbway?transactionId=mb-123'
    ));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.status).toBe('completed');
    expect(mocks.participacaoUpdateMany).not.toHaveBeenCalled();
  });

  it('MB WAY GET rejects a transaction that does not belong to the user', async () => {
    mocks.participacaoFindFirst.mockResolvedValue(null);
    mocks.transacaoFindFirst.mockResolvedValue(null);

    const response = await getMbwayPayment(request(
      'https://example.test/api/pagamentos/mbway?transactionId=mb-other'
    ));

    expect(response.status).toBe(404);
    expect(mocks.checkPaymentStatus).not.toHaveBeenCalled();
  });
});
