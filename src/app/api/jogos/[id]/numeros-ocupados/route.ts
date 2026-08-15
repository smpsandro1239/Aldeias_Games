import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { normalizePoioConfig, normalizeCoordenada, coordToSquareId } from '@/lib/poio-utils';

// GET público - Retorna números ocupados de um jogo (rifa)
// Não requer autenticação - apenas retorna números, sem dados sensíveis
export async function GET(
  request: NextRequest,
  context: { params: Promise<{id: string}> }
) {
  try {
    const { id: jogoId } = await context.params;
    const grelhaId = request.nextUrl.searchParams.get('grelhaId');

    // Buscar participações com estado de pagamento concluído ou pendente
    // (MBWay) — um número pendente fica ocupado até confirmação ou timeout.
    // Para Euromilhões, filtra por grelha: cada participação unitária tem
    // `numerosSelecionados: "[N]"` + `grelhaId`, evitando sobreposição com
    // outras grelhas do mesmo jogo.
    const participacoes = await prisma.participacao.findMany({
      where: {
        jogoId,
        estadoPagamento: { in: ['concluido', 'pendente'] },
        ...(grelhaId ? { grelhaId } : {}),
      },
      select: {
        userId: true,
        dadosParticipacao: true,
        numerosSelecionados: true,
        metodoPagamento: true,
        estadoPagamento: true,
      },
    });

    // Config de poio (letras/numerosPorLetra/dimensoesCampo) para converter
    // coordenadas em ids de quadrado como a página os apresenta.
    const jogoInfo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      select: { tipo: true, configuracao: true, dimensoesCampo: true },
    });
    const isPoio = jogoInfo?.tipo === 'poio_da_vaca';
    const cfgPoio = isPoio
      ? normalizePoioConfig(
          jogoInfo?.configuracao ? JSON.parse(jogoInfo.configuracao) : {},
          jogoInfo?.dimensoesCampo
        )
      : null;

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
        } else if (isPoio && cfgPoio && Array.isArray(parsed.coordenadas)) {
          // Poio da Vaca: coordenadas {letra, numero} ou {x, y} → ids
          for (const c of parsed.coordenadas) {
            const norm = normalizeCoordenada(c);
            if (!norm) continue;
            const id = coordToSquareId(norm, cfgPoio);
            if (id !== null && !numeros.includes(id)) numeros.push(id);
          }
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