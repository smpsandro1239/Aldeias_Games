import { NextRequest, NextResponse } from 'next/server';
import { checkPaymentStatus } from '@/lib/mbway';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID é obrigatório' }, { status: 400 });
    }

    const status = await checkPaymentStatus(transactionId);

    if (!status) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      transactionId: status.transactionId,
      status: status.status,
      amount: status.amount,
    });
  } catch (error) {
    console.error('Erro ao verificar estado MBWay:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
