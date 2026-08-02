import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

interface ParticipacaoNumeroRow {
  id: string;
  userId: string | null;
  vendedorId: string | null;
  dadosParticipacao: unknown;
  nomeCliente: string | null;
  telefoneCliente: string | null;
  valorPago: number;
  metodoPagamento: string;
  estadoPagamento: string;
  hashParticipacao: string | null;
  hashRaspe: string | null;
  ganhador: boolean;
  premioEntregue: boolean;
  createdAt: Date;
  user: { id: string; nome: string | null } | null;
  vendedor: { id: string; nome: string | null } | null;
}

function extractNumeros(dadosParticipacao: unknown): number[] {
  if (!dadosParticipacao) return [];
  let parsed: unknown = dadosParticipacao;
  if (typeof dadosParticipacao === 'string') {
    try {
      parsed = JSON.parse(dadosParticipacao);
    } catch {
      return [];
    }
  }
  const obj = parsed as Record<string, unknown>;
  if (Array.isArray(parsed)) return parsed.map(Number);
  if (obj?.numeros && Array.isArray(obj.numeros)) return obj.numeros.map(Number);
  if (obj?.numero) return [Number(obj.numero)];
  return [];
}

// GET - Informação de um número já jogado numa rifa
// A rota é pública no proxy (/api/jogos/*), por isso a autorização é validada aqui:
// só super_admin, admin/vendedor da aldeia ou o próprio jogador vêem os detalhes.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; numero: string }> }
) {
  try {
    const { id: jogoId, numero: numeroParam } = await context.params;
    const numero = Number(numeroParam);
    if (!Number.isInteger(numero) || numero <= 0) {
      return NextResponse.json({ error: 'Número inválido' }, { status: 400 });
    }

    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      select: { id: true, nome: true, evento: { select: { aldeiaId: true } } },
    });
    if (!jogo) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Inicie sessão para ver os números já jogados.' },
        { status: 401 }
      );
    }

    const participacoes = (await prisma.participacao.findMany({
      where: { jogoId },
      select: {
        id: true,
        userId: true,
        vendedorId: true,
        dadosParticipacao: true,
        nomeCliente: true,
        telefoneCliente: true,
        valorPago: true,
        metodoPagamento: true,
        estadoPagamento: true,
        hashParticipacao: true,
        hashRaspe: true,
        ganhador: true,
        premioEntregue: true,
        createdAt: true,
        user: { select: { id: true, nome: true } },
        vendedor: { select: { id: true, nome: true } },
      },
    })) as unknown as ParticipacaoNumeroRow[];

    const matches = participacoes.filter((p) => extractNumeros(p.dadosParticipacao).includes(numero));
    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'Este número ainda não foi jogado' },
        { status: 404 }
      );
    }

    const isSuperAdmin = user.role === 'super_admin';
    const isAldeiaAdmin = user.role === 'aldeia_admin' && user.aldeiaId === jogo.evento.aldeiaId;
    const isVendedor = user.role === 'vendedor' && user.aldeiaId === jogo.evento.aldeiaId;
    const isOwner = matches.some((p) => p.userId === user.id);

    if (!isSuperAdmin && !isAldeiaAdmin && !isVendedor && !isOwner) {
      return NextResponse.json(
        { error: 'Sem permissão para ver este número' },
        { status: 403 }
      );
    }

    const dados = matches.map((p) => ({
      id: p.id,
      nomeCliente: p.nomeCliente || p.user?.nome || '—',
      telefoneCliente: p.telefoneCliente || null,
      vendedor: p.vendedor?.nome || null,
      data: p.createdAt,
      valorPago: p.valorPago,
      metodoPagamento: p.metodoPagamento,
      estadoPagamento: p.estadoPagamento,
      ganhador: p.ganhador,
      premioEntregue: p.premioEntregue,
      hash: p.hashParticipacao || p.hashRaspe || null,
    }));

    return NextResponse.json({
      numero,
      jogoNome: jogo.nome,
      participacoes: dados,
      totalParticipacoes: dados.length,
    });
  } catch (error) {
    console.error('Erro ao buscar informação do número:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
