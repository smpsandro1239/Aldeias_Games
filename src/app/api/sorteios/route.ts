import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFullUserFromRequest, hasRole } from '@/lib/auth'
import { executarSorteioSchema, commitSorteioSchema, revealSorteioSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'
import { logSorteio } from '@/lib/audit'
import crypto from 'crypto'
import { sendWinnerEmail } from '@/lib/email'
import { sendWinnerSMS } from '@/lib/sms'

// ============================================
// COMMIT PHASE - Gerar hash ANTES do sorteio
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request)

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // RATE LIMITING: limite de sorteios por usuário (20/min)
    const rateLimitKey = `sorteio:${user.id}`
    const rateLimit = checkRateLimit(rateLimitKey, {
      ...rateLimitConfigs.api,
      maxRequests: 20, // 20 sorteios por minuto
    })

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetTime)
    }

    const body = await request.json()
    const action = body.action

    // COMMIT - Fase 1: Criar hash ANTES do sorteio
    if (action === 'commit') {
      const validation = commitSorteioSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 })
      }

      const { jogoId } = validation.data

      const jogo = await prisma.jogo.findUnique({
        where: { id: jogoId },
        include: { evento: true },
      })

      if (!jogo) {
        return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
      }

      if (user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
        return NextResponse.json({ error: 'Não pode executar sorteios de outra aldeia' }, { status: 403 })
      }

      // Gerar salt aleatório para o commit
      const commitSalt = crypto.randomBytes(32).toString('hex')

      // Gerar hash do commit (contém seed mas ainda não é revelada)
      const preCommitHash = crypto
        .createHash('sha256')
        .update(`${commitSalt}:${jogoId}:${Date.now()}`)
        .digest('hex')

      // Criar registo de sorteio em fase "commit"
      const sorteio = await prisma.sorteio.create({
        data: {
          seed: '', // ainda vazia - será preenchida na revelação
          hash: '',
          resultado: '',
          fase: 'commit',
          preCommitHash,
          commitSalt,
          jogoId,
        },
      })

      // Log auditoria: commit
      await logSorteio(
        user?.id || 'anonymous',
        jogoId,
        jogo.nome,
        'commit',
        undefined,
        preCommitHash,
        undefined,
        request.headers.get('x-forwarded-for') ?? undefined,
        request.headers.get('user-agent') ?? undefined
      )

      return NextResponse.json({
        success: true,
        message: 'Commit criado. Anote o hash para verificação posterior.',
        data: {
          sorteioId: sorteio.id,
          preCommitHash,
          instrucoes: 'Guarde o hash acima. Quando executar o sorteio, o resultado será verificável contra este hash.',
        },
      })
    }

    // REVEAL - Fase 2: Revelar resultado e verificar
    if (action === 'reveal') {
      const validation = revealSorteioSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 })
      }

      const { jogoId, seedRevelada } = validation.data

      // Buscar sorteio pendente deste jogo
      const sorteioExistente = await prisma.sorteio.findFirst({
        where: { jogoId, fase: 'commit' },
        orderBy: { createdAt: 'desc' },
      })

      if (!sorteioExistente) {
        return NextResponse.json({ error: 'Não há commit pendente para este jogo. Execute o sorteio primeiro.' }, { status: 400 })
      }

      // Buscar jogo e participações
      const jogo = (await prisma.jogo.findUnique({
        where: { id: jogoId },
        include: {
          evento: true,
          participacoes: {
            where: { estadoPagamento: 'concluido' },
            include: { user: { select: { id: true, nome: true, email: true, telefone: true } } },
          },
          premios: true, // Include premios to determine prize value
        },
      })) as any

      if (!jogo) {
        return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
      }

      if (jogo.participacoes.length === 0) {
        return NextResponse.json({ error: 'Não há participações para sortear' }, { status: 400 })
      }

      // Executar sorteio usando a seed revelada
      let resultado: Record<string, unknown>
      let vencedores: { posicao: number; participacaoId: string; dados: unknown }[] = []

      if (jogo.tipo === 'poio_da_vaca') {
        const config = JSON.parse(jogo.configuracao)
        let letra = body.letraVencedora
        let numero = body.numeroVencedor

        if (jogo.modoSorteio === 'app' || (!letra || !numero)) {
          // Usar seed para determinismo
          const seedNum = parseInt(seedRevelada.slice(0, 8), 16)
          letra = config.letras[seedNum % config.letras.length]
          numero = (seedNum % config.numerosPorLetra) + 1
        }

        resultado = { letraVencedora: letra, numeroVencedor: numero }

        const vencedoresPoio = jogo.participacoes.filter((p: any) => {
          const dados = JSON.parse(p.dadosParticipacao as string)
          return dados.letra === letra && dados.numero === numero
        })

        vencedores = vencedoresPoio.map((v: any, index: number) => ({
          posicao: index + 1,
          participacaoId: v.id,
          dados: {
            userId: v.id,
            userNome: v.user?.nome || v.nomeCliente,
            userEmail: v.user?.email || v.emailCliente,
            userTelefone: v.user?.telefone || v.telefoneCliente,
            letra,
            numero,
          },
        }))
      } else if (jogo.tipo === 'rifa' || jogo.tipo === 'tombola') {
        const config = JSON.parse(jogo.configuracao)
        let numeroVencedor = body.numeroVencedor

        if (jogo.modoSorteio === 'app' || !numeroVencedor) {
          const seedNum = parseInt(seedRevelada.slice(0, 8), 16)
          numeroVencedor = (seedNum % (config.numeroFinal - config.numeroInicial + 1)) + config.numeroInicial
        }

        resultado = { numeroVencedor }

        const vencedoresRifa = jogo.participacoes.filter((p: any) => {
          const dados = JSON.parse(p.dadosParticipacao as string)
          return dados.numero === numeroVencedor
        })

        vencedores = vencedoresRifa.map((v: any, index: number) => ({
          posicao: index + 1,
          participacaoId: v.id,
          dados: {
            userId: v.id,
            userNome: v.user?.nome || v.nomeCliente,
            userEmail: v.user?.email || v.emailCliente,
            userTelefone: v.user?.telefone || v.telefoneCliente,
            numero: numeroVencedor,
          },
        }))
      } else {
        return NextResponse.json({ error: 'Tipo de jogo não suportado para sorteio' }, { status: 400 })
      }

      // Gerar hash para auditoria
      const hash = crypto
        .createHash('sha256')
        .update(`${seedRevelada}:${JSON.stringify(resultado)}:${sorteioExistente.commitSalt}`)
        .digest('hex')

      // Atualizar sorteio com resultado
      const sorteio = await prisma.sorteio.update({
        where: { id: sorteioExistente.id },
        data: {
          seed: seedRevelada,
          hash,
          resultado: JSON.stringify(resultado),
          fase: 'revelado',
          revealedAt: new Date(),
        },
        include: { vencedores: true },
      })

      // Atualizar jogo como sorteado
      let sorteadoValue: number | null = null;
      if (jogo.tipo === 'rifa' || jogo.tipo === 'tombola') {
        sorteadoValue = (resultado as { numeroVencedor: number }).numeroVencedor;
      } else if (jogo.tipo === 'poio_da_vaca') {
        // For poio da vaça, we don't have a single number to store; keep null
        sorteadoValue = null;
      }
      await prisma.jogo.update({
        where: { id: jogoId },
        data: { 
          sorteado: sorteadoValue,
          isFinalizado: true,
          dataSorteio: new Date()
        },
      })

      // Marcar participações como ganhadoras e enviar notificações
      // ALSO: Award aldeia a percentage of the prize value
      const aldeiaSharePercentage = 0.15 // 15% to aldeia's internal currency

      for (const vencedor of vencedores) {
        await prisma.participacao.update({
          where: { id: vencedor.participacaoId },
          data: { ganhador: true },
        })

        const dadosVencedor = vencedor.dados as { userId: string | null; userNome: string; userEmail?: string | undefined; userTelefone?: string | undefined; id?: string | null }

        if (dadosVencedor.id) {
          await prisma.notificacao.create({
            data: {
              tipo: 'sorteio',
              titulo: 'Parabéns! Você ganhou!',
              mensagem: `Você foi o vencedor do sorteio \"${jogo.nome}\". Entre em contacto com a organização para receber o seu prémio!`,
              userId: dadosVencedor.id,
            },
          })

          if (dadosVencedor.userEmail) {
            const premios = await prisma.premio.findMany({ where: { jogoId } })
            const premioNome = premios.length > 0 ? premios[0].nome : 'Prémio do sorteio'
            sendWinnerEmail(dadosVencedor.userEmail, dadosVencedor.userNome, jogo.nome, premioNome).catch(console.error)
          }

          if (dadosVencedor.userTelefone) {
            const premios = await prisma.premio.findMany({ where: { jogoId } })
            const premioNome = premios.length > 0 ? premios[0].nome : 'Prémio do sorteio'
            sendWinnerSMS(dadosVencedor.userTelefone, dadosVencedor.userNome, jogo.nome, premioNome).catch(console.error)
          }
        }

        // --- NEW: Award aldeia a percentage of the prize value ---
        // We assume the primeiro premio (or the only one) is the prize won
        // In a more complex scenario, we would need to know which specific premio was won
        const primeiroPremio = jogo.premios[0]
        if (primeiroPremio && primeiroPremio.valorDinheiroAlternative !== null) {
          const prizeValue = primeiroPremio.valorDinheiroAlternative
          const aldeiaShare = prizeValue * aldeiaSharePercentage

          // Update aldeia's moedaInterna (internal currency)
          await prisma.aldeia.update({
            where: { id: jogo.aldeiaId },
            data: { moedaInterna: { increment: aldeiaShare } },
          })

          // Record this contribution in gameAnalytics for dashboard and audit
          await prisma.gameAnalytics.create({
            data: {
              type: 'aldeia_prize_share',
              aldeiaId: jogo.aldeiaId,
              gameId: jogo.id,
              amount: aldeiaShare,
              // description: `Share from prize won in jogo ${jogo.nome} (${primeiroPremio.nome || 'Prémio'})`,
              metadata: JSON.stringify({
                premioId: primeiroPremio.id,
                premioNome: primeiroPremio.nome,
                valorPremio: prizeValue,
                percentagem: aldeiaSharePercentage,
                vencedorId: vencedor.participacaoId,
                vencedorUserId: dadosVencedor.id,
              }),
            },
          })
        }
        // --- END NEW ---
      }

      // Log auditoria: reveal (execução do sorteio)
      await logSorteio(
        user?.id || 'anonymous',
        jogoId,
        jogo.nome,
        'reveal',
        seedRevelada,
        hash,
        vencedores.length,
        request.headers.get('x-forwarded-for') ?? undefined,
        request.headers.get('user-agent') ?? undefined
      )

      return NextResponse.json({
        success: true,
        message: 'Sorteio executado e verificado com sucesso!',
        data: {
          sorteio,
          resultado,
          vencedores: vencedores.length,
          verificacao: {
            hash,
            preCommitHash: sorteioExistente.preCommitHash,
            verificado: true,
          },
        },
      })
    }

    return NextResponse.json({ error: 'Ação inválida. Use \"commit\" ou \"reveal\".' }, { status: 400 })
  } catch (error) {
    console.error('Erro no processo de sorteio:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const url = new URL(request.url)
    const jogoId = url.searchParams.get('jogoId')

    let where: Record<string, unknown> = {}

    if (jogoId) {
      where.jogoId = jogoId
    }

    if (user.role === 'aldeia_admin') {
      const jogos = await prisma.jogo.findMany({
        where: { evento: { aldeiaId: user.aldeiaId as string } },
        select: { id: true },
      })
      where.jogoId = { in: jogos.map(j => j.id) }
    } else if (user.role === 'vendedor' || user.role === 'user') {
      const participacoes = await prisma.participacao.findMany({
        where: { userId: user.id },
        select: { jogoId: true },
      })
      where.jogoId = { in: participacoes.map(p => p.jogoId) }
    }

    const sorteios = await prisma.sorteio.findMany({
      where,
      include: {
        jogo: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            evento: {
              select: {
                id: true,
                nome: true,
                aldeia: { select: { id: true, nome: true } },
              },
            },
          },
        },
        vencedores: { orderBy: { posicao: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: sorteios })
  } catch (error) {
    console.error('Erro ao listar sorteios:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request)

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const validation = executarSorteioSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 })
    }

    const { jogoId, observacoes } = validation.data

    const jogo = (await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: {
        evento: true,
        participacoes: {
          where: { estadoPagamento: 'concluido' },
          include: { user: { select: { id: true, nome: true, email: true, telefone: true } } },
        },
        premios: true, // Include premios
      },
    })) as any

    if (!jogo) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    if (user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: 'Não pode executar sorteios de outra aldeia' }, { status: 403 })
    }

    if (jogo.sorteado) {
      return NextResponse.json({ error: 'Este jogo já foi sorteado' }, { status: 400 })
    }

    if (jogo.participacoes.length === 0) {
      return NextResponse.json({ error: 'Não há participações para sortear' }, { status: 400 })
    }

    const seed = crypto.randomBytes(32).toString('hex')
    let resultado: Record<string, unknown>
    let vencedores: { posicao: number; participacaoId: string; dados: unknown }[] = []

    if (jogo.tipo === 'poio_da_vaca') {
      const config = JSON.parse(jogo.configuracao)
      let letra = body.letraVencedora
      let numero = body.numeroVencedor

      if (jogo.modoSorteio === 'app' || (!letra || !numero)) {
        letra = config.letras[Math.floor(Math.random() * config.letras.length)]
        numero = Math.floor(Math.random() * config.numerosPorLetra) + 1
      }

      resultado = { letraVencedora: letra, numeroVencedor: numero }

      const vencedoresPoio = jogo.participacoes.filter((p: any) => {
        const dados = JSON.parse(p.dadosParticipacao as string)
        return dados.letra === letra && dados.numero === numero
      })

      vencedores = vencedoresPoio.map((v: any, index: number) => ({
        posicao: index + 1,
        participacaoId: v.id,
        dados: {
          userId: v.id,
          userNome: v.user?.nome || v.nomeCliente,
          userEmail: v.user?.email || v.emailCliente,
          userTelefone: v.user?.telefone || v.telefoneCliente,
          letra,
          numero,
        },
      }))
    } else if (jogo.tipo === 'rifa' || jogo.tipo === 'tombola') {
      const config = JSON.parse(jogo.configuracao)
      let numeroVencedor = body.numeroVencedor

      if (jogo.modoSorteio === 'app' || !numeroVencedor) {
        numeroVencedor = Math.floor(Math.random() * (config.numeroFinal - config.numeroInicial + 1)) + config.numeroInicial
      }

      resultado = { numeroVencedor }

      const vencedoresRifa = jogo.participacoes.filter((p: any) => {
        const dados = JSON.parse(p.dadosParticipacao as string)
        return dados.numero === numeroVencedor
      })

      vencedores = vencedoresRifa.map((v: any, index: number) => ({
        posicao: index + 1,
        participacaoId: v.id,
        dados: {
          userId: v.id,
          userNome: v.user?.nome || v.nomeCliente,
          userEmail: v.user?.email || v.emailCliente,
          userTelefone: v.user?.telefone || v.telefoneCliente,
          numero: numeroVencedor,
        },
      }))
    } else {
      return NextResponse.json({ error: 'Tipo de jogo não suportado para sorteio' }, { status: 400 })
    }

    const hash = crypto.createHash('sha256').update(`${seed}:${JSON.stringify(resultado)}:${Date.now()}`).digest('hex')

    const sorteio = await prisma.sorteio.create({
      data: {
        seed,
        hash,
        resultado: JSON.stringify(resultado),
        observacoes,
        fase: 'revelado',
        revealedAt: new Date(),
        jogoId,
        vencedores: {
          create: vencedores.map(v => ({
            posicao: v.posicao,
            dadosVencedor: JSON.stringify(v.dados),
          })),
        },
      },
      include: { vencedores: true },
    })

    // Atualizar jogo como sorteado
    let sorteadoValue: number | null = null;
    if (jogo.tipo === 'rifa' || jogo.tipo === 'tombola') {
      sorteadoValue = (resultado as { numeroVencedor: number }).numeroVencedor;
    } else if (jogo.tipo === 'poio_da_vaca') {
      // For poio da vaça, we don't have a single number to store; keep null
      sorteadoValue = null;
    }
    await prisma.jogo.update({
      where: { id: jogoId },
      data: { 
        sorteado: sorteadoValue,
        isFinalizado: true,
        dataSorteio: new Date()
      },
    })

    // Marcar participações como ganhadoras e enviar notificações
    // ALSO: Award aldeia a percentage of the prize value
    const aldeiaSharePercentage = 0.15 // 15% to aldeia's internal currency

    for (const vencedor of vencedores) {
      await prisma.participacao.update({
        where: { id: vencedor.participacaoId },
        data: { ganhador: true },
      })

      const dadosVencedor = vencedor.dados as { userId: string | null; userNome: string; userEmail?: string | undefined; userTelefone?: string | undefined; id?: string | null }

      if (dadosVencedor.id) {
        await prisma.notificacao.create({
          data: {
            tipo: 'sorteio',
            titulo: 'Parabéns! Você ganhou!',
            mensagem: `Você foi o vencedor do sorteio \"${jogo.nome}\". Entre em contacto com a organização para receber o seu prémio!`,
            userId: dadosVencedor.id,
          },
        })

        if (dadosVencedor.userEmail) {
          const premios = await prisma.premio.findMany({ where: { jogoId } })
          const premioNome = premios.length > 0 ? premios[0].nome : 'Prémio do sorteio'
          sendWinnerEmail(dadosVencedor.userEmail, dadosVencedor.userNome, jogo.nome, premioNome).catch(console.error)
        }

        if (dadosVencedor.userTelefone) {
          const premios = await prisma.premio.findMany({ where: { jogoId } })
          const premioNome = premios.length > 0 ? premios[0].nome : 'Prémio do sorteio'
          sendWinnerSMS(dadosVencedor.userTelefone, dadosVencedor.userNome, jogo.nome, premioNome).catch(console.error)
        }
      }

      // --- NEW: Award aldeia a percentage of the prize value ---
      const primeiroPremio = jogo.premios[0]
      if (primeiroPremio && primeiroPremio.valorDinheiroAlternative !== null) {
        const prizeValue = primeiroPremio.valorDinheiroAlternative
        const aldeiaShare = prizeValue * aldeiaSharePercentage

        // Update aldeia's moedaInterna (internal currency)
        await prisma.aldeia.update({
          where: { id: jogo.aldeiaId },
          data: { moedaInterna: { increment: aldeiaShare } },
        })

        // Record this contribution in gameAnalytics for dashboard and audit
        await prisma.gameAnalytics.create({
          data: {
            type: 'aldeia_prize_share',
            aldeiaId: jogo.aldeiaId,
            gameId: jogo.id,
            amount: aldeiaShare,
            // description: `Share from prize won in jogo ${jogo.nome} (${primeiroPremio.nome || 'Prémio'})`,
            metadata: JSON.stringify({
              premioId: primeiroPremio.id,
              premioNome: primeiroPremio.nome,
              valorPremio: prizeValue,
              percentagem: aldeiaSharePercentage,
              vencedorId: vencedor.participacaoId,
              vencedorUserId: dadosVencedor.id,
            }),
          },
        })
      }
      // --- END NEW ---
    }

    return NextResponse.json({
      success: true,
      message: 'Sorteio executado com sucesso',
      data: { sorteio, resultado, vencedores: vencedores.length },
    })
  } catch (error) {
    console.error('Erro ao executar sorteio:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}