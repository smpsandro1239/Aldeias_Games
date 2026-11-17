import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { createEventoSchema } from '@/lib/validations';
import { saveImage } from '@/lib/storage';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';
import { generateSlug } from '@/lib/utils';
import { computeFirstRecurrenceDate } from '@/lib/recurrence';

// GET - Listar eventos
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    const { page, limit } = getPaginationFromRequest(request);
    const skip = (page - 1) * limit;

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId');
    const publico = url.searchParams.get('publico');
    const incluirEliminados = url.searchParams.get('incluirEliminados') === 'true';

    // Construir where
    // Eventos eliminados (soft-delete) nunca aparecem em listas públicas
    let where: Record<string, unknown> = incluirEliminados ? {} : { eliminado: false };

    if (aldeiaId) {
      where.aldeiaId = aldeiaId;
    }

    if (publico === 'true') {
      where.publico = true;
      where.estado = 'ativo';
    }

    if (user) {
      if (user.role === 'aldeia_admin' && !aldeiaId && user.aldeiaId) {
        // Admin só vê eventos da sua aldeia
        where.aldeiaId = user.aldeiaId;
      } else if (user.role === 'vendedor' && !aldeiaId && user.aldeiaId) {
        // Vendedor só vê eventos da sua aldeia
        where.aldeiaId = user.aldeiaId;
      } else if (user.role === 'user' && !aldeiaId && user.aldeiaId) {
        // User normal só vê eventos da sua aldeia (se tiver aldeia associada)
        where.aldeiaId = user.aldeiaId;
      } else if (user.role === 'user' && !user.aldeiaId && !aldeiaId) {
        // User sem aldeia - mostra eventos públicos
        where.publico = true;
        where.estado = 'ativo';
      }
      // Super admin vê todos
    } else {
      // Não autenticado só vê públicos
      where.publico = true;
      where.estado = 'ativo';
    }

    const [eventos, total] = await Promise.all([
      prisma.evento.findMany({
        where,
        include: {
          aldeia: {
            select: {
              id: true,
              nome: true,
              slug: true,
              tipoOrganizacao: true,
              logoUrl: true,
            },
          },
          jogos: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              preco: true,
              stockInicial: true,
              estado: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { dataInicio: 'desc' },
      }),
      prisma.evento.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(eventos, total, page, limit)
    );
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar evento
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const validation = createEventoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar permissão para criar nesta aldeia
    if (user.role === 'aldeia_admin' && data.aldeiaId !== user.aldeiaId) {
      return NextResponse.json(
        { error: 'Não pode criar eventos para outra aldeia' },
        { status: 403 }
      );
    }

    // Gerar slug único
    let slug = generateSlug(data.nome);
    const existingSlug = await prisma.evento.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Processar imagem se fornecida
    let imagemUrl: string | undefined;
    if (data.imagemBase64) {
      const saved = await saveImage(data.imagemBase64, 'eventos');
      imagemUrl = saved.url;
    }

    const dInicio = new Date(data.dataInicio);
    const dFim = new Date(data.dataFim);

    if (isNaN(dInicio.getTime()) || isNaN(dFim.getTime())) {
      return NextResponse.json({ error: 'Datas inválidas' }, { status: 400 });
    }

    // Usar a mesma regra de cálculo partilhada com o cron e a pré-visualização.
    let proximaData: Date | undefined;
    if (data.isRecurring && data.recurrenceFrequency && data.recurrenceDayOfWeek !== undefined && data.recurrenceTime) {
      proximaData =
        computeFirstRecurrenceDate(
          data.recurrenceFrequency,
          data.recurrenceDayOfWeek,
          data.recurrenceTime
        ) ?? undefined;
    }

    // Criar evento
    const evento = await prisma.evento.create({
      data: {
        nome: data.nome,
        slug,
        descricao: data.descricao,
        imagemUrl,
        imagemBase64: data.imagemBase64,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        objectivoAngariacao: data.objectivoAngariacao,
        estado: data.estado,
        publico: data.publico,
        aldeiaId: data.aldeiaId,
        // Recorrência
        isTemplate: data.isRecurring || false,
        templateNome: data.isRecurring ? data.nome : undefined,
        frequenciaRecorrencia: data.recurrenceFrequency || undefined,
        diaSemanaRecorrencia: data.recurrenceDayOfWeek,
        proximaData,
        maxOcorrencias: data.isRecurring ? data.maxOccurrences : undefined,
      },
      include: {
        aldeia: {
          select: {
            id: true,
            nome: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: evento },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
