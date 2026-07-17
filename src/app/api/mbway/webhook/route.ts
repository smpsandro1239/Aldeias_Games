import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processWebhookCallback, validateWebhookSignature } from '@/lib/mbway';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-mbway-signature');

    const webhookSecret = process.env.MBWAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: 'Signature MBWay obrigatória' }, { status: 400 });
      }
      const isValid = validateWebhookSignature(
        JSON.stringify(body),
        signature,
        webhookSecret
      );
      if (!isValid) {
        return NextResponse.json({ error: 'Signature MBWay inválida' }, { status: 400 });
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.error('MBWAY_WEBHOOK_SECRET não configurado em produção — webhook rejeitado');
        return NextResponse.json({ error: 'Configuração MBWay em falta' }, { status: 500 });
      }
    }

    const result = processWebhookCallback(body);

    if (result.success) {
      const dados = body?.Entity_ClientPhone || body?.dados || body;
      const tipoTransacao = dados?.tipo || dados?.metadata?.tipo;

      if (tipoTransacao === 'carregamento_saldo') {
        // IDEMPOTENCY: Use atomic findFirst + update inside a transaction to prevent double-credit
        const carregamento = await prisma.$transaction(async (tx) => {
          const c = await tx.transacao.findFirst({
            where: {
              tipo: 'carregamento_saldo',
              dadosAdicionais: {
                path: '$.transactionId',
                equals: result.transactionId,
              },
            },
          });

          if (!c) return null;

          const dadosOld = c.dadosAdicionais as Record<string, unknown> | undefined;
          if (dadosOld?.estado === 'concluido') return c; // already processed

          // Mark as confirmed atomically
          await tx.transacao.update({
            where: { id: c.id },
            data: {
              dadosAdicionais: {
                ...dadosOld,
                estado: 'concluido',
                confirmedAt: new Date().toISOString(),
              },
            },
          });

          await tx.user.update({
            where: { id: c.userId },
            data: { saldo: { increment: c.valor } },
          });

          return c;
        });
      }

      const participacao = await prisma.participacao.findFirst({
        where: {
          dadosParticipacao: { contains: result.transactionId },
        },
      });

      if (participacao) {
        if (participacao.estadoPagamento === 'concluido') {
          return NextResponse.json({ received: true, status: 'already_processed' });
        }

        await prisma.participacao.update({
          where: { id: participacao.id },
          data: {
            estadoPagamento: 'concluido',
            dataPagamento: new Date(),
          },
        });

        if (participacao.userId) {
          const cashbackPercent = 0.05;
          const cashbackValor = participacao.valorPago * cashbackPercent;

          await prisma.user.update({
            where: { id: participacao.userId },
            data: { saldo: { increment: cashbackValor } },
          });

          await prisma.transacao.create({
            data: {
              userId: participacao.userId,
              valor: cashbackValor,
              tipo: 'cashback',
              descricao: `Cashback de compra: ${participacao.id}`,
              referencia: participacao.jogoId,
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook MBWay:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
