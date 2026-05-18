import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const aldeiaId = params.id

    // Check if user is a member of this aldeia
    const membership = await prisma.userAldeiaRole.findFirst({
      where: {
        userId: user.id,
        aldeiaId: aldeiaId
      },
      include: {
        role: {
          select: { name: true }
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Acesso negado: você não é membro desta aldeia' },
        { status: 403 }
      )
    }

    // Get aldeia data
    const aldeia = await prisma.aldeia.findUnique({
      where: { id: aldeiaId },
      select: {
        id: true,
        nome: true,
        slug: true,
        descricao: true,
        logoUrl: true,
        nivel: true,
        experiencia: true,
        pontos: true,
        moedaInterna: true,
        criadoEm: true,
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

    // Get recent members (last 5 to join)
    const recentMembers = await prisma.userAldeiaRole.findMany({
      where: { aldeiaId: aldeiaId },
      include: {
        user: {
          select: { id: true, nome: true, fotoUrl: true }
        },
        role: {
          select: { name: true }
        }
      },
      orderBy: { criadoEm: 'desc' },
      take: 5
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

    // Get recent events (last 3)
    const recentEvents = await prisma.evento.findMany({
      where: { aldeiaId: aldeiaId },
      orderBy: { criadoEm: 'desc' },
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
      orderBy: { criadoEm: 'desc' },
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

    // Calculate level progress
    // Assuming each level requires 1000 * level points (so level 1: 0-999, level 2: 1000-1999, etc.)
    const pontosParaProximoNivel = aldeia.nivel * 1000
    const pontosNoNivelAtual = aldeia.experiencia % 1000
    const progressoNivel = (pontosNoNivelAtual / pontosParaProximoNivel) * 100

    return NextResponse.json({
      aldeia: {
        ...aldeia,
        membrosAtivos: aldeia._count.userAldeiaRoles,
        totalEventos: aldeia._count.eventos,
        totalJogos: aldeia._count.jogos,
        totalPremios: aldeia._count.premios,
        progressoNivel: Math.min(100, Math.max(0, progressoNivel))
      },
      recentMembers: recentMembers.map(m => ({
        id: m.user.id,
        nome: m.user.nome,
        fotoUrl: m.user.fotoUrl,
        role: m.role.name,
        entrouEm: m.criadoEm
      })),
      onlineMembers: onlineMembers.map(m => ({
        id: m.id,
        nome: m.nome,
        fotoUrl: m.fotoUrl
      })),
      recentEvents,
      recentJogos
    })
  } catch (error) {
    console.error('Error fetching aldeia dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    )
  }
}