import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { generateCSV } from '@/lib/export-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/jogos/[id]/exportar?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
// Exporta CSV das participações do jogo (admins e vendedores da aldeia).
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const jogo = await prisma.jogo.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        tipo: true,
        evento: { select: { aldeiaId: true, nome: true } },
      },
    });
    if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });

    if (user.role === 'aldeia_admin' || user.role === 'vendedor') {
      if (jogo.evento.aldeiaId !== user.aldeiaId) {
        return NextResponse.json({ error: 'Não autorizado para este jogo' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get('inicio');
    const fim = searchParams.get('fim');

    const where: Record<string, unknown> = { jogoId: id };
    if (inicio && /^\d{4}-\d{2}-\d{2}$/.test(inicio)) {
      where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(`${inicio}T00:00:00.000Z`) };
    }
    if (fim && /^\d{4}-\d{2}-\d{2}$/.test(fim)) {
      const fimDate = new Date(`${fim}T23:59:59.999Z`);
      where.createdAt = { ...(where.createdAt as object || {}), lte: fimDate };
    }

    const participacoes = await prisma.participacao.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        valorPago: true,
        metodoPagamento: true,
        estadoPagamento: true,
        ganhador: true,
        premioEntregue: true,
        nomeCliente: true,
        telefoneCliente: true,
        emailCliente: true,
        dadosParticipacao: true,
        user: { select: { nome: true, email: true } },
        vendedor: { select: { nome: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const headers = [
      'ID', 'Data', 'Número(s)', 'Valor (€)', 'Pagamento', 'Estado',
      'Ganhador', 'Prémio Entregue', 'Cliente', 'Telefone', 'Email', 'Vendedor',
    ];

    const rows = participacoes.map((p) => {
      let numeros = '';
      try {
        const dados = typeof p.dadosParticipacao === 'string' ? JSON.parse(p.dadosParticipacao) : p.dadosParticipacao;
        if (typeof dados.numero === 'number') numeros = String(dados.numero);
        else if (Array.isArray(dados.numeros)) numeros = dados.numeros.join(';');
        else if (Array.isArray(dados.coordenadas)) {
          numeros = dados.coordenadas.map((c: any) => {
            if (typeof c?.letra === 'string') return `${c.letra}${c.numero}`;
            if (typeof c?.x === 'number') return `${String.fromCharCode(64 + c.x)}${c.y}`;
            return '';
          }).join(';');
        }
      } catch { /* ignore */ }

      return [
        p.id,
        p.createdAt.toISOString(),
        numeros,
        p.valorPago,
        p.metodoPagamento,
        p.estadoPagamento,
        p.ganhador ? 'Sim' : 'Não',
        p.premioEntregue ? 'Sim' : 'Não',
        p.nomeCliente || p.user?.nome || '',
        p.telefoneCliente || '',
        p.emailCliente || p.user?.email || '',
        p.vendedor?.nome || '',
      ];
    });

    const csv = '\uFEFF' + generateCSV(headers, rows);
    const nomeFicheiro = `participacoes-${jogo.nome.replace(/[^\w-]/g, '_')}-${id.slice(-8)}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${nomeFicheiro}"`,
        'X-SafT-Count': String(participacoes.length),
      },
    });
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
