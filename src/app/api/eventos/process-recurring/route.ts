import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST - Processar eventos recorrentes (chamado por cron job)
export async function POST(request: NextRequest) {
  // Authenticate cron via CRON_SECRET header
  const cronSecret = request.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const now = new Date();

    // Encontrar eventos que são templates e cuja próxima data já passou
    const templates = await prisma.evento.findMany({
      where: {
        isTemplate: true,
        proximaData: {
          lte: now
        },
        // Garantir que não é um evento já passado
        dataFim: {
          gte: now
        }
      },
      include: {
        jogos: true
      }
    });

    const createdEvents = [];

    for (const template of templates) {
      if (!template.frequenciaRecorrencia || template.diaSemanaRecorrencia === null || !template.proximaData) {
        continue;
      }

      // Limite máximo de ocorrências atingido → parar recorrência
      if (template.maxOcorrencias !== null && template.maxOcorrencias !== undefined &&
          template.ocorrenciasCriadas >= template.maxOcorrencias) {
        await prisma.evento.update({
          where: { id: template.id },
          data: { proximaData: null }
        });
        continue;
      }

      // Calcular datas para o novo evento
      const eventStart = new Date(template.proximaData);
      const eventEnd = new Date(eventStart);
      eventEnd.setHours(eventStart.getHours() + (template.dataFim.getTime() - template.dataInicio.getTime()) / (1000 * 60 * 60)); // Mesma duração

      // Data da festa já passou antes da próxima ocorrência → parar recorrência
      if (eventStart > template.dataFim) {
        await prisma.evento.update({
          where: { id: template.id },
          data: { proximaData: null }
        });
        continue;
      }

      // Criar slug único
      let slug = `${template.slug}-${eventStart.toISOString().split('T')[0]}`;
      const existingSlug = await prisma.evento.findUnique({
        where: { slug },
      });

      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }

      // Criar novo evento
      const newEvent = await prisma.evento.create({
        data: {
          nome: template.templateNome || template.nome,
          slug,
          descricao: template.descricao,
          imagemUrl: template.imagemUrl,
          dataInicio: eventStart,
          dataFim: eventEnd,
          objectivoAngariacao: template.objectivoAngariacao,
          estado: 'ativo', // Eventos recorrentes são criados como ativos
          publico: template.publico,
          aldeiaId: template.aldeiaId,
          isTemplate: false, // Não é template
        }
      });

      // Criar jogos para o novo evento (copiar dos jogos do template)
      for (const jogo of template.jogos) {
        await prisma.jogo.create({
          data: {
            nome: jogo.nome,
            tipo: jogo.tipo,
            configuracao: jogo.configuracao,
            preco: jogo.preco,
            stockInicial: jogo.stockInicial,
            stockAtual: jogo.stockInicial,
            eventoId: newEvent.id,
            aldeiaId: template.aldeiaId,
            estado: 'aberto',
          }
        });
      }

      // Calcular próxima ocorrência
      const nextOccurrence = new Date(template.proximaData);

      if (template.frequenciaRecorrencia === 'semanal') {
        nextOccurrence.setDate(nextOccurrence.getDate() + 7);
      } else if (template.frequenciaRecorrencia === 'quinzenal') {
        nextOccurrence.setDate(nextOccurrence.getDate() + 14);
      } else if (template.frequenciaRecorrencia === 'mensal') {
        nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
        // Ajustar para o mesmo dia da semana
        const targetDay = template.diaSemanaRecorrencia;
        while (nextOccurrence.getDay() !== targetDay) {
          nextOccurrence.setDate(nextOccurrence.getDate() + (targetDay > nextOccurrence.getDay() ? 1 : -6));
        }
      }

      // Atualizar próxima data do template e contador de ocorrências
      const stopRecurrence = nextOccurrence > template.dataFim;
      await prisma.evento.update({
        where: { id: template.id },
        data: {
          proximaData: stopRecurrence ? null : nextOccurrence,
          ocorrenciasCriadas: { increment: 1 }
        }
      });

      createdEvents.push({
        id: newEvent.id,
        nome: newEvent.nome,
        dataInicio: newEvent.dataInicio,
        templateId: template.id
      });
    }

    return NextResponse.json({
      success: true,
      message: `Criados ${createdEvents.length} eventos recorrentes`,
      createdEvents
    });

  } catch (error) {
    console.error('Erro ao processar eventos recorrentes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}