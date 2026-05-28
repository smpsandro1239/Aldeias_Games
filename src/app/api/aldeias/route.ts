import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    // Build where clause
    const where: any = {
      ativo: true,
      verificado: true,
    }

    if (search) {
      where.nome = { contains: search, mode: 'insensitive' }
    }

    if (tipoOrganizacao) {
      where.tipoOrganizacao = tipoOrganizacao
    }

    // If user is logged in, we could show their aldeias too, but for now stick to public
    // TODO: Consider showing user's aldeias even if not public/verified?

    const [aldeias, total] = await Promise.all([
      prisma.aldeia.findMany({
        where,
        include: {
          _count: {
            select: { userAldeiaRoles: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.aldeia.count({ where })
    ])

    return NextResponse.json({
      aldeias: aldeias.map(aldeia => ({
        ...aldeia,
        membrosAtivos: aldeia._count.userAldeiaRoles
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

    const aldeia = await prisma.aldeia.create({
      data: {
        nome,
        slug,
        descricao,
        logoUrl,
        tipoOrganizacao,
        // Set the creator as admin of the aldeia
        admins: {
          connect: { id: user.userId }
        }
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