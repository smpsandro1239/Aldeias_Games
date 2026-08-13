import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { requirePermission } from '@/lib/rbac/checkPermission'
import { z } from 'zod'

// Validation schema for updating an aldeia
const updateAldeiaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
  descricao: z.string().optional(),
  logoUrl: z.string().url('URL inválida para logo').optional(),
  bannerUrl: z.string().url('URL inválida para banner').optional().or(z.literal('')),
  tipoOrganizacao: z.enum(['aldeia', 'escola', 'associacao_pais', 'clube']).optional(),
  permitirStripe: z.boolean().optional(),
  permitirMBWay: z.boolean().optional(),
  metodosPagamentoDefault: z.string().optional(),
  metodosPagamentoAceites: z.string().optional(),
  iban: z.string().optional(),
  nomeTitularConta: z.string().optional(),
  telefoneMBWay: z.string().optional(),
  emailPagamentos: z.string().optional(),
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
  verificado: z.boolean().optional(),
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
            },
            role: true
          }
        },
        admins: {
          select: { id: true, nome: true }
        },
        vendedores: {
          select: { id: true, nome: true }
        },
        eventos: {
          include: {
            jogos: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                preco: true,
                ativo: true,
                _count: { select: { participacoes: true } }
              }
            }
          },
          orderBy: { dataInicio: 'desc' }
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
    const isMember = user && aldeia.userAldeiaRoles.some((uar: any) => uar.userId === user.userId)
    const isSuperAdmin = user && user.role === 'super_admin'
    const isPublic = aldeia.ativo && aldeia.verificado

    if (!isPublic && !isMember && !isSuperAdmin) {
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

async function updateAldeia(request: NextRequest, context: { params: Promise<{id: string}> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Check if user is admin of this aldeia or super_admin
    const denied = await requirePermission(user.userId, 'MANAGE_ALDEIA', id)
    if (denied) return denied

    // Fetch aldeia for ownership checks and sensitive field handling
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

    const body = await request.json()
    const result = updateAldeiaSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.format() },
        { status: 400 }
      )
    }

    const updateData = result.data

    // Only super_admin can change verificado
    if (updateData.verificado !== undefined) {
      const deniedVerificado = await requirePermission(user.userId, 'MANAGE_USERS')
      if (deniedVerificado) return deniedVerificado
    }

    // Sensitive fields (IBAN, nomeTitularConta) require special handling
    const sensitiveFields = ['iban', 'nomeTitularConta', 'telefoneMBWay', 'emailPagamentos']
    const hasSensitiveChanges = sensitiveFields.some(f => updateData[f as keyof typeof updateData] !== undefined)

    if (hasSensitiveChanges) {
      const isSuperAdminCheck = await requirePermission(user.userId, 'MANAGE_USERS')
      // If not super_admin, create pending request instead of direct edit
      if (isSuperAdminCheck) {
      // Extract only sensitive field changes and create pending requests
      const pendingRequests: Promise<any>[] = []
      const notifications: Promise<any>[] = []

      for (const campo of sensitiveFields) {
        const newVal = updateData[campo as keyof typeof updateData]
        if (newVal !== undefined) {
          const oldVal = (aldeia as any)[campo] || null

          // Check for existing pending change on same field
          const existingPending = await prisma.pendingAldeiaChange.findFirst({
            where: { aldeiaId: id, campo, estado: 'pendente' },
          })

          if (!existingPending) {
            pendingRequests.push(
              prisma.pendingAldeiaChange.create({
                data: {
                  aldeiaId: id,
                  requestedById: user.userId,
                  campo,
                  valorAntes: oldVal,
                  valorDepois: newVal as string,
                },
              })
            )

            // Notify other admins
            const otherAdmins = aldeia.admins.filter((admin: any) => admin.id !== user.userId)
            for (const admin of otherAdmins) {
              notifications.push(
                prisma.notificacao.create({
                  data: {
                    userId: admin.id,
                    tipo: 'sistema' as const,
                    titulo: 'Alteração de dados sensíveis pendente',
                    mensagem: `Alteração de ${campo === 'iban' ? 'IBAN' : 'titular da conta'} na aldeia "${aldeia.nome}" aguarda a sua aprovação.`,
                    lida: false,
                  },
                })
              )
            }

            // Notify super admins
            const superAdmins = await prisma.user.findMany({
              where: { role: 'super_admin' },
              select: { id: true },
            })
            for (const sa of superAdmins) {
              notifications.push(
                prisma.notificacao.create({
                  data: {
                    userId: sa.id,
                    tipo: 'sistema' as const,
                    titulo: 'Alteração de dados sensíveis pendente',
                    mensagem: `Alteração de ${campo === 'iban' ? 'IBAN' : 'titular da conta'} na aldeia "${aldeia.nome}" aguarda aprovação.`,
                    lida: false,
                  },
                })
              )
            }

            // Remove from updateData so it's not applied directly
            delete updateData[campo as keyof typeof updateData]
          } else {
            // Remove from updateData — already pending
            delete updateData[campo as keyof typeof updateData]
          }
        }
      }

      await Promise.all([...pendingRequests, ...notifications])

      // If no other fields to update, return success with pending info
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({
          success: true,
          pendingSensitiveChanges: true,
          message: 'Alterações sensíveis ficam pendentes de aprovação de outro administrador.',
        })
      }
    }
    }

    // Prepare data for Prisma update
    const prismaUpdateData: Prisma.AldeiaUpdateInput = { ...updateData }

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
    const metadata: Record<string, unknown> = {
      nome: updatedAldeia.nome,
      updatedFields: Object.keys(updateData)
    }
    // Add audit trail for sensitive fields
    if (updateData.iban !== undefined) {
      metadata.ibanAlterado = true
      metadata.ibanAnterior = aldeia.iban ? '****' + aldeia.iban.slice(-4) : null
      metadata.ibanNovo = updateData.iban ? '****' + updateData.iban.slice(-4) : null
    }
    if (updateData.nomeTitularConta !== undefined) {
      metadata.titularAlterado = true
      metadata.titularAnterior = aldeia.nomeTitularConta
      metadata.titularNovo = updateData.nomeTitularConta
    }

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        aldeiaId: id,
        action: 'UPDATE_ALDEIA',
        resource: 'Aldeia',
        resourceId: id,
        metadata: metadata as any
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

export { updateAldeia as PATCH, updateAldeia as PUT }