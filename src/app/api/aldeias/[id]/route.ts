import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for updating an aldeia
const updateAldeiaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  descricao: z.string().optional(),
  logoUrl: z.string().url('URL inválida para logo').optional(),
  tipoOrganizacao: z.enum(['aldeia', 'escola', 'associacao_pais', 'clube']).optional(),
  permitirStripe: z.boolean().optional(),
  permitirMBWay: z.boolean().optional(),
  metodosPagamentoDefault: z.string().optional(),
  iban: z.string().optional(),
  nomeTitularConta: z.string().optional(),
  nomeEscola: z.string().optional(),
  codigoEscola: z.string().optional(),
  nivelEnsino: z.enum(['pre_escolar', 'primeiro_ciclo', 'segundo_ciclo', 'terceiro_ciclo', 'secundario', 'superior']).optional(),
  responsavel: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  morada: z.string().optional(),
  codigoPostal: z.string().optional(),
  localidade: z.string().optional(),
  autorizacaoCM: z.boolean().optional(),
  numeroAlvara: z.string().optional(),
  documentosVerificados: z.boolean().optional(),
  ativo: z.boolean().optional(),
})

export async function GET(request: NextRequest, context: { params: Promise<{id: string}> }) {
  try {
    const { id } = await context.params
    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userAldeiaRoles: true, eventos: true, jogos: true, premios: true }
        },
        userAldeiaRoles: {
          include: {
            user: {
              select: { id: true, nome: true, role: true }
            }
          }
        },
        admins: {
          select: { id: true, nome: true }
        },
        vendedores: {
          select: { id: true, nome: true }
        }
      }
    })

    if (!aldeia) {
      return NextResponse.json(
        { error: 'Aldeia não encontrada' },
        { status: 404 }
      )
    }

    // Check if aldeia is public/verificado or if user is a member
    const user = await getUserFromRequest(request)
    const isMember = user && aldeia.userAldeiaRoles.some(role => role.id === user.userId)
    const isPublic = aldeia.ativo && aldeia.verificado

    if (!isPublic && !isMember) {
      return NextResponse.json(
        { error: 'Aldeia não encontrada ou acesso negado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...aldeia,
      membrosAtivos: aldeia._count.userAldeiaRoles,
      totalEventos: aldeia._count.eventos,
      totalJogos: aldeia._count.jogos,
      totalPremios: aldeia._count.premios
    })
  } catch (error) {
    console.error('Error fetching aldeia:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar aldeia' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{id: string}> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Check if user is admin of this aldeia
    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: { admins: { select: { id: true } } }
    })

    if (!aldeia) {
      return NextResponse.json(
        { error: 'Aldeia não encontrada' },
        { status: 404 }
      )
    }

    const isAdmin = aldeia.admins.some(admin => admin.id === user.userId)
    const isSuperAdmin = user.role === 'super_admin'

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Não autorizado para editar esta aldeia' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = updateAldeiaSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.format() },
        { status: 400 }
      )
    }

    const updateData = result.data

    // Prepare data for Prisma update
    const prismaUpdateData: any = { ...updateData }

    // If nome is being updated, regenerate slug and check uniqueness
    if (updateData.nome !== undefined) {
      const newSlug = updateData.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[^a-z0-9\\s-]/g, '')
        .replace(/\\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      const existingAldeia = await prisma.aldeia.findFirst({
        where: { slug: newSlug, NOT: { id } }
      })

      if (existingAldeia) {
        return NextResponse.json(
          { error: 'Já existe uma aldeia com este nome' },
          { status: 409 }
        )
      }

      prismaUpdateData.slug = newSlug
    }

    const updatedAldeia = await prisma.aldeia.update({
      where: { id },
      data: prismaUpdateData
    })

    // Log the update
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        aldeiaId: id,
        action: 'UPDATE_ALDEIA',
        resource: 'Aldeia',
        resourceId: id,
        metadata: {
          nome: updatedAldeia.nome,
          updatedFields: Object.keys(updateData)
        }
      }
    })

    return NextResponse.json(updatedAldeia)
  } catch (error) {
    console.error('Error updating aldeia:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar aldeia' },
      { status: 500 }
    )
  }
}