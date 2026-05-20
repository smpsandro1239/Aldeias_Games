import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for joining an aldeia
const entrarAldeiaSchema = z.object({
  // No specific fields needed for now, but we could add a message or motivation later
  // For now, just an empty object to validate the request body structure
}).strip()

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const aldeiaId = params.id

    // Check if aldeia exists and is active/verified
    const aldeia = await prisma.aldeia.findUnique({
      where: { id: aldeiaId },
      select: { id: true, nome: true, ativo: true, verificado: true }
    })

    if (!aldeia) {
      return NextResponse.json(
        { error: 'Aldeia não encontrada' },
        { status: 404 }
      )
    }

    if (!aldeia.ativo || !aldeia.verificado) {
      return NextResponse.json(
        { error: 'Aldeia não está disponível para entrada' },
        { status: 403 }
      )
    }

    // Check if user is already a member of this aldeia
    const existingMembership = await prisma.userAldeiaRole.findFirst({
      where: {
        userId: user.id,
        aldeiaId: aldeiaId
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Você já é membro desta aldeia' },
        { status: 409 }
      )
    }

    // Check if user is already in another aldeia (optional rule)
    // For now, we allow users to be in multiple aldeias, but we could restrict this
    // Uncomment the following lines if you want to restrict to one aldeia per user:
    /*
    const userInAnyAldeia = await prisma.userAldeiaRole.findFirst({
      where: { userId: user.id }
    })
    
    if (userInAnyAldeia) {
      return NextResponse.json(
        { error: 'Você já é membro de outra aldeia' },
        { status: 409 }
      )
    }
    */

    // Add user as a MEMBRO (member) of the aldeia
    // First, we need to get the MEMBRO role ID
    const membroRole = await prisma.role.findFirst({
      where: { name: 'MEMBRO' }
    })

    if (!membroRole) {
      return NextResponse.json(
        { error: 'Erro interno: papel de membro não encontrado' },
        { status: 500 }
      )
    }

    const userAldeiaRole = await prisma.userAldeiaRole.create({
      data: {
        userId: user.id,
        aldeiaId: aldeiaId,
        roleId: membroRole.id
      },
      include: {
        user: {
          select: { id: true, nome: true }
        },
        aldeia: {
          select: { id: true, nome: true }
        },
        role: {
          select: { id: true, name: true }
        }
      }
    })

    // Update aldeia membrosAtivos count (we'll do this in a transaction or trigger, but for now we'll update it)
    // Actually, we're calculating this dynamically in the GET endpoints, so no need to store it
    // But if we want to keep the denormalized field for performance, we would update it here
    /*
    await prisma.aldeia.update({
      where: { id: aldeiaId },
      data: {
        membrosAtivos: {
          increment: 1
        }
      }
    })
    */

    // Log the entry
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        aldeiaId: aldeiaId,
        action: 'ENTER_ALDEIA',
        resource: 'UserAldeiaRole',
        resourceId: userAldeiaRole.id,
        metadata: { 
          userName: user.nome,
          aldeiaName: aldeia.nome,
          role: membroRole.name
        }
      }
    })

    return NextResponse.json(userAldeiaRole, { status: 201 })
  } catch (error) {
    console.error('Error entering aldeia:', error)
    return NextResponse.json(
      { error: 'Erro ao entrar na aldeia' },
      { status: 500 }
    )
  }
}