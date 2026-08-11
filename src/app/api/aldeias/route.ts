import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for creating an aldeia
const aldeiaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  logoUrl: z.string().url('URL inválida para logo').optional(),
  tipoOrganizacao: z.enum(['aldeia', 'escola', 'associacao_pais', 'clube']).default('aldeia'),
})

export async function GET(request: NextRequest) {
  try {
    // Get user from request (optional for public aldeias list)
    const user = await getUserFromRequest(request)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const tipoOrganizacao = searchParams.get('tipoOrganizacao') || undefined
    const incluirEliminados = searchParams.get('incluirEliminados') === 'true'

    // Build where clause
    const where: Prisma.AldeiaWhereInput = {
      ativo: true,
      // Aldeias eliminadas (soft-delete) nunca aparecem em listas públicas
      ...(incluirEliminados ? {} : { eliminado: false }),
    }

    // Non-admins only see verified aldeias
    if (!user || user.role !== 'super_admin') {
      where.verificado = true
    }

    if (search) {
      where.nome = { contains: search }
    }

    if (tipoOrganizacao) {
      where.tipoOrganizacao = tipoOrganizacao as any
    }

    // If user is logged in, we could show their aldeias too, but for now stick to public
    // TODO: Consider showing user's aldeias even if not public/verified?

    const [aldeias, total] = await Promise.all([
      prisma.aldeia.findMany({
        where,
        include: {
          _count: {
            select: { userAldeiaRoles: true, eventos: true, jogos: true, premios: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.aldeia.count({ where })
    ])

    // Per-aldeia raised totals (concluded participations only)
    const aggs = await Promise.all(
      aldeias.map((a) =>
        prisma.participacao.aggregate({
          where: { estadoPagamento: 'concluido', jogo: { evento: { aldeiaId: a.id } } },
          _count: true,
          _sum: { valorPago: true }
        })
      )
    )

    return NextResponse.json({
      aldeias: aldeias.map((aldeia: any, i: number) => ({
        ...aldeia,
        membrosAtivos: aldeia._count.userAldeiaRoles,
        totalEventos: aldeia._count.eventos,
        totalJogos: aldeia._count.jogos,
        totalPremios: aldeia._count.premios,
        totalParticipacoes: aggs[i]._count,
        totalAngariado: aggs[i]._sum.valorPago ?? 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching aldeias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar aldeias' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = aldeiaSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.format() },
        { status: 400 }
      )
    }

    const { nome, descricao, logoUrl, tipoOrganizacao } = result.data

    // Generate slug from nome
    const slug = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .replace(/[^a-z0-9\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Check if slug already exists
    const existingAldeia = await prisma.aldeia.findUnique({ where: { slug } })
    if (existingAldeia) {
      return NextResponse.json(
        { error: 'Já existe uma aldeia com este nome' },
        { status: 409 }
      )
    }

    // Verify the creator user exists in the database
    const creatorUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true }
    })

    const aldeia = await prisma.aldeia.create({
      data: {
        nome,
        slug,
        descricao,
        logoUrl,
        tipoOrganizacao,
        // Only connect admin if the user actually exists in DB
        ...(creatorUser ? {
          admins: {
            connect: { id: creatorUser.id }
          }
        } : {})
      }
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        aldeiaId: aldeia.id,
        action: 'CREATE_ALDEIA',
        resource: 'Aldeia',
        resourceId: aldeia.id,
        metadata: { nome: aldeia.nome }
      }
    })

    return NextResponse.json(aldeia, { status: 201 })
  } catch (error) {
    console.error('Error creating aldeia:', error)
    return NextResponse.json(
      { error: 'Erro ao criar aldeia' },
      { status: 500 }
    )
  }
}