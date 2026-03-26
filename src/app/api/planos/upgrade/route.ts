import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { aldeiaId, planoId, modoUpgrade } = body;

    if (!aldeiaId || !planoId) {
      return NextResponse.json({ error: 'ID da organização e do plano são obrigatórios' }, { status: 400 });
    }

    const aldeia = await prisma.aldeia.findUnique({
      where: { id: aldeiaId },
      include: { plano: true },
    });

    if (!aldeia) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    const novoPlano = await prisma.plano.findUnique({
      where: { id: planoId },
    });

    if (!novoPlano) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
    }

    const now = new Date();
    const dataFimPlano = new Date(now);
    dataFimPlano.setMonth(dataFimPlano.getMonth() + 1);

    if (novoPlano.precoMensal > 0 && aldeia.email) {
      let sessionUrl: string | null = null;

      try {
        const session = await createCheckoutSession({
          valor: novoPlano.precoMensal,
          descricao: `Plano ${novoPlano.nome} - Aldeias Games`,
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/plano?success=true`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/plano?cancelled=true`,
          metadata: {
            aldeiaId,
            planoId,
          },
        });
        sessionUrl = session.url;
      } catch (stripeError) {
        console.error('Erro ao criar sessão Stripe:', stripeError);
      }

      if (sessionUrl) {
        return NextResponse.json({
          success: true,
          url: sessionUrl,
          message: 'Redirect para pagamento Stripe',
        });
      }
    }

    await prisma.aldeia.update({
      where: { id: aldeiaId },
      data: {
        planoId: novoPlano.id,
        dataInicioPlano: now,
        dataFimPlano,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Plano atualizado para ${novoPlano.nome}`,
    });
  } catch (error) {
    console.error('Erro ao processar upgrade de plano:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
