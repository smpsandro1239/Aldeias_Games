import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });

    const rateLimit = checkRateLimit(user.id, rateLimitConfigs.api);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.resetTime);

    const { jogoId, clientSeed } = await request.json();
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: {
        participacoes: { where: { estadoPagamento: 'concluido' }, orderBy: { createdAt: 'asc' } },
        evento: true
      }
    });

    if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    if (jogo.participacoes.length === 0) return NextResponse.json({ error: 'Sem participações reais para testar' }, { status: 400 });

    const serverSeed = crypto.randomBytes(64).toString('hex');
    const combinedSeed = `${serverSeed}:${clientSeed || 'test-seed'}`;
    const finalHash = crypto.createHash('sha256').update(combinedSeed).digest('hex');

    let vencedorSimulado: any = null;
    let indexVencedor = 0;

    if (jogo.tipo === 'poio_da_vaca') {
      const config = JSON.parse(jogo.configuracao);
      const totalCells = config.letras.length * config.numerosPorLetra;
      indexVencedor = Number(BigInt('0x' + finalHash.substring(0, 12)) % BigInt(totalCells));
      const letraIdx = Math.floor(indexVencedor / config.numerosPorLetra);
      const num = (indexVencedor % config.numerosPorLetra) + 1;
      const letra = config.letras[letraIdx];

      vencedorSimulado = jogo.participacoes.find(p => {
        const d = JSON.parse(p.dadosParticipacao);
        return d.letra === letra && d.numero === num;
      });
    } else {
      indexVencedor = Number(BigInt('0x' + finalHash.substring(0, 12)) % BigInt(jogo.participacoes.length));
      vencedorSimulado = jogo.participacoes[indexVencedor];
    }

    return NextResponse.json({
      success: true,
      data: {
        resultado: vencedorSimulado ? (jogo.tipo === 'poio_da_vaca' ? { letra: JSON.parse(vencedorSimulado.dadosParticipacao).letra, numero: JSON.parse(vencedorSimulado.dadosParticipacao).numero } : { index: indexVencedor }) : null,
        vencedores: vencedorSimulado ? 1 : 0,
        hash: finalHash,
        seed: serverSeed,
        vencedoresDetalhes: vencedorSimulado ? [{
          userNome: vencedorSimulado.nomeCliente || 'Utilizador',
          userEmail: vencedorSimulado.emailCliente || 'N/A'
        }] : [],
        modoTeste: true
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
