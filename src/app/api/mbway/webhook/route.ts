import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processWebhookCallback, validateWebhookSignature } from '@/lib/mbway';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-mbway-signature');

    const webhookSecret = process.env.MBWAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const isValid = validateWebhookSignature(
        JSON.stringify(body),
        signature,
        webhookSecret
      );
      if (!isValid) {
        return NextResponse.json({ error: 'Signature inválida' }, { status: 400 });
      }
    }

    const result = processWebhookCallback(body);

    if (result.success) {
      const participacao = await prisma.participacao.findFirst({
        where: {
          dadosParticipacao: {
            contains: result.transactionId,
          },
        },
      });

      if (participacao) {
        await prisma.participacao.update({
          where: { id: participacao.id },
          data: {
            estadoPagamento: 'concluido',
          },
        });

        await prisma.jogo.update({
          where: { id: participacao.jogoId },
          data: {
            stockAtual: { decrement: 1 },
            totalParticipacoes: { increment: 1 },
            totalAngariado: { increment: participacao.valorPago },
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook MBWay:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
