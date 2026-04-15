import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const aldeia = await prisma.aldeia.findUnique({
      where: { slug },
      include: {
        eventos: {
          where: { estado: 'ativo', publico: true },
          include: {
            jogos: {
              where: { estado: 'aberto' },
              select: {
                id: true,
                nome: true,
                tipo: true,
                preco: true,
                stockAtual: true,
                totalParticipacoes: true,
              },
            },
          },
        },
      },
    }) as any;

    if (!aldeia) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    const data = {
      nome: aldeia.nome,
      descricao: aldeia.descricao,
      logo: aldeia.logoUrl || aldeia.logoBase64,
      contactos: {
        telefone: aldeia.telefone,
        email: aldeia.email,
        morada: aldeia.morada,
      },
      eventos: (aldeia.eventos || []).map((evento: any) => ({
        id: evento.id,
        nome: evento.nome,
        descricao: evento.descricao,
        imagem: evento.imagemUrl || evento.imagemBase64,
        dataInicio: evento.dataInicio,
        dataFim: evento.dataFim,
        jogos: (evento.jogos || []).map((jogo: any) => ({
          id: jogo.id,
          nome: jogo.nome,
          tipo: jogo.tipo,
          preco: jogo.preco,
          stock: jogo.stockAtual,
          participacoes: jogo.totalParticipacoes,
        })),
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar dados da aldeia:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}