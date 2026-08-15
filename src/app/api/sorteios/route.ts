import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFullUserFromRequest } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac/checkPermission'
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'
import { logSorteio } from '@/lib/audit'
import { createLogger, extractRequestContext } from '@/lib/logger'
import { hashClientSeed, computeFinalHash, isValidSha256Hash, hashToIndex } from '@/lib/lottery-utils'
import { normalizePoioConfig } from '@/lib/poio-utils'
import crypto from 'crypto'
// @ts-ignore - @prisma/client types generated at build time
import { TipoNotificacao } from '@prisma/client'

// PATCH — commit do sorteio (passo 1 do fluxo provably-fair)
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
      const jogo = await prisma.jogo.findUnique({
        where: { id: jogoId },
        include: { evento: { select: { aldeiaId: true } } }
      });
      if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
      if (jogo.hashSorteio) return NextResponse.json({ error: 'Hash já comprometido' }, { status: 400 });

      if (user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
        return NextResponse.json({ error: 'Não autorizado para este jogo' }, { status: 403 });
      }

      // Compromisso opcional da client seed: o revelador compromete-se
      // ANTES de conhecer a server seed; o reveal só passa se comprovar
      // que conhece a seed original (sha256(clientSeed) === commit).
      const clientSeedCommit: string | undefined = body.clientSeedCommit;
      if (clientSeedCommit !== undefined) {
        if (typeof clientSeedCommit !== 'string' || !isValidSha256Hash(clientSeedCommit)) {
          return NextResponse.json(
            { error: 'clientSeedCommit deve ser um hash sha256 (64 hex)' },
            { status: 400 }
          );
        }
      }

      const serverSeed = crypto.randomBytes(64).toString('hex');
      const commitSalt = crypto.randomBytes(32).toString('hex');
      const hashSorteio = crypto.createHash('sha256').update(`${commitSalt}:${jogoId}:${new Date().toISOString()}`).digest('hex');

      await prisma.jogo.update({
        where: { id: jogoId },
        data: {
          seedSorteio: serverSeed,
          hashSorteio,
          clientSeedCommit: clientSeedCommit ?? null,
        }
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
          clientSeedCommit: clientSeedCommit ?? null,
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

// POST — reveal do sorteio (passo 2): determina o vencedor e finaliza o jogo.
// `dryRun: true` simula sem persistir nada (variante sandbox).
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

    const { jogoId, clientSeed, dryRun = false } = await request.json()
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: {
        evento: { select: { aldeiaId: true } },
        participacoes: {
          where: { estadoPagamento: 'concluido' },
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { nome: true } },
            vendedor: { select: { nome: true } },
          },
        }
      }
    })

    if (!jogo || jogo.sorteado) return NextResponse.json({ error: 'Inválido' }, { status: 400 })
    if (user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado para este jogo' }, { status: 403 });
    }
    if (!jogo.seedSorteio) return NextResponse.json({ error: 'Commit necessário' }, { status: 400 })
    if (jogo.participacoes.length === 0) return NextResponse.json({ error: 'Sem participações' }, { status: 400 })

    // Verificar o compromisso da client seed (se foi feito no commit):
    // o revelador tem de provar que conhece a seed original.
    const seedCliente = typeof clientSeed === 'string' ? clientSeed : '';
    if (jogo.clientSeedCommit) {
      if (!seedCliente) {
        return NextResponse.json({ error: 'Client seed é obrigatória (compromisso realizado no commit)' }, { status: 400 });
      }
      if (hashClientSeed(seedCliente) !== jogo.clientSeedCommit) {
        return NextResponse.json(
          { error: 'Client seed não corresponde ao compromisso (adulterada)' },
          { status: 400 }
        );
      }
    }

    // Find existing pendente Sorteio (from commit phase)
    const existingSorteio = await prisma.sorteio.findFirst({
      where: { jogoId, fase: 'pendente' },
      orderBy: { createdAt: 'desc' },
    });

    let vencedorId: string;
    let winningCoord: string | null = null;
    let numeroSorteado: number | null = null;

    const finalHash = computeFinalHash(jogo.seedSorteio, seedCliente || 'no-client-seed');

    if (jogo.tipo === 'poio_da_vaca') {
      const cfg = normalizePoioConfig(
        JSON.parse(jogo.configuracao || '{}'),
        jogo.dimensoesCampo
      );
      const totalCells = cfg.letras.length * cfg.numerosPorLetra;
      const roll = hashToIndex(finalHash, totalCells);
      const letraIdx = Math.floor(roll / cfg.numerosPorLetra);
      const num = (roll % cfg.numerosPorLetra) + 1;
      const letra = cfg.letras[letraIdx];
      winningCoord = `${letra}${num}`;

      const vencedor = jogo.participacoes.find((p: (typeof jogo.participacoes)[number]) => {
        const d = JSON.parse(p.dadosParticipacao);
        if (d.letra === letra && d.numero === num) return true;
        if (Array.isArray(d.coordenadas)) {
          return d.coordenadas.some((c: any) => c.y === num && cfg.letras[c.x - 1] === letra);
        }
        return false;
      });
      if (!vencedor) return NextResponse.json({ success: true, message: 'Ninguém ganhou', resultado: winningCoord });
      vencedorId = vencedor.id;
    } else if (jogo.tipo === 'euromilhoes') {
      // Um número 1-50 é sorteado; com 1 participação = 1 número (M4),
      // o vencedor é a participação que contém exatamente esse número.
      numeroSorteado = hashToIndex(finalHash, 50) + 1;
      const vencedor = jogo.participacoes.find((p: (typeof jogo.participacoes)[number]) => {
        const d = JSON.parse(p.dadosParticipacao);
        if (typeof d.numero === 'number') return d.numero === numeroSorteado;
        const nums: number[] = JSON.parse(p.numerosSelecionados || '[]');
        return Array.isArray(nums) && nums.includes(numeroSorteado as number);
      });
      if (!vencedor) return NextResponse.json({ success: true, message: 'Ninguém ganhou', resultado: String(numeroSorteado) });
      vencedorId = vencedor.id;
    } else {
      const index = hashToIndex(finalHash, jogo.participacoes.length);
      vencedorId = jogo.participacoes[index].id;
      const dadosPart = JSON.parse(jogo.participacoes[index].dadosParticipacao);
      numeroSorteado = dadosPart.numeros?.[0] ?? (dadosPart.numero ?? null);
    }

    const resultado = winningCoord || String(numeroSorteado || '');

    // SANDBOX — dryRun não persiste vencedores nem finaliza o jogo
    if (dryRun === true) {
      const vencedor = jogo.participacoes.find((p: any) => p.id === vencedorId);
      const ipDry: string | undefined = request.headers.get('x-forwarded-for') ?? undefined;
      const uaDry: string | undefined = request.headers.get('user-agent') ?? undefined;
      logSorteio(user.id, jogoId, jogo.nome ?? '', 'teste', jogo.seedSorteio ?? undefined, jogo.hashSorteio ?? undefined, 1, ipDry, uaDry);
      return NextResponse.json({
        success: true,
        dryRun: true,
        vencedorId,
        vencedorNome: vencedor?.user?.nome || vencedor?.nomeCliente || 'Desconhecido',
        seedRevelada: jogo.seedSorteio,
        resultado: winningCoord || numeroSorteado,
      });
    }

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
      prisma.participacao.update({ where: { id: vencedorId }, data: { ganhador: true } }),
      prisma.jogo.update({
        where: { id: jogoId },
        data: {
          sorteado: numeroSorteado,
          dataSorteio: new Date(),
          isFinalizado: true,
          dadosVerificacao: JSON.stringify({ clientSeed: seedCliente, finalHash, winningCoord, numeroSorteado })
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

    // Notificar todos os participantes (conta criada) quando o sorteio conclui
    const participantesComUser = jogo.participacoes.filter((p: any) => p.userId);
    if (participantesComUser.length > 0) {
      const nomeJogo = jogo.nome ?? '';
      const resultadoLegivel = winningCoord || `número ${numeroSorteado}`;
      await prisma.notificacao.createMany({
        data: participantesComUser.map((p: any) => ({
          userId: p.userId,
          tipo: TipoNotificacao.sorteio,
          titulo: 'Sorteio concluído',
          mensagem: `O sorteio de "${nomeJogo}" terminou — resultado: ${resultadoLegivel}. Verificá-lo na página de participações.`,
        })),
      });
    }

    // Audit log for reveal
    const ip: string | undefined = request.headers.get('x-forwarded-for') ?? undefined;
    const userAgent: string | undefined = request.headers.get('user-agent') ?? undefined;
    logSorteio(user.id, jogoId, jogo.nome ?? '', 'reveal', jogo.seedSorteio ?? undefined, jogo.hashSorteio ?? undefined, 1, ip, userAgent);

    const vencedorRow = jogo.participacoes.find((p: any) => p.id === vencedorId);
    return NextResponse.json({
      success: true,
      vencedorId,
      vencedorNome: vencedorRow?.user?.nome || vencedorRow?.nomeCliente || 'Desconhecido',
      seedRevelada: jogo.seedSorteio,
      resultado: winningCoord || numeroSorteado,
      notificados: participantesComUser.length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}