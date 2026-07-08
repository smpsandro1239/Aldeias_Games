import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function DELETE(request: NextRequest, context: { params: {id: string; userId: string} }) {
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
    const isLider = aldeia.admins.some(admin => admin.id === user.userId) // Assuming LIDER is same as admin for now
    const isModerador = aldeia.userAldeiaRoles.some(
      role => role.role.name === 'MODERADOR'
    )

    if (!isLider && !isModerador) {
      return NextResponse.json(
        { error: 'Não autorizado para remover membros desta aldeia' },
        { status: 403 }
      )
    }

    // Check if the target user is a member of this aldeia
    const targetUserRole = await prisma.userAldeiaRole.findFirst({
      where: {
        aldeiaId,
        userId: targetUserId
      },
      include: { role: true, user: true }
    })

    if (!targetUserRole) {
      return NextResponse.json(
        { error: 'Utilizador não é membro desta aldeia' },
        { status: 404 }
      )
    }

    // Prevent removing the aldeia LIDER (if we consider LIDER as admin)
    // The leader is represented in the aldeia.admins relation.
    const isTargetLider = aldeia.admins.some(admin => admin.id === targetUserId);
    if (isTargetLider) {
      return NextResponse.json(
        { error: 'Não é possível remover o líder da aldeia' },
        { status: 400 }
      );
    }

    // Remove the user from the aldeia
    await prisma.userAldeiaRole.delete({
      where: {
        id: targetUserRole.id
      }
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        aldeiaId,
        action: 'REMOVER_MEMBRO_ALDEIA',
        resource: 'UserAldeiaRole',
        resourceId: `${targetUserId}-${aldeiaId}`,
        metadata: {
          targetUserId,
          targetUserNome: targetUserRole.user.nome,
          removedRole: targetUserRole.role.name
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member from aldeia:', error)
    return NextResponse.json(
      { error: 'Erro ao remover membro da aldeia' },
      { status: 500 }
    )
  }
}