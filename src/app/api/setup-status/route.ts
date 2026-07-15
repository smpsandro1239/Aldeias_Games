import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o usuário completo
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
      include: { aldeia: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se não tem aldeia associada, retorna que precisa configurar
    if (!user.aldeiaId) {
      return NextResponse.json({
        needsSetup: true,
        step: 1,
        message: 'Você precisa criar ou se associar a uma aldeia para continuar.'
      });
    }

    // Buscar a aldeia
    const aldeia = await prisma.aldeia.findUnique({
      where: { id: user.aldeiaId }
    });

    if (!aldeia) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 });
    }

    // Verificar o que já foi configurado
    const setupStatus = {
      needsSetup: !(aldeia.nomeTitularConta && aldeia.iban && 
                    aldeia.permitirStripe !== null && aldeia.permitirMBWay !== null),
      step: calculateSetupStep(aldeia),
      aldeia: {
        id: aldeia.id,
        nome: aldeia.nome,
        permitirStripe: aldeia.permitirStripe,
        permitirMBWay: aldeia.permitirMBWay,
        iban: aldeia.iban,
        nomeTitularConta: aldeia.nomeTitularConta,
        avisoPagamentosEnviado: aldeia.avisoPagamentosEnviado
      }
    };

    return NextResponse.json(setupStatus);
  } catch (error) {
    console.error('Erro ao verificar status de setup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para determinar em qual passo do setup estamos
function calculateSetupStep(aldeia: { nome: string | null; slug: string | null; iban: string | null; nomeTitularConta: string | null; permitirStripe: boolean | null; permitirMBWay: boolean | null; avisoPagamentosEnviado: boolean | null }): number {
  if (!aldeia.nome || !aldeia.slug) return 1; // Informações básicas
  if (!aldeia.iban || !aldeia.nomeTitularConta) return 2; // Dados bancários
  if (aldeia.permitirStripe === null || aldeia.permitirMBWay === null) return 3; // Métodos de pagamento
  if (!aldeia.avisoPagamentosEnviado) return 4; // Configurações finais
  return 5; // Completo
}

export async function PATCH(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admins podem alterar configurações da aldeia
    if (!hasRole(userData.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Apenas administradores podem alterar configurações' }, { status: 403 });
    }

    // Buscar o usuário completo
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
      include: { aldeia: true }
    });

    if (!user || !user.aldeiaId) {
      return NextResponse.json({ error: 'Usuário não encontrado ou sem aldeia associada' }, { status: 404 });
    }

    const body = await request.json();
    const { step, data } = body;

    // Atualizar baseado no passo
    let updateData: Prisma.AldeiaUpdateInput = {};

    switch (step) {
      case 1: // Informações básicas da aldeia (já deveria existir)
        // Este passo é mais para aldeias novas que estão sendo criadas
        break;
        
      case 2: // Dados bancários
        if (data.iban) updateData.iban = data.iban;
        if (data.nomeTitularConta) updateData.nomeTitularConta = data.nomeTitularConta;
        break;
        
      case 3: // Métodos de pagamento
        if (data.permitirStripe !== undefined) updateData.permitirStripe = data.permitirStripe;
        if (data.permitirMBWay !== undefined) updateData.permitirMBWay = data.permitirMBWay;
        break;
        
      case 4: // Configurações finais
        if (data.avisoPagamentosEnviado !== undefined) 
          updateData.avisoPagamentosEnviado = data.avisoPagamentosEnviado;
        break;
        
      default:
        return NextResponse.json({ error: 'Passo inválido' }, { status: 400 });
    }

    // Aplicar atualizações
    if (Object.keys(updateData).length > 0) {
      await prisma.aldeia.update({
        where: { id: user.aldeiaId },
        data: updateData
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status de setup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}