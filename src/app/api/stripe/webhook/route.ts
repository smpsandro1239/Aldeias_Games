import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/stripe';
// @ts-ignore - stripe types
import Stripe from 'stripe';
import crypto from 'crypto';

interface RaspadinhaPremio {
  nome: string;
  valor?: number;
  percentagem?: number;
  valorDinheiroAlternative?: number;
}

interface RaspadinhaConfig {
  premios: RaspadinhaPremio[];
  [key: string]: unknown;
}

interface RaspadinhaOutcome {
  hasWin: boolean;
  winningPrize: RaspadinhaPremio | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature) return NextResponse.json({ error: 'Signature em falta' }, { status: 400 });
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return NextResponse.json({ error: 'Configuração em falta' }, { status: 500 });

    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (err) {
      return NextResponse.json({ error: 'Signature inválida' }, { status: 400 });
    }

    const existingEvent = await prisma.transacao.findFirst({
      where: { referencia: event.id },
    });
    if (existingEvent) return NextResponse.json({ received: true });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, jogoId, eventoId, tipo, numeros } = session.metadata || {};

        if (tipo === 'participacao' && jogoId) {
          const valorTotal = session.amount_total ? session.amount_total / 100 : 0;
          const jogo = await prisma.jogo.findUnique({ where: { id: jogoId } });
          if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });

          const numerosArray = numeros ? (typeof numeros === 'string' ? JSON.parse(numeros) : numeros) : [];
          const qty = Array.isArray(numerosArray) && numerosArray.length > 0 ? numerosArray.length : 1;
          const precoUnitario = valorTotal / qty;

          const existingParticipacao = await prisma.participacao.findFirst({
            where: { dadosParticipacao: { contains: session.id } },
          });
          if (existingParticipacao) return NextResponse.json({ received: true });

          for (let i = 0; i < qty; i++) {
            const timestamp = new Date().toISOString();
            const seed = crypto.randomBytes(16).toString('hex');
            const uniqueSalt = crypto.randomBytes(16).toString('hex');
            let resultadoRaspe = null, hashParticipacao = null;
            let grid: RaspadinhaPremio[] | null = null;

            if (jogo.tipo === 'raspadinha') {
              const config: RaspadinhaConfig = typeof jogo.configuracao === 'string' ? JSON.parse(jogo.configuracao) : jogo.configuracao as RaspadinhaConfig;
              const outcome = determineRaspadinhaOutcome(config);
              grid = buildGridFromOutcome(outcome, config);
              resultadoRaspe = outcome.hasWin ? (outcome.winningPrize?.nome || 'no_win') : 'no_win';
              hashParticipacao = generateHash(seed, resultadoRaspe, uniqueSalt, timestamp);
            } else if (jogo.tipo === 'rifa') {
              const num = Array.isArray(numerosArray) ? numerosArray[i] : null;
              resultadoRaspe = num ? num.toString() : null;
              hashParticipacao = generateHash(seed, resultadoRaspe || 'rifa', uniqueSalt, timestamp);
            }

            const p = await prisma.participacao.create({
              data: {
                jogoId, userId: userId || null, valorPago: precoUnitario, metodoPagamento: 'stripe',
                estadoPagamento: 'concluido', dataPagamento: new Date(), seedRaspe: seed, hashRaspe: hashParticipacao,
                resultadoRaspe, hashParticipacao,
                dadosParticipacao: JSON.stringify({
                  stripeSessionId: session.id, stripePaymentIntent: session.payment_intent, stripeEventId: event.id,
                  index: i, grid, numeros: jogo.tipo !== 'raspadinha' ? [numerosArray[i]] : undefined
                }),
              },
            });

            if ((jogo.tipo === 'rifa') && Array.isArray(numerosArray) && numerosArray[i]) {
              await prisma.numeroVendido.create({
                data: { jogoId, numero: parseInt(numerosArray[i]), participacaoId: p.id }
              });
            }
          }

          await prisma.jogo.update({
            where: { id: jogoId },
            data: { stockAtual: { decrement: qty }, totalParticipacoes: { increment: qty }, totalAngariado: { increment: valorTotal } },
          });

          if (jogo.eventoId) {
            await prisma.evento.update({
              where: { id: jogo.eventoId },
              data: { totalParticipacoes: { increment: qty }, totalAngariado: { increment: valorTotal } },
            });
          }

          if (userId) {
            const cashbackValor = valorTotal * 0.05;
            await prisma.user.update({ where: { id: userId }, data: { saldo: { increment: cashbackValor } } });
            await prisma.transacao.create({
              data: { userId, valor: cashbackValor, tipo: 'cashback', descricao: `Cashback Stripe: ${jogo.nome}`, referencia: session.id }
            });
          }
        }

        if (tipo === 'carregamento_saldo' && userId) {
          const valor = session.amount_total ? session.amount_total / 100 : 0;
          await prisma.user.update({ where: { id: userId }, data: { saldo: { increment: valor } } });
          await prisma.transacao.create({
            data: { userId, valor, tipo: 'carregamento_saldo', descricao: 'Carregamento Stripe', referencia: session.id }
          });
        }
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

function generateHash(seed: string, resultado: string, salt: string, timestamp?: string): string {
  const data = `${seed}:${resultado}:${salt}${timestamp ? `:${timestamp}` : ''}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function determineRaspadinhaOutcome(config: RaspadinhaConfig): RaspadinhaOutcome {
  const premios = config.premios || [];
  const rollInt = crypto.randomInt(0, 10000);
  let cumulativeBp = 0;
  for (const premio of premios) {
    cumulativeBp += Math.round((premio.percentagem || 0) * 100);
    if (rollInt < cumulativeBp) return { hasWin: true, winningPrize: premio };
  }
  return { hasWin: false, winningPrize: null };
}

function buildGridFromOutcome(outcome: RaspadinhaOutcome, config: RaspadinhaConfig): RaspadinhaPremio[] {
  const premios = config.premios || [];
  const grid: RaspadinhaPremio[] = [];
  if (outcome.hasWin && outcome.winningPrize) {
    for (let i = 0; i < 3; i++) grid.push({ ...outcome.winningPrize });
    const fillerPool = premios.filter((p) => p.nome !== outcome.winningPrize!.nome).length > 0
      ? premios.filter((p) => p.nome !== outcome.winningPrize!.nome) : premios;
    for (let i = 0; i < 6; i++) grid.push({ ...fillerPool[crypto.randomInt(0, fillerPool.length)] });
  } else {
    for (let i = 0; i < 9; i++) grid.push({ ...premios[crypto.randomInt(0, premios.length)] });
  }
  for (let i = grid.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  return grid;
}
