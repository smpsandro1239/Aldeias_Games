import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  processWebhookCallback,
  validateWebhookSignature,
} from "@/lib/mbway";
import { claimWebhookEvent, completeWebhookEvent } from "@/lib/webhook-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-mbway-signature");
    const webhookSecret = process.env.MBWAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { error: "Signature MBWay obrigatória" },
          { status: 400 }
        );
      }
      const isValid = validateWebhookSignature(
        JSON.stringify(body),
        signature,
        webhookSecret
      );
      if (!isValid) {
        return NextResponse.json(
          { error: "Signature MBWay inválida" },
          { status: 400 }
        );
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Configuração MBWay em falta" },
          { status: 500 }
        );
      }
    }

    const result = processWebhookCallback(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // IDEMPOTENCY: Atomic claim via WebhookEvent unique constraint
    const isFirstTime = await claimWebhookEvent(
      "mbway",
      result.transactionId,
      body?.Entity_ClientPhone?.tipo || body?.dados?.tipo || body?.metadata?.tipo || undefined
    );
    if (!isFirstTime) {
      return NextResponse.json({ received: true, status: "duplicate" });
    }

    try {
      const dados = body?.Entity_ClientPhone || body?.dados || body;
      const tipoTransacao = dados?.tipo || dados?.metadata?.tipo;

      if (tipoTransacao === "carregamento_saldo") {
        await processCarregamento(result.transactionId);
      } else {
        await processParticipacao(result.transactionId);
      }

      await completeWebhookEvent("mbway", result.transactionId, "completed");
      return NextResponse.json({ received: true });
    } catch (error) {
      await completeWebhookEvent("mbway", result.transactionId, "failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  } catch (error) {
    console.error("MBWay webhook error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function processCarregamento(transactionId: string) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const c = await tx.transacao.findFirst({
      where: {
        tipo: "carregamento_saldo",
        dadosAdicionais: {
          path: "$.transactionId",
          equals: transactionId,
        },
      },
    });

    if (!c) return;
    if ((c.dadosAdicionais as Record<string, unknown>)?.estado === "concluido")
      return; // already processed

    // Mark as confirmed atomically
    const dadosOld = c.dadosAdicionais as Record<string, unknown> | undefined;
    await tx.transacao.update({
      where: { id: c.id },
      data: {
        dadosAdicionais: {
          ...dadosOld,
          estado: "concluido",
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    await tx.user.update({
      where: { id: c.userId },
      data: { saldo: { increment: c.valor } },
    });
  });
}

async function processParticipacao(transactionId: string) {
  const participacao = await any.findFirst({
    where: {
      dadosParticipacao: { contains: transactionId },
    },
  });

  if (!participacao) return;

  if (participacao.estadoPagamento === "concluido") {
    return; // already processed
  }

  await any.update({
    where: { id: participacao.id },
    data: {
      estadoPagamento: "concluido",
      dataPagamento: new Date(),
    },
  });

  if (participacao.userId) {
    const cashbackValor = participacao.valorPago * 0.05;

    await prisma.user.update({
      where: { id: participacao.userId },
      data: { saldo: { increment: cashbackValor } },
    });

    await any.create({
      data: {
        userId: participacao.userId,
        valor: cashbackValor,
        tipo: "cashback",
        descricao: `Cashback de compra: ${participacao.id}`,
        referencia: participacao.jogoId,
      },
    });
  }
}
