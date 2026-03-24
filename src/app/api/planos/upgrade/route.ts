import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import Stripe from 'stripe';

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
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2025-02-24.acacia',
      });

      let sessionUrl: string | null = null;

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: `Plano ${novoPlano.nome} - Aldeias Games`,
                },
                unit_amount: Math.round(novoPlano.precoMensal * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/plano?success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/plano?cancelled=true`,
          customer_email: aldeia.email,
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
