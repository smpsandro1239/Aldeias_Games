import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/jogos/[id]/estatisticas — métricas de participação do jogo
// Apenas super_admin/aldeia_admin (da aldeia do jogo) e vendedores (da aldeia).
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const jogo = await prisma.jogo.findUnique({
      where: { id },
      select: {
        id: true,
        tipo: true,
        nome: true,
        configuracao: true,
        stockInicial: true,
        stockAtual: true,
        evento: { select: { aldeiaId: true } },
      },
    });
    if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });

    if (user.role === 'aldeia_admin' || user.role === 'vendedor') {
      if (jogo.evento.aldeiaId !== user.aldeiaId) {
        return NextResponse.json({ error: 'Não autorizado para este jogo' }, { status: 403 });
      }
    }

    const participacoes = await prisma.participacao.findMany({
      where: { jogoId: id, estadoPagamento: 'concluido' },
      select: { dadosParticipacao: true, createdAt: true, valorPago: true },
    });

    // --- Top números (euromilhões / rifa) ---
    const contagemNumeros = new Map<number, number>();
    // --- Top coordenadas (poio) ---
    const contagemCoordenadas = new Map<string, number>();
    // --- Vendas por dia ---
    const vendasPorDia = new Map<string, { quantidade: number; total: number }>();

    for (const p of participacoes) {
      const dia = p.createdAt.toISOString().slice(0, 10);
      const agg = vendasPorDia.get(dia) || { quantidade: 0, total: 0 };
      agg.quantidade += 1;
      agg.total += p.valorPago || 0;
      vendasPorDia.set(dia, agg);

      let dados: any = {};
      try {
        dados = typeof p.dadosParticipacao === 'string' ? JSON.parse(p.dadosParticipacao) : p.dadosParticipacao;
      } catch { continue; }

      if (typeof dados.numero === 'number') {
        contagemNumeros.set(dados.numero, (contagemNumeros.get(dados.numero) || 0) + 1);
      } else if (Array.isArray(dados.numeros)) {
        for (const n of dados.numeros) {
          contagemNumeros.set(Number(n), (contagemNumeros.get(Number(n)) || 0) + 1);
        }
      } else if (Array.isArray(dados.coordenadas)) {
        for (const c of dados.coordenadas) {
          if (typeof c?.letra === 'string' && typeof c?.numero === 'number') {
            const key = `${c.letra}${c.numero}`;
            contagemCoordenadas.set(key, (contagemCoordenadas.get(key) || 0) + 1);
          } else if (typeof c?.x === 'number' && typeof c?.y === 'number') {
            const key = `${String.fromCharCode(64 + c.x)}${c.y}`;
            contagemCoordenadas.set(key, (contagemCoordenadas.get(key) || 0) + 1);
          }
        }
      }
    }

    // --- Pool restante (raspadinha) ---
    let poolRestante: Array<{ nome: string; qtd: number }> = [];
    if (jogo.tipo === 'raspadinha') {
      try {
        const config = JSON.parse(jogo.configuracao || '{}');
        if (Array.isArray(config.pool)) {
          const contagem = new Map<string, number>();
          for (const item of config.pool) {
            contagem.set(item, (contagem.get(item) || 0) + 1);
          }
          poolRestante = Array.from(contagem.entries())
            .map(([nome, qtd]) => ({ nome, qtd }))
            .sort((a, b) => b.qtd - a.qtd);
        }
      } catch { /* ignore */ }
    }

    const topNumeros = Array.from(contagemNumeros.entries())
      .map(([numero, frequencia]) => ({ numero, frequencia }))
      .sort((a, b) => b.frequencia - a.frequencia || a.numero - b.numero)
      .slice(0, 10);

    const topCoordenadas = Array.from(contagemCoordenadas.entries())
      .map(([coordenada, frequencia]) => ({ coordenada, frequencia }))
      .sort((a, b) => b.frequencia - a.frequencia)
      .slice(0, 10);

    return NextResponse.json({
      jogoId: jogo.id,
      tipo: jogo.tipo,
      totalParticipacoes: participacoes.length,
      totalAngariado: participacoes.reduce((s, p) => s + (p.valorPago || 0), 0),
      stockAtual: jogo.stockAtual,
      stockInicial: jogo.stockInicial,
      topNumeros,
      topCoordenadas,
      poolRestante,
      vendasPorDia: Array.from(vendasPorDia.entries())
        .map(([data, v]) => ({ data, ...v }))
        .sort((a, b) => a.data.localeCompare(b.data)),
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
