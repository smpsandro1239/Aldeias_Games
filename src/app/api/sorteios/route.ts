import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFullUserFromRequest, hasRole } from '@/lib/auth'
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'
import crypto from 'crypto'
import { euromillionsApiService } from '@/lib/euromillions-api'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request)
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const rateLimit = checkRateLimit(user.id, rateLimitConfigs.sorteios);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.resetTime)

    const body = await request.json()
    const { jogoId, action } = body;

    if (action === 'commit') {
      const jogo = await prisma.jogo.findUnique({ where: { id: jogoId } });
      if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
      if (jogo.hashSorteio) return NextResponse.json({ error: 'Hash já comprometido' }, { status: 400 });

      const serverSeed = crypto.randomBytes(64).toString('hex');
      const hashSorteio = crypto.createHash('sha256').update(serverSeed).digest('hex');

      await prisma.jogo.update({
        where: { id: jogoId },
        data: { seedSorteio: serverSeed, hashSorteio }
      });

      return NextResponse.json({ success: true, hash: hashSorteio });
    }
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request)
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const rateLimit = checkRateLimit(user.id, rateLimitConfigs.sorteios);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.resetTime)

    const { jogoId, clientSeed } = await request.json()
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: { participacoes: { where: { estadoPagamento: 'concluido' }, orderBy: { createdAt: 'asc' } } }
    })

    if (!jogo || jogo.sorteado) return NextResponse.json({ error: 'Inválido' }, { status: 400 })
    if (!jogo.seedSorteio) return NextResponse.json({ error: 'Commit necessário' }, { status: 400 })
    if (jogo.participacoes.length === 0) return NextResponse.json({ error: 'Sem participações' }, { status: 400 })

    let winningNumber: number | null = null;
    let combinedSeed = `${jogo.seedSorteio}:${clientSeed || 'no-client-seed'}`;

    // LÓGICA ESPECIAL PARA TOMBOLA (EURO MILLIONS)
    if (jogo.tipo === 'tombola') {
      try {
        winningNumber = await euromillionsApiService.getFirstMainNumber();
        combinedSeed += `:euromillions:${winningNumber}`;
      } catch (e) {
        console.error('EuroMillions API fail, falling back to combined seed only');
      }
    }

    const finalHash = crypto.createHash('sha256').update(combinedSeed).digest('hex');
    let vencedorId: string;
    let winningCoord: string | null = null;

    if (jogo.tipo === 'poio_da_vaca') {
      const config = JSON.parse(jogo.configuracao);
      const totalCells = config.letras.length * config.numerosPorLetra;
      const roll = Number(BigInt('0x' + finalHash.substring(0, 12)) % BigInt(totalCells));
      const letraIdx = Math.floor(roll / config.numerosPorLetra);
      const num = (roll % config.numerosPorLetra) + 1;
      const letra = config.letras[letraIdx];
      winningCoord = `${letra}${num}`;

      const vencedor = jogo.participacoes.find(p => {
        const d = JSON.parse(p.dadosParticipacao);
        return d.letra === letra && d.numero === num;
      });
      if (!vencedor) return NextResponse.json({ success: true, message: 'Ninguém ganhou', resultado: winningCoord });
      vencedorId = vencedor.id;
    } else if (jogo.tipo === 'tombola' && winningNumber !== null) {
      // Se tivermos o número do EuroMillions, o vencedor é quem tem esse número
      const vencedor = jogo.participacoes.find(p => {
        const d = JSON.parse(p.dadosParticipacao);
        return d.numero === winningNumber;
      });
      if (!vencedor) return NextResponse.json({ success: true, message: 'Ninguém ganhou', resultado: winningNumber });
      vencedorId = vencedor.id;
    } else {
      // Rifa ou Tombola sem API: Sorteio puramente baseado em hash
      const index = Number(BigInt('0x' + finalHash.substring(0, 12)) % BigInt(jogo.participacoes.length));
      vencedorId = jogo.participacoes[index].id;
    }

    await prisma.$transaction([
      prisma.participacao.update({ where: { id: vencedorId }, data: { ganhador: true } }),
      prisma.jogo.update({
        where: { id: jogoId },
        data: {
          sorteado: vencedorId,
          dataSorteio: new Date(),
          isFinalizado: true,
          dadosVerificacao: JSON.stringify({ clientSeed, combinedSeed, finalHash, winningNumber, winningCoord })
        }
      })
    ]);

    return NextResponse.json({ success: true, vencedorId, seedRevelada: jogo.seedSorteio, resultado: winningCoord || winningNumber });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
