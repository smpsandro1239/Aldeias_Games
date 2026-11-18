import { NextRequest, NextResponse } from 'next/server';
import { getFullUserFromRequest } from '@/lib/auth';
import { mbwayPaymentSchema } from '@/lib/validations';
import { initiatePayment, checkPaymentStatus, normalizePhoneNumber } from '@/lib/mbway';
import { prisma } from '@/lib/db';
import { amountMatches } from '@/lib/payment-amount';

// POST - Iniciar pagamento MBWay
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = mbwayPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { telefone, valor, descricao } = validation.data;

    if (!telefone) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
    }

    // Não iniciar cobranças de jogo sem um registo interno que possa receber
    // a referência do fornecedor. Carregamentos são a única operação sem
    // Participacao e têm de declarar explicitamente o seu tipo.
    const isCarregamento = body.tipo === 'carregamento_saldo';
    if (
      (isCarregamento && body.participacaoId) ||
      (!isCarregamento && (!body.participacaoId || body.tipo !== undefined))
    ) {
      return NextResponse.json(
        { error: 'Pagamento MB WAY sem associação interna válida' },
        { status: 400 }
      );
    }

    // Se o pagamento corresponde a uma participação, confirmar ownership,
    // estado e montante antes de contactar o fornecedor externo.
    let participacaoAssociada: { id: string } | null = null;
    if (body.participacaoId) {
      const participacao = await prisma.participacao.findUnique({
        where: { id: String(body.participacaoId) },
        select: { id: true, userId: true, estadoPagamento: true, valorPago: true },
      });

      if (!participacao || participacao.userId !== user.id) {
        return NextResponse.json({ error: 'Participação não encontrada' }, { status: 404 });
      }
      if (participacao.estadoPagamento === 'concluido') {
        return NextResponse.json({ error: 'Participação já paga' }, { status: 409 });
      }
      if (!amountMatches(participacao.valorPago, valor)) {
        return NextResponse.json({ error: 'O valor não corresponde à participação' }, { status: 400 });
      }
      participacaoAssociada = { id: participacao.id };
    }

    // Normalizar telefone
    const telefoneNormalizado = normalizePhoneNumber(telefone);

    // Iniciar pagamento MBWay
    const result = await initiatePayment(
      telefoneNormalizado,
      valor,
      descricao || 'Pagamento Aldeias Games',
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/pagamentos/mbway/webhook`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || 'Erro ao iniciar pagamento MBWay' },
        { status: 400 }
      );
    }

    if (!result.transactionId) {
      return NextResponse.json({ error: 'O fornecedor não devolveu uma referência de transação' }, { status: 502 });
    }

    // Se há uma participação associada, atualizar referência
    if (participacaoAssociada) {
      await prisma.participacao.update({
        where: { id: participacaoAssociada.id },
        data: {
          referenciaPagamento: result.transactionId,
          estadoPagamento: 'processando',
        },
      });
    }

    // Se é um carregamento de saldo, criar registo pendente
    if (body.tipo === 'carregamento_saldo' && user) {
      await prisma.transacao.create({
        data: {
          userId: user.id,
          tipo: 'carregamento_saldo',
          valor: valor,
          descricao: 'Carregamento de saldo via MBWay',
          referencia: result.transactionId,
          metodoPagamento: 'mbway',
          estado: 'pendente',
          dadosAdicionais: {
            transactionId: result.transactionId,
            reference: result.reference,
            estado: 'pendente',
            telefone: telefoneNormalizado,
            dataHora: new Date().toISOString(),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        transactionId: result.transactionId,
        reference: result.reference,
        status: result.status,
        message: result.message,
      },
    });
  } catch (error) {
    console.error('Erro no pagamento MBWay:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET - Verificar estado do pagamento
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID é obrigatório' },
        { status: 400 }
      );
    }

    // A referência MBWay não é uma credencial de acesso. Confirmar que a
    // transação pertence ao utilizador antes de consultar o fornecedor.
    const [participacao, carregamento] = await Promise.all([
      prisma.participacao.findFirst({
        where: { referenciaPagamento: transactionId },
        select: { id: true, userId: true, estadoPagamento: true },
      }),
      prisma.transacao.findFirst({
        where: { referencia: transactionId, tipo: 'carregamento_saldo' },
        select: { userId: true },
      }),
    ]);

    // Uma referência deve identificar exactamente um registo interno.
    // Se existir simultaneamente como participação e carregamento, não revelar
    // o estado externo: o webhook também rejeita esta associação ambígua.
    if (participacao && carregamento) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    const ownerId = participacao?.userId ?? carregamento?.userId;
    if (!ownerId || ownerId !== user.id) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    const status = await checkPaymentStatus(transactionId);

    if (!status) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    // Consulta read-only: só o webhook assinado confirma a operação financeira.

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Erro ao verificar pagamento MBWay:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
