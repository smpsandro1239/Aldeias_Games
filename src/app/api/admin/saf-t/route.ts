import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { buildSafTFromDb } from '@/lib/saf-t';

// GET /api/admin/saf-t?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&aldeiaId=...
// Exportação fiscal SAF-T PT (v1.04_01) das vendas de um período
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const isAdmin = user.role === 'super_admin' || user.role === 'aldeia_admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Apenas administradores podem exportar SAF-T' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get('inicio');
    const fim = searchParams.get('fim');
    if (!inicio || !fim) {
      return NextResponse.json({ error: 'Parâmetros inicio e fim (YYYY-MM-DD) são obrigatórios' }, { status: 400 });
    }

    const aldeiaId = searchParams.get('aldeiaId');
    const dataInicio = new Date(`${inicio}T00:00:00Z`);
    const dataFim = new Date(`${fim}T23:59:59Z`);
    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime()) || dataInicio > dataFim) {
      return NextResponse.json({ error: 'Período inválido' }, { status: 400 });
    }

    // aldeia_admin só pode exportar a sua aldeia
    const targetAldeiaId = user.role === 'super_admin' ? aldeiaId : user.aldeiaId;
    if (!targetAldeiaId) {
      return NextResponse.json({ error: 'Aldeia não associada' }, { status: 400 });
    }

    const aldeia = await prisma.aldeia.findUnique({
      where: { id: targetAldeiaId },
      select: { id: true, nome: true, iban: true, email: true, telefone: true, morada: true, codigoPostal: true, localidade: true },
    });
    if (!aldeia) return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 });

    const company = {
      companyName: aldeia.nome,
      fiscalNumber: /^\d{9}$/.test(searchParams.get('nif') || '') ? searchParams.get('nif')! : '999999999',
      address: aldeia.morada || '',
      postalCode: aldeia.codigoPostal || '',
      city: aldeia.localidade || '',
      phone: aldeia.telefone || '',
      email: aldeia.email || '',
    };

    const { xml, count, total } = await buildSafTFromDb(prisma, aldeia.id, company, { dataInicio, dataFim });

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="saft-${aldeia.id}-${inicio}-${fim}.xml"`,
        'X-SafT-Count': String(count),
        'X-SafT-Total': total.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Error exporting SAF-T:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}