import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

const editMemberSchema = z
  .object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
    email: z.string().email('Email inválido').optional(),
  })
  .refine((data) => data.nome !== undefined || data.email !== undefined, {
    message: 'Pelo menos um campo (nome ou email) é obrigatório',
  })

export async function GET(request: NextRequest, context: { params: Promise<{ id: string; membroId: string }> }) {
  try {
    const { id, membroId } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: {
        admins: { select: { id: true } },
        userAldeiaRoles: {
          where: { userId: user.userId },
          include: { role: true },
        },
      },
    })

    if (!aldeia) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 })
    }

    const isLider = aldeia.admins.some((admin: any) => admin.id === user.userId)
    const isModerador = aldeia.userAldeiaRoles.some((r: any) => r.role.name === 'MODERADOR')
    const isSuperAdmin = user.role === 'super_admin'

    if (!isLider && !isModerador && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não autorizado para ver membros desta aldeia' }, { status: 403 })
    }

    const membership = await prisma.userAldeiaRole.findFirst({
      where: { aldeiaId: id, userId: membroId },
      include: {
        role: true,
        user: { select: { id: true, nome: true, email: true, role: true, telefone: true } },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Utilizador não é membro desta aldeia' }, { status: 404 })
    }

    return NextResponse.json({ user: membership.user, role: membership.role.name })
  } catch (error) {
    console.error('Error fetching member:', error)
    return NextResponse.json({ error: 'Erro ao obter membro da aldeia' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; membroId: string }> }) {
  try {
    const { id, membroId } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: {
        admins: { select: { id: true } },
        userAldeiaRoles: {
          where: { userId: user.userId },
          include: { role: true },
        },
      },
    })

    if (!aldeia) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 })
    }

    const isLider = aldeia.admins.some((admin: any) => admin.id === user.userId)
    const isModerador = aldeia.userAldeiaRoles.some((r: any) => r.role.name === 'MODERADOR')
    const isSuperAdmin = user.role === 'super_admin'

    if (!isLider && !isModerador && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não autorizado para editar membros desta aldeia' }, { status: 403 })
    }

    const membership = await prisma.userAldeiaRole.findFirst({
      where: { aldeiaId: id, userId: membroId },
      select: { id: true },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Utilizador não é membro desta aldeia' }, { status: 404 })
    }

    const isTargetLider = aldeia.admins.some((admin: any) => admin.id === membroId)
    if (isTargetLider) {
      return NextResponse.json({ error: 'Não é possível editar o líder da aldeia' }, { status: 400 })
    }

    const body = await request.json()
    const result = editMemberSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.format() }, { status: 400 })
    }
    const { nome, email } = result.data

    if (email) {
      const emailExists = await prisma.user.findFirst({
        where: { email, NOT: { id: membroId } },
        select: { id: true },
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Email já registado por outro utilizador' }, { status: 409 })
      }
    }

    const updates: Record<string, string> = {}
    if (nome !== undefined) updates.nome = nome
    if (email !== undefined) updates.email = email

    const targetUser = await prisma.user.update({
      where: { id: membroId },
      data: updates,
      select: { id: true, nome: true, email: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        aldeiaId: id,
        action: 'EDITAR_MEMBRO_ALDEIA',
        resource: 'User',
        resourceId: membroId,
        metadata: {
          targetUserId: membroId,
          targetUserNome: targetUser.nome,
          alteracoes: Object.keys(updates),
        },
      },
    })

    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error('Error editing member:', error)
    return NextResponse.json({ error: 'Erro ao editar membro' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; membroId: string }> }) {
  try {
    const { id, membroId } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const aldeiaId = id
    const targetUserId = membroId

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
      include: {
        role: true,
        user: { select: { id: true, nome: true, email: true } }
      }
    })

    if (!targetUserRole) {
      return NextResponse.json(
        { error: 'Utilizador não é membro desta aldeia' },
        { status: 404 }
      )
    }

    // Prevent removing the aldeia LIDER (if we consider LIDER as admin)
    // The leader is represented in the aldeia.admins relation.
    const isTargetLider = aldeia.admins.some((admin: any) => admin.id === targetUserId);
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
