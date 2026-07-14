import { NextRequest, NextResponse } from 'next/server';
import {
  getRefreshTokenFromCookie,
  validateRefreshToken,
  rotateRefreshToken,
  generateToken,
  setAuthCookie,
  setRefreshTokenCookie,
} from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST - Renovar access token usando refresh token com rotação
export async function POST(request: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromCookie(request);

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token não fornecido' },
        { status: 401 }
      );
    }

    // Rotacionar: revoga o antigo e cria um novo
    const newRefreshToken = await rotateRefreshToken(refreshToken);

    if (!newRefreshToken) {
      return NextResponse.json(
        { error: 'Refresh token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Buscar dados do utilizador com o novo token
    const validation = await validateRefreshToken(newRefreshToken);
    if (!validation) {
      return NextResponse.json(
        { error: 'Erro ao validar novo token' },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: validation.userId },
      select: {
        id: true,
        email: true,
        nome: true,
        telefone: true,
        role: true,
        aldeiaId: true,
        aldeia: true,
        notificacoesEmail: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilizador não encontrado' },
        { status: 404 }
      );
    }

    // Gerar novo access token
    const accessToken = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      aldeiaId: user.aldeiaId || undefined,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Token renovado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        telefone: user.telefone,
        role: user.role,
        aldeiaId: user.aldeiaId,
        aldeia: user.aldeia,
      },
      token: accessToken,
    });

    setAuthCookie(response, accessToken);
    setRefreshTokenCookie(response, newRefreshToken);

    return response;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
