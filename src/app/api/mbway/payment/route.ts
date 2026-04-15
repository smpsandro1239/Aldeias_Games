import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment } from '@/lib/mbway';
import { getFullUserFromRequest } from '@/lib/auth';
import { mbwayPaymentSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
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

    const result = await initiatePayment(
      telefone,
      valor,
      descricao || 'Compra Aldeias Games'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      reference: result.reference,
    });
  } catch (error: any) {
    console.error('Erro ao iniciar pagamento MBWay:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
