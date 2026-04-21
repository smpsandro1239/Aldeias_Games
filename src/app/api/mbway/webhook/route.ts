import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processWebhookCallback, validateWebhookSignature } from '@/lib/mbway';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-mbway-signature');

    const webhookSecret = process.env.MBWAY_WEBHOOK_SECRET;

    // SIGNATURE OBRIGATÓRIA — se o secret estiver configurado, a signature é obrigatória
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
      // Em produção, o secret DEVE estar configurado
      if (process.env.NODE_ENV === 'production') {
        console.error('MBWAY_WEBHOOK_SECRET não configurado em produção — webhook rejeitado');
        return NextResponse.json({ error: 'Configuração MBWay em falta' }, { status: 500 });
      }
      console.warn('MBWAY_WEBHOOK_SECRET não configurado — a aceitar webhook sem verificação (apenas dev)');
    }

    const result = processWebhookCallback(body);

    if (result.success) {
      // Check if it's a saldo carregamento (carregamento_saldo)
      const dados = body?.Entity_ClientPhone || body?.dados || body;
      const tipoTransacao = dados?.tipo || dados?.metadata?.tipo;

      if (tipoTransacao === 'carregamento_saldo') {
        // Find the carregamento by transactionId reference
        const carregamento = await prisma.transacao.findFirst({
          where: {
            tipo: 'carregamento_saldo',
            dadosAdicionais: {
              path: ['transactionId'],
              equals: result.transactionId,
            },
          },
        });

        if (carregamento) {
          const dadosOld = carregamento.dadosAdicionais as Record<string, unknown> | undefined;
          // Verificar se já foi processado para evitar duplicados
          if (dadosOld?.estado !== 'concluido') {
            // Creditar saldo ao utilizador
            await prisma.user.update({
              where: { id: carregamento.userId },
              data: {
                saldo: { increment: carregamento.valor },
              },
            });

            // Atualizar estado do carregamento
            await prisma.transacao.update({
              where: { id: carregamento.id },
              data: {
                dadosAdicionais: {
                  ...dadosOld,
                  estado: 'concluido',
                  confirmedAt: new Date().toISOString(),
                },
              },
            });

            console.log(`Carregamento saldo creditado: €${carregamento.valor} para user ${carregamento.userId}`);
          }
        }
      }

      // Buscar participação pelo transactionId nos dados
      const participacao = await prisma.participacao.findFirst({
        where: {
          dadosParticipacao: {
            contains: result.transactionId,
          },
        },
      });

      if (participacao) {
        // Verificar se já foi processado para evitar duplicados
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

        // DAR CASHBACK ao utilizador (5%)
        const cashbackPercent = 0.05;
        const cashbackValor = participacao.valorPago * cashbackPercent;

        if (participacao.userId) {
          await prisma.user.update({
            where: { id: participacao.userId },
            data: {
              saldo: { increment: cashbackValor },
            },
          });

          await prisma.transacao.create({
            data: {
              userId: participacao.userId,
              valor: cashbackValor,
              tipo: 'cashback',
              descricao: `Cashback de compra: raspadinha`,
              referencia: participacao.jogoId,
            },
          });
        }
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
