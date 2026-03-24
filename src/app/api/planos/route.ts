import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId');

    const where = aldeiaId ? { aldeiaId } : {};

    const planos = await prisma.plano.findMany({
      orderBy: { nome: 'asc' },
    });

    let aldeiaPlano = null;
    if (aldeiaId) {
      aldeiaPlano = await prisma.aldeia.findUnique({
        where: { id: aldeiaId },
        select: {
          planoId: true,
          dataInicioPlano: true,
          dataFimPlano: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        planos,
        planoAtual: aldeiaPlano,
      },
    });
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { nome, descricao, precoMensal, maxEventos, maxJogos, maxVendedores, maxParticipacoes } = body;

    if (!nome || precoMensal === undefined) {
      return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 });
    }

    const plano = await prisma.plano.create({
      data: {
        nome,
        descricao: descricao || null,
        precoMensal: precoMensal,
        maxEventos: maxEventos || 10,
        maxJogos: maxJogos || 50,
        maxVendedores: maxVendedores || 5,
        maxParticipacoes: maxParticipacoes || 1000,
      },
    });

    return NextResponse.json({ success: true, data: plano }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
