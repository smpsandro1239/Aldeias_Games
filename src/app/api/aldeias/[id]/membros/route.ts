import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

const addMemberSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['ALDEIA_ADMIN', 'MODERADOR', 'COLABORADOR', 'MEMBRO']).default('MEMBRO'),
})

export async function POST(request: NextRequest, context: { params: Promise<{id: string}> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const aldeiaId = id

    const aldeia = await prisma.aldeia.findUnique({
      where: { id: aldeiaId },
      include: {
        admins: { select: { id: true } },
        userAldeiaRoles: {
          where: { userId: user.userId },
          include: { role: true }
        }
      }
    })

    if (!aldeia) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 })
    }

    const isLider = aldeia.admins.some((a: any) => a.id === user.userId)
    const isModerador = aldeia.userAldeiaRoles.some((r: any) => r.role.name === 'MODERADOR')
    const isSuperAdmin = user.role === 'super_admin'

    if (!isLider && !isModerador && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não autorizado para adicionar membros' }, { status: 403 })
    }

    const body = await request.json()
    const result = addMemberSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.format() }, { status: 400 })
    }

    const { email, role } = result.data

    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado com este email' }, { status: 404 })
    }

    const existing = await prisma.userAldeiaRole.findFirst({
      where: { userId: targetUser.id, aldeiaId }
    })

    if (existing) {
      return NextResponse.json({ error: 'Este utilizador já é membro desta aldeia' }, { status: 409 })
    }

    const roleRecord = await prisma.role.findUnique({ where: { name: role } })
    if (!roleRecord) {
      return NextResponse.json({ error: 'Função inválida' }, { status: 400 })
    }

    const userAldeiaRole = await prisma.userAldeiaRole.create({
      data: {
        userId: targetUser.id,
        aldeiaId,
        roleId: roleRecord.id
      },
      include: {
        user: { select: { id: true, nome: true, role: true } },
        role: true
      }
    })

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        aldeiaId,
        action: 'ADICIONAR_MEMBRO_ALDEIA',
        resource: 'UserAldeiaRole',
        resourceId: userAldeiaRole.id,
        metadata: {
          targetUserId: targetUser.id,
          targetUserNome: targetUser.nome,
          addedRole: role
        }
      }
    })

    return NextResponse.json(userAldeiaRole, { status: 201 })
  } catch (error) {
    console.error('Error adding member to aldeia:', error)
    return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 })
  }
}
