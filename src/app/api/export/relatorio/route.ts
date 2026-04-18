import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

function generatePDFReport(data: any, type: string): string {
  // Simplified HTML report that can be printed
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório - ${type}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #ff734b; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #ff734b; color: white; }
    .total { font-weight: bold; font-size: 18px; }
    .date { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Aldeias Games - ${type}</h1>
  <p class="date">Gerado em: ${new Date().toLocaleString('pt-PT')}</p>
  ${data}
</body>
</html>`;
  return html;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { tipo, aldeiaId, eventoId, dataInicio, dataFim } = body;

    let html = '';

    switch (tipo) {
      case 'vendas': {
        const vendas = await prisma.transacao.findMany({
          where: {
            tipo: { in: ['venda', 'pagamento'] as any },
            ...(dataInicio && dataFim ? {
              createdAt: {
                gte: new Date(dataInicio),
                lte: new Date(dataFim),
              }
            } : {}),
          },
          include: { user: { select: { nome: true, aldeiaId: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        });
        
        // Filter by aldeia in JavaScript
        const filteredVendas = vendas.filter(v => v.user?.aldeiaId === user.aldeiaId);

        let total = 0;
        const rows = filteredVendas.map(v => {
          total += v.valor;
          return `<tr>
            <td>${new Date(v.createdAt).toLocaleDateString('pt-PT')}</td>
            <td>${v.user?.nome || 'N/A'}</td>
            <td>${v.tipo}</td>
            <td>${v.valor.toFixed(2)}€</td>
          </tr>`;
        }).join('');

        html = `<table>
          <tr><th>Data</th><th>Vendedor</th><th>Tipo</th><th>Valor</th></tr>
          ${rows}
          <tr><td colspan="3" class="total">Total</td><td class="total">${total.toFixed(2)}€</td></tr>
        </table>`;
        break;
      }
      case 'jogos': {
        const jogos = await prisma.jogo.findMany({
          where: { aldeiaId: user.aldeiaId },
          include: { evento: { select: { nome: true } } },
          orderBy: { createdAt: 'desc' },
        });

        const rows = jogos.map(j => `<tr>
          <td>${j.nome}</td>
          <td>${j.tipo}</td>
          <td>${j.estado}</td>
          <td>${j.stockAtual}/${j.stockInicial}</td>
        </tr>`).join('');

        html = `<table>
          <tr><th>Jogo</th><th>Tipo</th><th>Estado</th><th>Stock</th></tr>
          ${rows}
        </table>`;
        break;
      }
      case 'vendedores': {
        const vendedores = await prisma.user.findMany({
          where: { aldeiaId: user.aldeiaId, role: 'vendedor' },
          select: { nome: true, email: true, comissaoTotal: true, saldo: true },
        });

        const rows = vendedores.map(v => `<tr>
          <td>${v.nome}</td>
          <td>${v.email}</td>
          <td>${(v.comissaoTotal || 0).toFixed(2)}€</td>
          <td>${(v.saldo || 0).toFixed(2)}€</td>
        </tr>`).join('');

        html = `<table>
          <tr><th>Nome</th><th>Email</th><th>Comissões</th><th>Saldo</th></tr>
          ${rows}
        </table>`;
        break;
      }
      default:
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    const report = generatePDFReport(html, tipo === 'vendas' ? 'Vendas' : tipo === 'jogos' ? 'Jogos' : 'Vendedores');

    return new NextResponse(report, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="relatorio-${tipo}-${Date.now()}.html"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}