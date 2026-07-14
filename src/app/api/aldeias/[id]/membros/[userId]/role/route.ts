import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for role update
const roleUpdateSchema = z.object({
  role: z.enum(['MEMBRO', 'MODERADOR'])
})

export async function POST(request: NextRequest, context: { params: Promise<{id: string; userId: string}> }) {
  try {
    const { id, userId } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const aldeiaId = id
    const targetUserId = userId

    // Check if the aldeia exists
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
      return NextResponse.json(
        { error: 'Aldeia não encontrada' },
        { status: 404 }
      )
    }

    // Check if the requesting user is a LIDER or MODERADOR in this aldeia
    const isLider = aldeia.admins.some((admin: any) => admin.id === user.userId) // Assuming LIDER is same as admin for now
    const isModerador = aldeia.userAldeiaRoles.some(
      (role: any) => role.role.name === 'MODERADOR'
    )

    if (!isLider && !isModerador) {
      return NextResponse.json(
        { error: 'Não autorizado para alterar roles nesta aldeia' },
        { status: 403 }
      )
    }

    // Check if the target user is a member of this aldeia
    const targetUserRole = await prisma.userAldeiaRole.findFirst({
      where: {
        aldeiaId,
        userId: targetUserId
      },
      include: { role: true }
    })

    if (!targetUserRole) {
      return NextResponse.json(
        { error: 'Utilizador não é membro desta aldeia' },
        { status: 404 }
      )
    }

    // Prevent changing the role of the aldeia LIDER (if we consider LIDER as admin)
    // For now, we'll allow changing any member's role except we won't allow assigning LIDER via this route
    const body = await request.json()
    const result = roleUpdateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.format() },
        { status: 400 }
      )
    }

    const { role } = result.data

    // Find the role in the database
    const roleRecord = await prisma.role.findUnique({
      where: { name: role }
    })

    if (!roleRecord) {
      return NextResponse.json(
        { error: 'Role inválido' },
        { status: 400 }
      )
    }

    // Update the user's role in the aldeia
    const updatedUserAldeiaRole = await prisma.userAldeiaRole.update({
      where: {
        id: targetUserRole.id
      },
      data: {
        roleId: roleRecord.id
      },
      include: {
        role: true,
        user: {
          select: { id: true, nome: true }
        }
      }
    })

    return NextResponse.json({ updatedUserAldeiaRole }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}