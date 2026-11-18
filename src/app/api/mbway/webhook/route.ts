import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  processWebhookCallback,
  validateWebhookSignature,
} from "@/lib/mbway";
import { claimWebhookEvent, completeWebhookEvent } from "@/lib/webhook-helpers";
import { amountMatches } from "@/lib/payment-amount";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-mbway-signature");
    const webhookSecret = process.env.MBWAY_WEBHOOK_SECRET;

    // M1 (Sprint 2): FAIL-CLOSED ABSOLUTO — sem secret configurado o webhook
    // NÃO processa nada, em nenhum ambiente. Antes, fora de produção aceitava
    // payloads não assinados (porta a falsificação de status de pagamento).
    if (!webhookSecret) {
      console.error(
        "[MBWay webhook] MBWAY_WEBHOOK_SECRET não configurado — REJEITANDO (fail-closed)"
      );
      return NextResponse.json(
        { error: "Webhook não configurado" },
        { status: 500 }
      );
    }

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
        { status: 401 }
      );
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
      // A classificação financeira vem dos registos internos, não de metadata
      // controlada pelo payload externo.
      // M1 (Sprint 2): VALIDAÇÃO DE AMOUNT — o webhook só pode creditar o
      // valor registado na Transação pendente. Sem isto, um payload assinado
      // com amount adulterado inflacionaria saldos.
      if (result.status !== "completed") {
        await completeWebhookEvent("mbway", result.transactionId, "failed", {
          status: result.status,
        });
        return NextResponse.json({ received: true, status: result.status });
      }

      const amountIsValid = await verifyWebhookAmount(
        result.transactionId,
        typeof body?.amount === "number" ? body.amount : undefined
      );
      if (!amountIsValid) {
        await completeWebhookEvent("mbway", result.transactionId, "failed", {
          error: "amount_mismatch",
        });
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }

      const [carregamento, participacao] = await Promise.all([
        prisma.transacao.findFirst({
          where: { referencia: result.transactionId, tipo: "carregamento_saldo" },
          select: { id: true },
        }),
        prisma.participacao.findFirst({
          where: { referenciaPagamento: result.transactionId },
          select: { id: true },
        }),
      ]);

      if (carregamento && participacao) {
        throw new Error("REFERENCIA_MBWAY_AMBIGUA");
      }
      if (carregamento) {
        await processCarregamento(result.transactionId);
      } else if (participacao) {
        await processParticipacao(result.transactionId);
      } else {
        throw new Error("PAGAMENTO_MBWAY_SEM_REGISTO_INTERNO");
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
    // A validação do montante também usa esta referência dedicada. Não
    // procurar transactionId em JSON livre: isso cria uma segunda via de
    // associação e pode ligar um callback a um carregamento não relacionado.
    const c = await tx.transacao.findFirst({
      where: { tipo: "carregamento_saldo", referencia: transactionId },
    });

    if (!c) throw new Error("CARREGAMENTO_MBWAY_NAO_ENCONTRADO");
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
  // A referência externa só pode identificar uma participação através do
  // campo dedicado. Procurar o transactionId em JSON livre permite colisões
  // e associações acidentais a dados controlados pelo cliente.
  const participacao = await prisma.participacao.findFirst({
    where: { referenciaPagamento: transactionId },
  });

  if (!participacao) throw new Error("PARTICIPACAO_MBWAY_NAO_ENCONTRADA");

  if (participacao.estadoPagamento === "concluido") {
    return; // already processed
  }

  // Atomicidade: marca pagamento + credita cashback numa única transação
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.participacao.updateMany({
      where: { id: participacao.id, estadoPagamento: { not: "concluido" } },
      data: {
        estadoPagamento: "concluido",
        dataPagamento: new Date(),
      },
    });

    if (updated.count === 0) return; // já processada em paralelo

    if (participacao.userId) {
      const cashbackValor = participacao.valorPago * 0.05;

      await tx.user.update({
        where: { id: participacao.userId },
        data: { saldo: { increment: cashbackValor } },
      });

      await tx.transacao.create({
        data: {
          userId: participacao.userId,
          valor: cashbackValor,
          tipo: "cashback",
          descricao: `Cashback de compra: ${participacao.id}`,
          referencia: participacao.jogoId,
        },
      });
    }
  });
}


/**
 * Confirma o montante comunicado pelo MBWay contra o valor originalmente
 * registado na participação ou no carregamento pendente. Sem correspondência
 * exata ao cêntimo, o webhook não pode creditar saldo nem concluir compras.
 */
async function verifyWebhookAmount(
  transactionId: string,
  receivedAmount: number | undefined
): Promise<boolean> {
  if (typeof receivedAmount !== "number" || !Number.isFinite(receivedAmount)) {
    return false;
  }

  const [participacao, carregamento] = await Promise.all([
    prisma.participacao.findFirst({
      where: { referenciaPagamento: transactionId },
      select: { valorPago: true },
    }),
    prisma.transacao.findFirst({
      where: { referencia: transactionId, tipo: "carregamento_saldo" },
      select: { valor: true },
    }),
  ]);

  const expectedAmount = participacao?.valorPago ?? carregamento?.valor;
  return expectedAmount !== undefined && amountMatches(expectedAmount, receivedAmount);
}
