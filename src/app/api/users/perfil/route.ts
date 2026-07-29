import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hashPassword } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validations';
import { saveImage, deleteImage } from '@/lib/storage';

// GET - Obter perfil do utilizador
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const perfil = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        aldeia: {
          select: {
            id: true,
            nome: true,
            slug: true,
            tipoOrganizacao: true,
          },
        },
        _count: {
          select: {
            participacoes: true,
          },
        },
      },
    });

    if (!perfil) {
      return NextResponse.json(
        { error: 'Utilizador não encontrado' },
        { status: 404 }
      );
    }

    // Calcular estatísticas
    const participacoes = await any.findMany({
      where: { userId: user.id },
      select: {
        valorPago: true,
        ganhador: true,
      },
    });

    const totalGasto = participacoes.reduce((sum: number, p: any) => sum + p.valorPago, 0);
    const totalVitorias = participacoes.filter((p: any) => p.ganhador).length;

      return NextResponse.json({
        success: true,
        data: {
          id: perfil.id,
          email: perfil.email,
          nome: perfil.nome,
          telefone: perfil.telefone,
          role: perfil.role,
          fotoUrl: perfil.fotoUrl,
          emailVerificado: perfil.emailVerificado,
          notificacoesEmail: perfil.notificacoesEmail,
          ultimoLogin: perfil.ultimoLogin,
          aldeiaId: perfil.aldeiaId,
          aldeia: perfil.aldeia,
          aldeiasPermitidas: perfil.aldeiasPermitidas ? JSON.parse(perfil.aldeiasPermitidas) : null,
          estatisticas: {
            totalParticipacoes: perfil._count.participacoes,
            totalGasto,
            totalVitorias,
          },
          createdAt: perfil.createdAt,
        },
      });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar perfil
export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Foto de perfil
    let fotoUrl: string | undefined | null;
    const current = await prisma.user.findUnique({ where: { id: user.id }, select: { fotoUrl: true } });

    if (data.fotoPerfil) {
      const saved = await saveImage(data.fotoPerfil, 'perfis');
      fotoUrl = saved.url;
      if (current?.fotoUrl && current.fotoUrl.startsWith('/uploads/')) {
        await deleteImage(current.fotoUrl).catch(() => {});
      }
    } else if (data.fotoPerfil === null) {
      fotoUrl = null;
      if (current?.fotoUrl && current.fotoUrl.startsWith('/uploads/')) {
        await deleteImage(current.fotoUrl).catch(() => {});
      }
    }

    const updateData: Record<string, unknown> = {
      nome: data.nome,
      telefone: data.telefone,
      notificacoesEmail: data.notificacoesEmail,
    };

    if (fotoUrl !== undefined) {
      updateData.fotoUrl = fotoUrl;
    }

    if (data.aldeiaId) {
      updateData.aldeiaId = data.aldeiaId;
    }

    if (data.aldeiasPermitidas) {
      updateData.aldeiasPermitidas = JSON.stringify({
        aldeias: data.aldeiasPermitidas.map(a => ({
          ...a,
          dataAdicao: new Date().toISOString(),
        })),
      });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nome: true,
        telefone: true,
        role: true,
        fotoUrl: true,
        notificacoesEmail: true,
        ultimoLogin: true,
        aldeiaId: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: updated,
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
