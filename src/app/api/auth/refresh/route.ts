import { NextRequest, NextResponse } from 'next/server';
import { getFullUserFromRequest, generateToken, setAuthCookie } from '@/lib/auth';

// POST - Renovar token JWT com dados atualizados do utilizador
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Gerar novo token com dados atualizados
    const token = await generateToken({
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
      token,
    });

    // Atualizar cookie com novo token
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}