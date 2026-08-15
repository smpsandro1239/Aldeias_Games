import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { logSorteio } from '@/lib/audit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    // RATE LIMITING: limite de testes de sorteio (10/min - mais restritivo)
    const rateLimitKey = `sorteio-teste:${user.id}`;
    const rateLimit = await checkRateLimit(rateLimitKey, {
      ...rateLimitConfigs.api,
      maxRequests: 10,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetTime);
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const testesHoje = await prisma.auditLog.count({
      where: {
        userId: user.id,
        action: 'sorteio.teste',
        createdAt: { gte: hoje },
      },
    });
    if (testesHoje >= 50) {
      return NextResponse.json(
        { error: 'Limite diário de 50 testes de sorteio atingido.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { jogoId } = body;

    if (!jogoId) {
      return NextResponse.json({ error: 'jogoId é obrigatório' }, { status: 400 });
    }

    // Buscar jogo
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: {
        evento: true,
        participacoes: {
          where: { estadoPagamento: 'concluido' },
          include: { user: { select: { id: true, nome: true, email: true, telefone: true } } },
        },
      },
    });

    if (!jogo) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    if (user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: 'Não pode testar jogos de outra aldeia' }, { status: 403 });
    }

    // Se não há participações reais, gerar dados fictícios para teste
    const totalParticipacoes = jogo.participacoes.length;

    if (totalParticipacoes === 0) {
      return NextResponse.json({
        success: false,
        message: 'Não há participações reais para testar. Crie Participações primeiro.',
        data: { totalParticipacoes: 0, modoTeste: true },
      }, { status: 400 });
    }

    // Gerar seed aleatória para teste
    const seed = crypto.randomBytes(32).toString('hex');
    let resultado: Record<string, unknown>;
    let vencedores: { posicao: number; participacaoId: string; dados: unknown }[] = [];
    let vencedoresDetalhes: any[] = [];

    if (jogo.tipo === 'poio_da_vaca') {
      const config = JSON.parse(jogo.configuracao);
      // Sortear letra e número com base na seed
      const seedNum = parseInt(seed.slice(0, 8), 16);
      const letraIndex = seedNum % config.letras.length;
      const letra = config.letras[letraIndex];
      const numero = (seedNum % config.numerosPorLetra) + 1;

      resultado = { letraVencedora: letra, numeroVencedor: numero };

      // Encontrar vencedores entre as participações reais (formato handler
      // `coordenadas` OU formato legacy `letra`+`numero`)
      const vencedoresPoio = jogo.participacoes.filter((p: (typeof jogo.participacoes)[number]) => {
        const dados = JSON.parse(p.dadosParticipacao as string);
        if (dados.letra === letra && dados.numero === numero) return true;
        if (Array.isArray(dados.coordenadas)) {
          return dados.coordenadas.some((c: any) => c.y === numero && config.letras[c.x - 1] === letra);
        }
        return false;
      });

      vencedores = vencedoresPoio.map((v: (typeof vencedoresPoio)[number], index: number) => ({
        posicao: index + 1,
        participacaoId: v.id,
        dados: {
          userId: v.user?.id ?? v.userId,
          userNome: v.user?.nome || v.nomeCliente,
          userEmail: v.user?.email || v.emailCliente,
          userTelefone: v.user?.telefone || v.telefoneCliente,
          letra,
          numero,
        },
      }));

      vencedoresDetalhes = vencedores.map(v => ({
        posicao: v.posicao,
        userId: (v.dados as any).userId,
        userNome: (v.dados as any).userNome,
        userEmail: (v.dados as any).userEmail,
        userTelefone: (v.dados as any).userTelefone,
        letra: (v.dados as any).letra,
        numero: (v.dados as any).numero,
      }));
    } else if (jogo.tipo === 'rifa') {
      const config = JSON.parse(jogo.configuracao);
      const seedNum = parseInt(seed.slice(0, 8), 16);
      const numeroVencedor = (seedNum % (config.numeroFinal - config.numeroInicial + 1)) + config.numeroInicial;

      resultado = { numeroVencedor };

      // Encontrar vencedores entre as participações reais (formato novo
      // `{numero: N}` da M1 + legacy `{numeros: [...]}`)
      const vencedoresRifa = jogo.participacoes.filter((p: (typeof jogo.participacoes)[number]) => {
        const dados = JSON.parse(p.dadosParticipacao as string);
        if (dados.numero === numeroVencedor) return true;
        if (Array.isArray(dados.numeros)) return dados.numeros.includes(numeroVencedor);
        return false;
      });

      vencedores = vencedoresRifa.map((v: (typeof vencedoresRifa)[number], index: number) => ({
        posicao: index + 1,
        participacaoId: v.id,
        dados: {
          userId: v.user?.id ?? v.userId,
          userNome: v.user?.nome || v.nomeCliente,
          userEmail: v.user?.email || v.emailCliente,
          userTelefone: v.user?.telefone || v.telefoneCliente,
          numero: numeroVencedor,
        },
      }));

      vencedoresDetalhes = vencedores.map(v => ({
        posicao: v.posicao,
        userId: (v.dados as any).userId,
        userNome: (v.dados as any).userNome,
        userEmail: (v.dados as any).userEmail,
        userTelefone: (v.dados as any).userTelefone,
        numero: (v.dados as any).numero,
      }));
    } else if (jogo.tipo === 'euromilhoes') {
      // Sorteia um número 1-50; com 1 participação = 1 número (M4) o vencedor
      // é a participação com `dadosParticipacao.numero` exatamente esse.
      const numeroVencedor = (parseInt(seed.slice(0, 8), 16) % 50) + 1;

      resultado = { numeroVencedor };

      const vencedoresEuro = jogo.participacoes.filter((p: (typeof jogo.participacoes)[number]) => {
        const dados = JSON.parse(p.dadosParticipacao as string);
        if (dados.numero === numeroVencedor) return true;
        if (Array.isArray(dados.numeros)) return dados.numeros.includes(numeroVencedor);
        const nums: number[] = JSON.parse((p as any).numerosSelecionados || '[]');
        return Array.isArray(nums) && nums.includes(numeroVencedor);
      });

      vencedores = vencedoresEuro.map((v: (typeof vencedoresEuro)[number], index: number) => ({
        posicao: index + 1,
        participacaoId: v.id,
        dados: {
          userId: v.user?.id ?? v.userId,
          userNome: v.user?.nome || v.nomeCliente,
          userEmail: v.user?.email || v.emailCliente,
          userTelefone: v.user?.telefone || v.telefoneCliente,
          numero: numeroVencedor,
        },
      }));

      vencedoresDetalhes = vencedores.map(v => ({
        posicao: v.posicao,
        userId: (v.dados as any).userId,
        userNome: (v.dados as any).userNome,
        userEmail: (v.dados as any).userEmail,
        userTelefone: (v.dados as any).userTelefone,
        numero: (v.dados as any).numero,
      }));
    } else {
      return NextResponse.json({ error: 'Tipo de jogo não suportado para teste' }, { status: 400 });
    }

     // Gerar hash de auditoria
     const hash = crypto
       .createHash('sha256')
       .update(`${seed}:${JSON.stringify(resultado)}:${Date.now()}`)
       .digest('hex');

     // Log auditoria: sorteio em modo teste
     await logSorteio(
       user?.id || 'anonymous',
       jogoId,
       jogo.nome,
       'teste',
       seed,
       hash,
       vencedores.length,
        request.headers.get('x-forwarded-for') ?? undefined,
        request.headers.get('user-agent') ?? undefined
     );

     // Retornar resultado SIMULADO sem persistir no banco
     return NextResponse.json({
      success: true,
      message: `Teste de sorteio executado com sucesso! (modo simulação - não afeta dados reais)`,
      data: {
        resultado,
        vencedores: vencedores.length,
        vencedoresDetalhes,
        hash,
        seed, // Em produção, a seed nunca é revelada; aqui é para demonstração
        totalParticipacoes,
        modoTeste: true,
        jogo: {
          id: jogo.id,
          nome: jogo.nome,
          tipo: jogo.tipo,
        },
      },
    });

  } catch (error) {
    console.error('Erro no teste de sorteio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
