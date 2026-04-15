import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirecionar para o endpoint específico com base no tipo de relatório
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') || 'participacoes';

  if (tipo === 'participacoes') {
    // Redirecionar para o endpoint de participações
    const participacoesUrl = new URL(request.url);
    participacoesUrl.pathname = '/api/export/participacoes';
    return NextResponse.redirect(participacoesUrl);
  } else if (tipo === 'vendas') {
    // Redirecionar para o endpoint de vendas
    const vendasUrl = new URL(request.url);
    vendasUrl.pathname = '/api/export/vendas';
    return NextResponse.redirect(vendasUrl);
  } else {
    return NextResponse.json(
      { error: 'Tipo de exportação não suportado' },
      { status: 400 }
    );
  }
}