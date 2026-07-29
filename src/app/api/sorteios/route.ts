import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFullUserFromRequest } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac/checkPermission'
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'
import { logSorteio } from '@/lib/audit'
import { createLogger, extractRequestContext } from '@/lib/logger'
import crypto from 'crypto'

export async function PATCH(request: NextRequest) {
  const log = createLogger(extractRequestContext(request));
  try {
    const user = await getFullUserFromRequest(request)
    log.info('Sorteio commit/reveal solicitado', { userId: user?.id })
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA')
    if (denied) return denied

    const rateLimit = await checkRateLimit(user.id, rateLimitConfigs.sorteios);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.resetTime)

    const body = await request.json()
    const { jogoId, action } = body;

    if (action === 'commit') {
      const jogo = await any.findUnique({
        where: { id: jogoId },
        include: { evento: { select: { aldeiaId: true } } }
      });
      if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
      if (jogo.hashSorteio) return NextResponse.json({ error: 'Hash já comprometido' }, { status: 400 });

      if (user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
        return NextResponse.json({ error: 'Não autorizado para este jogo' }, { status: 403 });
      }

      const serverSeed = crypto.randomBytes(64).toString('hex');
      const commitSalt = crypto.randomBytes(32).toString('hex');
      const hashSorteio = crypto.createHash('sha256').update(`${commitSalt}:${jogoId}:${new Date().toISOString()}`).digest('hex');

      await any.update({
        where: { id: jogoId },
        data: { seedSorteio: serverSeed, hashSorteio }
      });

      // Create Sorteio in commit phase for public verification
      await prisma.sorteio.create({
        data: {
          seed: serverSeed,
          hash: hashSorteio,
          resultado: '',
          fase: 'pendente',
          preCommitHash: hashSorteio,
          commitSalt,
          jogoId,
        }
      });

      return NextResponse.json({ success: true, hash: hashSorteio });
    }
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const log = createLogger(extractRequestContext(request));
  try {
    const user = await getFullUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA')
    if (denied) return denied
    log.info('Sorteio executado', { userId: user.id })

    const rateLimit = await checkRateLimit(user.id, rateLimitConfigs.sorteios);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.resetTime)

    const { jogoId, clientSeed } = await request.json()
    const jogo = await any.findUnique({
      where: { id: jogoId },
      include: {
        evento: { select: { aldeiaId: true } },
        participacoes: { where: { estadoPagamento: 'concluido' }, orderBy: { createdAt: 'asc' } }
      }
    })

    if (!jogo || jogo.sorteado) return NextResponse.json({ error: 'Inválido' }, { status: 400 })
    if (user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado para este jogo' }, { status: 403 });
    }
    if (!jogo.seedSorteio) return NextResponse.json({ error: 'Commit necessário' }, { status: 400 })
    if (jogo.participacoes.length === 0) return NextResponse.json({ error: 'Sem participações' }, { status: 400 })

    // Find existing pendente Sorteio (from commit phase)
    const existingSorteio = await prisma.sorteio.findFirst({
      where: { jogoId, fase: 'pendente' },
      orderBy: { createdAt: 'desc' },
    });

    let winningNumber: number | null = null;
    let combinedSeed = `${jogo.seedSorteio}:${clientSeed || 'no-client-seed'}`;

    const finalHash = crypto.createHash('sha256').update(combinedSeed).digest('hex');
    let vencedorId: string;
    let winningCoord: string | null = null;
    let numeroSorteado: number | null = null;

    if (jogo.tipo === 'poio_da_vaca') {
      const config = JSON.parse(jogo.configuracao);
      const totalCells = config.letras.length * config.numerosPorLetra;
      const roll = Number(BigInt('0x' + finalHash.substring(0, 12)) % BigInt(totalCells));
      const letraIdx = Math.floor(roll / config.numerosPorLetra);
      const num = (roll % config.numerosPorLetra) + 1;
      const letra = config.letras[letraIdx];
      winningCoord = `${letra}${num}`;

      const vencedor = jogo.participacoes.find((p: (typeof jogo.participacoes)[number]) => {
        const d = JSON.parse(p.dadosParticipacao);
        return d.letra === letra && d.numero === num;
      });
      if (!vencedor) return NextResponse.json({ success: true, message: 'Ninguém ganhou', resultado: winningCoord });
      vencedorId = vencedor.id;
    } else {
      const index = Number(BigInt('0x' + finalHash.substring(0, 12)) % BigInt(jogo.participacoes.length));
      vencedorId = jogo.participacoes[index].id;
      const dadosPart = JSON.parse(jogo.participacoes[index].dadosParticipacao);
      numeroSorteado = dadosPart.numeros?.[0] ?? (dadosPart.numero ?? null);
    }

    const resultado = winningCoord || String(numeroSorteado || winningNumber || '');

    // Upsert sorteio to get ID, then create vencedor in transaction
    let sorteioId: string;
    if (existingSorteio) {
      await prisma.sorteio.update({
        where: { id: existingSorteio.id },
        data: {
          seed: finalHash,
          hash: jogo.hashSorteio || '',
          resultado,
          fase: 'revelado',
          revealedAt: new Date(),
        }
      });
      sorteioId = existingSorteio.id;
    } else {
      const created = await prisma.sorteio.create({
        data: {
          seed: finalHash,
          hash: jogo.hashSorteio || '',
          resultado,
          fase: 'revelado',
          revealedAt: new Date(),
          jogoId,
        }
      });
      sorteioId = created.id;
    }

    await prisma.$transaction([
      any.update({ where: { id: vencedorId }, data: { ganhador: true } }),
      any.update({
        where: { id: jogoId },
        data: {
          sorteado: numeroSorteado,
          dataSorteio: new Date(),
          isFinalizado: true,
          dadosVerificacao: JSON.stringify({ clientSeed, combinedSeed, finalHash, winningNumber, winningCoord })
        }
      }),
      prisma.vencedorSorteio.create({
        data: {
          posicao: 1,
          dadosVencedor: JSON.stringify({ participacaoId: vencedorId }),
          sorteioId,
        }
      })
    ]);

    // Audit log for reveal
    const ip = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    logSorteio(user.id, jogoId, jogo.nome, 'reveal', jogo.seedSorteio, jogo.hashSorteio, 1, ip, userAgent);

    return NextResponse.json({ success: true, vencedorId, seedRevelada: jogo.seedSorteio, resultado: winningCoord || winningNumber });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
