import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { progressToNextLevel } from '@/lib/aldeia-progress'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{aldeiaId: string;}> }
) {
  try {
    const { aldeiaId } = await context.params

    // Get aldeia data with member count
    const aldeia = await prisma.aldeia.findUnique({
      where: { id: aldeiaId },
      select: {
        id: true,
        nome: true,
        slug: true,
        descricao: true,
        logoUrl: true,
        moedaInterna: true,
        experiencia: true,
        nivel: true,
        pontos: true,
        createdAt: true,
        ativo: true,
        verificado: true,
        _count: {
          select: { userAldeiaRoles: true, eventos: true, jogos: true, premios: true }
        }
      }
    })

    if (!aldeia) {
      return NextResponse.json(
        { error: 'Aldeia não encontrada' },
        { status: 404 }
      )
    }

    // Calculate progress to next level
    const progressoNivel = progressToNextLevel(aldeia.experiencia, aldeia.nivel)

    // Get recent members (last 5 to join) - order by user's createdAt (when they joined the system)
    const recentMembers = await prisma.userAldeiaRole.findMany({
      where: { aldeiaId: aldeiaId },
      include: {
        user: {
          select: { id: true, nome: true, fotoUrl: true, createdAt: true }
        },
        role: {
          select: { name: true }
        }
      },
      orderBy: {
        user: {
          createdAt: 'desc'
        }
      },
      take: 5
    })

    // Get recent events (last 3)
    const recentEvents = await prisma.evento.findMany({
      where: { aldeiaId: aldeiaId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        nome: true,
        slug: true,
        dataInicio: true,
        dataFim: true,
        objectivoAngariacao: true,
        totalAngariado: true,
        totalParticipacoes: true,
        estado: true
      }
    })

    // Get recent games (last 3)
    const recentJogos = await prisma.jogo.findMany({
      where: { aldeiaId: aldeiaId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        nome: true,
        tipo: true,
        preco: true,
        stockAtual: true,
        stockInicial: true,
        totalParticipacoes: true,
        totalAngariado: true,
        estado: true
      }
    })

    // Get recent game contributions (both prize won and aldeia prize share)
    const recentContributions = await prisma.gameAnalytics.findMany({
      where: {
        jogo: {
          aldeiaId: aldeiaId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        type: true,
        jogo: {
          select: {
            nome: true,
            tipo: true
          }
        },
        user: {
          select: {
            nome: true
          }
        }
      }
    })

    // Get online members (users who logged in in the last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const onlineMembers = await prisma.user.findMany({
      where: {
        userAldeiaRoles: {
          some: { aldeiaId: aldeiaId }
        },
        ultimoLogin: {
          gte: fifteenMinutesAgo
        }
      },
      select: {
        id: true,
        nome: true,
        fotoUrl: true
      },
      take: 5
    })

    return NextResponse.json({
      aldeia: {
        id: aldeia.id,
        nome: aldeia.nome,
        slug: aldeia.slug,
        descricao: aldeia.descricao,
        logoUrl: aldeia.logoUrl,
        moedaInterna: aldeia.moedaInterna,
        experiencia: aldeia.experiencia,
        nivel: aldeia.nivel,
        pontos: aldeia.pontos,
        progressoNivel,
        createdAt: aldeia.createdAt,
        ativo: aldeia.ativo,
        verificado: aldeia.verificado,
        membrosAtivos: aldeia._count.userAldeiaRoles,
        totalEventos: aldeia._count.eventos,
        totalJogos: aldeia._count.jogos,
        totalPremios: aldeia._count.premios
      },
      recentMembers: recentMembers.map(m => ({
        user: {
          id: m.user.id,
          nome: m.user.nome,
          fotoUrl: m.user.fotoUrl,
          createdAt: m.user.createdAt
        },
        role: {
          name: m.role.name
        }
      })),
      onlineMembers: onlineMembers.map(m => ({
        id: m.id,
        nome: m.nome,
        fotoUrl: m.fotoUrl
      })),
      recentEvents,
      recentJogos,
      recentContributions: recentContributions.map(c => ({
        id: c.id,
        amount: c.amount,
        createdAt: c.createdAt,
        gameNome: c.jogo?.nome ?? '',
        gameTipo: c.jogo?.tipo ?? '',
        userNome: c.user?.nome ?? '',
        type: c.type // Include type to distinguish between prize won and aldeia share
      }))
    })
  } catch (error) {
    console.error('Error fetching aldeia dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    )
  }
}
