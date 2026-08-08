import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/stripe";
import { sanitizeObject } from "@/lib/sanitization";
import { claimWebhookEvent, completeWebhookEvent } from "@/lib/webhook-helpers";
// @ts-ignore - stripe types
import Stripe from "stripe";
import crypto from "crypto";

// Reuse the shared raspadinha logic (determines outcome + builds grid)
import {
  determineRaspadinhaOutcome,
  buildGridFromOutcome,
} from "@/app/api/participacoes/_lib/raspadinha";

// Minimal types needed for the shared functions
interface RaspadinhaConfig {
  premios: Array<{
    nome: string;
    percentagem?: number;
    valorDinheiroAlternative?: number;
  }>;
  maxGanhadores?: number;
  maxPremioTotal?: number;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature)
      return NextResponse.json(
        { error: "Signature em falta" },
        { status: 400 }
      );
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret)
      return NextResponse.json(
        { error: "Configuração em falta" },
        { status: 500 }
      );

    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch {
      return NextResponse.json(
        { error: "Signature inválida" },
        { status: 400 }
      );
    }

    // IDEMPOTENCY: Atomic claim via WebhookEvent unique constraint
    const isFirstTime = await claimWebhookEvent("stripe", event.id);
    if (!isFirstTime) {
      return NextResponse.json({ received: true, status: "duplicate" });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const { userId, jogoId, eventoId, tipo, numeros } =
            session.metadata || {};

          if (tipo === "participacao" && jogoId) {
            await processParticipacao(session, event, userId, jogoId, numeros);
          }

          if (tipo === "carregamento_saldo" && userId) {
            await processCarregamento(session, userId);
          }
          break;
        }
      }

      await completeWebhookEvent("stripe", event.id, "completed");
      return NextResponse.json({ received: true });
    } catch (error) {
      await completeWebhookEvent("stripe", event.id, "failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  } catch (error) {
    console.error("Stripe webhook error:", error);
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const Sentry = await import("@sentry/nextjs");
        Sentry.captureException(error, { tags: { area: "stripe-webhook" } });
      } catch {}
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
async function processParticipacao(
  session: Stripe.Checkout.Session,
  event: Stripe.Event,
  userId: string | undefined,
  jogoId: string,
  numeros: string | undefined
) {
  const valorTotal = session.amount_total ? session.amount_total / 100 : 0;

  // Atomicidade: participações + stock + evento + cashback numa única transação
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const jogo = await tx.jogo.findUnique({ where: { id: jogoId } });
    if (!jogo) throw new Error(`Jogo ${jogoId} not found`);

    const numerosArray = numeros
      ? typeof numeros === "string"
        ? JSON.parse(numeros)
        : numeros
      : [];
    const qty =
      Array.isArray(numerosArray) && numerosArray.length > 0
        ? numerosArray.length
        : 1;
    const precoUnitario = valorTotal / qty;

    // Guard anti-stock (raça com vendas diretas / outros checkouts concorrentes)
    const stockUpdated = await tx.jogo.updateMany({
      where: { id: jogoId, stockAtual: { gte: qty } },
      data: {
        stockAtual: { decrement: qty },
        totalParticipacoes: { increment: qty },
        totalAngariado: { increment: valorTotal },
      },
    });
    if (stockUpdated.count === 0) throw new Error(`Stock insuficiente (${jogoId})`);

    for (let i = 0; i < qty; i++) {
      const timestamp = new Date().toISOString();
      const seed = crypto.randomBytes(16).toString("hex");
      const uniqueSalt = crypto.randomBytes(16).toString("hex");
      let resultadoRaspe: string | null = null;
      let hashParticipacao: string | null = null;

      let grid: Array<{
        nome: string;
        valorDinheiroAlternative?: number;
      }> | null = null;
      let dadosExtra: Record<string, unknown> = {};

      if (jogo.tipo === "raspadinha") {
        const config: RaspadinhaConfig =
          typeof jogo.configuracao === "string"
            ? JSON.parse(jogo.configuracao)
            : (jogo.configuracao as RaspadinhaConfig);
        const outcome = determineRaspadinhaOutcome(config);
        grid = buildGridFromOutcome(outcome, config);
        resultadoRaspe = outcome.hasWin
          ? outcome.winningPrize?.nome || "sem_premio"
          : "sem_premio";
        hashParticipacao = generateHash(seed, resultadoRaspe, uniqueSalt, timestamp);
        dadosExtra = {
          hasWin: outcome.hasWin,
          winningPrize: outcome.winningPrize,
          roll: outcome.roll,
        };
      } else if (jogo.tipo === "rifa") {
        const num = Array.isArray(numerosArray) ? numerosArray[i] : null;
        resultadoRaspe = num ? num.toString() : null;
        hashParticipacao = generateHash(
          seed,
          resultadoRaspe || "rifa",
          uniqueSalt,
          timestamp
        );
      }

      const p = await tx.participacao.create({
        data: {
          jogoId,
          userId: userId || null,
          valorPago: precoUnitario,
          metodoPagamento: "stripe",
          estadoPagamento: "concluido",
          dataPagamento: new Date(),
          seedRaspe: seed,
          hashRaspe: hashParticipacao,
          resultadoRaspe,
          hashParticipacao,
          dadosParticipacao: JSON.stringify(
            sanitizeObject({
              stripeSessionId: session.id,
              stripePaymentIntent: session.payment_intent,
              stripeEventId: event.id,
              index: i,
              grid,
              numeros:
                jogo.tipo !== "raspadinha" ? [numerosArray[i]] : undefined,
              ...dadosExtra,
            })
          ),
        },
      });

      if (
        jogo.tipo === "rifa" &&
        Array.isArray(numerosArray) &&
        numerosArray[i]
      ) {
        await tx.numeroVendido.create({
          data: {
            jogoId,
            numero: parseInt(numerosArray[i]),
            participacaoId: p.id,
          },
        });
      }
    }

    if (jogo.eventoId) {
      await tx.evento.update({
        where: { id: jogo.eventoId },
        data: {
          totalParticipacoes: { increment: qty },
          totalAngariado: { increment: valorTotal },
        },
      });
    }

    if (userId) {
      const cashbackValor = valorTotal * 0.05;
      await tx.user.update({
        where: { id: userId },
        data: { saldo: { increment: cashbackValor } },
      });
      await tx.transacao.create({
        data: {
          userId,
          valor: cashbackValor,
          tipo: "cashback",
          descricao: `Cashback Stripe: ${jogo.nome}`,
          referencia: session.id,
        },
      });
    }
  });
}

async function processCarregamento(
  session: Stripe.Checkout.Session,
  userId: string
) {
  const valor = session.amount_total ? session.amount_total / 100 : 0;

  // Atomicidade: credita saldo + cria transação numa só operação
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existing = await tx.transacao.findFirst({
      where: { referencia: session.id, tipo: "carregamento_saldo" },
    });
    if (existing) return;

    await tx.user.update({
      where: { id: userId },
      data: { saldo: { increment: valor } },
    });
    await tx.transacao.create({
      data: {
        userId,
        valor,
        tipo: "carregamento_saldo",
        descricao: "Carregamento Stripe",
        referencia: session.id,
        dadosAdicionais: { stripeSessionId: session.id },
      },
    });
  });
}

function generateHash(
  seed: string,
  resultado: string,
  salt: string,
  timestamp?: string
): string {
  const data = `${seed}:${resultado}:${salt}${timestamp ? `:${timestamp}` : ""}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}
