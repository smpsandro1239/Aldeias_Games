import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const participacao = await prisma.participacao.findUnique({
      where: { id },
    });

    if (!participacao) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });

    if (participacao.id !== user.id) {
       return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (participacao.revelado) {
       return NextResponse.json({ error: 'Já revelada' }, { status: 400 });
    }

    const updated = await prisma.participacao.update({
      where: { id },
      data: {
        revelado: true,
        dataRevelacao: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
