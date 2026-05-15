import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET público - Retorna números ocupados de um jogo (rifa/tombola)
// Não requer autenticação - apenas retorna números, sem dados sensíveis
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jogoId } = await context.params;

    // Buscar participações com estado de pagamento concluído
    const participacoes = await prisma.participacao.findMany({
      where: {
        jogoId,
        estadoPagamento: 'concluido',
      },
      select: {
        userId: true,
        dadosParticipacao: true,
      },
    });

    const numerosOcupados: number[] = [];
    const numerosDoUtilizador: number[] = [];

    // Obter userId do request (se autenticado)
    const userIdFromHeader = request.headers.get('x-user-id');

    for (const p of participacoes) {
      if (!p.dadosParticipacao) continue;

      let numeros: number[] = [];
      try {
        const parsed = typeof p.dadosParticipacao === 'string'
          ? JSON.parse(p.dadosParticipacao)
          : p.dadosParticipacao;

        // Suportar múltiplos formatos:
        // - Array direto: [1, 2, 3]
        // - Objeto com numeros: {numeros: [1, 2, 3]}
        // - Formato legacy: {numero: 1}
        if (Array.isArray(parsed)) {
          numeros = parsed;
        } else if (parsed.numeros && Array.isArray(parsed.numeros)) {
          numeros = parsed.numeros;
        } else if (parsed.numero) {
          numeros = [parsed.numero];
        }
      } catch {
        numeros = [];
      }

      for (const n of numeros) {
        const num = Number(n);
        if (!numerosOcupados.includes(num)) {
          numerosOcupados.push(num);
        }
        // Se o utilizador está autenticado, marcar os seus números
        if (userIdFromHeader && p.userId === userIdFromHeader && !numerosDoUtilizador.includes(num)) {
          numerosDoUtilizador.push(num);
        }
      }
    }

    return NextResponse.json({
      numerosOcupados: [...new Set(numerosOcupados)].sort((a, b) => a - b),
      numerosDoUtilizador: [...new Set(numerosDoUtilizador)].sort((a, b) => a - b),
    });
  } catch (error) {
    console.error('Erro ao buscar números ocupados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}