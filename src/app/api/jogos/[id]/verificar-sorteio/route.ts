import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, context: { params: Promise<{id: string}> }) {
  try {
    const { id } = await context.params;
    const jogoId = id;

    // Find the jogo
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      select: {
        id: true,
        nome: true,
        tipo: true,
        evento: {
          select: {
            id: true,
            nome: true,
            aldeiaId: true,
            aldeia: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    })

    if (!jogo) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      )
    }

    // Find the most recent sorteio for this jogo
    const sorteio = await prisma.sorteio.findFirst({
      where: { jogoId: jogoId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        seed: true,
        hash: true,
        resultado: true,
        fase: true,
        preCommitHash: true,
        commitSalt: true,
        revealedAt: true,
        createdAt: true,
        vencedores: {
          select: {
            posicao: true,
            dadosVencedor: true
          },
          orderBy: { posicao: 'asc' }
        }
      }
    })

    if (!sorteio) {
      return NextResponse.json(
        { error: 'Nenhum sorteio encontrado para este jogo' },
        { status: 404 }
      )
    }

    // Prepare verification data
    const verificationData = {
      jogo: {
        id: jogo.id,
        nome: jogo.nome,
        tipo: jogo.tipo,
        evento: jogo.evento
      },
      sorteio: {
        id: sorteio.id,
        fase: sorteio.fase,
        commit: {
          hash: sorteio.preCommitHash,
          salt: sorteio.commitSalt,
          // We'll use the sorteio.createdAt as the timestamp used in the commitment
          timestamp: sorteio.createdAt.toISOString()
        },
        reveal: sorteio.fase === 'revelado' ? {
          seed: sorteio.seed,
          hash: sorteio.hash,
          resultado: sorteio.resultado ? (() => { try { return JSON.parse(sorteio.resultado); } catch { return sorteio.resultado; } })() : null,
          reveladoEm: sorteio.revealedAt?.toISOString() ?? null
        } : null,
        vencedores: sorteio.vencedores.map((v: any) => ({
          posicao: v.posicao,
          dados: v.dadosVencedor ? JSON.parse(v.dadosVencedor) : null
        }))
      },
      // Verification instructions
      verificacao: {
        algoritmo: 'SHA-256',
        descricao: 'O hash de commitment é calculado como: SHA256(commitSalt + \":\" + jogoId + \":\" + timestamp)',
        exemplo: 'Para verificar, gere o hash usando o mesmo algoritmo e compare com o hash de commitment fornecido.',
        passos: [
          '1. Obtenha o commitSalt, jogoId e timestamp (do campo commit.timestamp).',
          '2. Se o sorteio foi revelado, obtenha o seed revelado.',
          '3. Calcule: hash = SHA256(`${commitSalt}:${jogoId}:${timestamp}`).',
          '4. Compare o hash calculado com o hash de commitment fornecido.',
          '5. Se coincidirem, o commitment é válido.',
          '6. Se o sorteio foi revelado, verifique ainda:',
          '   a. Calcule: hashResultado = SHA256(`${seed}:${JSON.stringify(resultado)}:${commitSalt}`).',
          '   b. Compare hashResultado com o hash de révélation fornecido.',
          '   c. Se coincidirem, o resultado é válido e não foi alterado.'
        ]
      }
    }

    return NextResponse.json(verificationData)
  } catch (error: any) {
    console.error('Error fetching verification data:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}