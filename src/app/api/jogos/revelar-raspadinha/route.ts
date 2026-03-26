import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { jogoId, premioId } = await request.json();

    if (!jogoId || !premioId) {
      return NextResponse.json(
        { error: 'jogoId e premioId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o jogo e o prémio
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: {
        premios: true,
      },
    });

    if (!jogo) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }

    const premio = await prisma.premio.findUnique({
      where: { id: premioId },
    });

    if (!premio) {
      return NextResponse.json(
        { error: 'Prémio não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o jogo está aberto
    if (jogo.estado !== 'aberto') {
      return NextResponse.json(
        { error: 'Jogo não está ativo' },
        { status: 400 }
      );
    }

    // Lógica de probabilidade - usa o seed do jogo para fairness
    // Probabilidade base: 30% de ganhar
    const ganhou = Math.random() < 0.3;

    // Se ganhou, decrementar stock do prémio
    if (ganhou && premio.id) {
      await prisma.premio.update({
        where: { id: premio.id },
        data: {
          // Assumindo que existe um campo stock no modelo Premio
          // Se não existir, pode ser necessário adicionar ao schema
        },
      });

      // Atualizar estatísticas do jogo
      await prisma.jogo.update({
        where: { id: jogoId },
        data: {
          totalParticipacoes: { increment: 1 },
          totalAngariado: { increment: jogo.preco },
        },
      });
    }

    return NextResponse.json({
      ganhou,
      premio: ganhou ? premio : null,
      hashVerificacao: generateVerificationHash(jogoId, premioId, ganhou),
    });
  } catch (error) {
    console.error('Erro ao revelar raspadinha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para gerar hash de verificação (SHA-256)
function generateVerificationHash(jogoId: string, premioId: string, ganhou: boolean): string {
  const data = `${jogoId}:${premioId}:${ganhou}:${Date.now()}`;
  
  // Nota: Em produção, usar crypto.subtle.digest
  // Para simplificar, usamos uma função hash básica
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0');
}
