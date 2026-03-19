import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { createAldeiaSchema, updateAldeiaSchema } from '@/lib/validations';
import { saveImage } from '@/lib/storage';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';
import { generateSlug } from '@/lib/utils';

// GET - Listar aldeias
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    const { page, limit } = getPaginationFromRequest(request);
    const skip = (page - 1) * limit;

    // Construir where baseado no role
    let where: Record<string, unknown> = { ativo: true };

    if (user) {
      if (user.role === 'aldeia_admin') {
        // Admin de aldeia só vê a sua aldeia
        where = { id: user.aldeiaId };
      } else if (user.role === 'vendedor') {
        // Vendedor só vê a aldeia onde trabalha
        where = { id: user.aldeiaId };
      }
      // Super admin vê todas
    } else {
      // Utilizador não autenticado só vê aldeias verificadas e públicas
      where = { ativo: true, verificado: true };
    }

    // Buscar aldeias
    const [aldeias, total] = await Promise.all([
      prisma.aldeia.findMany({
        where,
        include: {
          plano: true,
          _count: {
            select: {
              eventos: true,
              admins: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.aldeia.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(aldeias, total, page, limit)
    );
  } catch (error) {
    console.error('Erro ao listar aldeias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar aldeia
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin'])) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createAldeiaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Gerar slug único
    let slug = generateSlug(data.nome);
    const existingSlug = await prisma.aldeia.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Processar logo se fornecido
    let logoUrl: string | undefined;
    if (data.logoBase64) {
      const saved = await saveImage(data.logoBase64, 'aldeias');
      logoUrl = saved.url;
    }

    // Buscar plano gratuito
    const planoGratuito = await prisma.plano.findFirst({
      where: { nome: 'Gratuito' },
    });

    // Criar aldeia
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: data.nome,
        slug,
        tipoOrganizacao: data.tipoOrganizacao,
        descricao: data.descricao,
        logoUrl,
        logoBase64: data.logoBase64,
        nomeEscola: data.nomeEscola,
        codigoEscola: data.codigoEscola,
        nivelEnsino: data.nivelEnsino,
        responsavel: data.responsavel,
        telefone: data.telefone,
        email: data.email,
        morada: data.morada,
        codigoPostal: data.codigoPostal,
        localidade: data.localidade,
        autorizacaoCM: data.autorizacaoCM,
        numeroAlvara: data.numeroAlvara,
        ativo: true,
        verificado: false,
        planoId: planoGratuito?.id,
      },
      include: {
        plano: true,
      },
    });

    return NextResponse.json(
      { success: true, data: aldeia },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar aldeia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
