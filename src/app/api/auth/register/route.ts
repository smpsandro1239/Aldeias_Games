import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations';
import { hashPassword, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/rate-limit';
import { generateSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, rateLimitConfigs.register);

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetTime);
    }

    // Parse e validação do body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { nome, email, password, telefone, role, tipoOrganizacao } = validation.data;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está registado' },
        { status: 409 }
      );
    }

    // Hash da password
    const hashedPassword = await hashPassword(password);

    // Criar utilizador (e aldeia se for admin)
    let aldeiaId: string | undefined;
    let isNewOrganization = false;

    if (role === 'aldeia_admin' && tipoOrganizacao) {
      // Criar aldeia/organização automaticamente
      const nomeAldeia = nome.replace('Administrador ', '').replace('Admin ', '');
      const slug = generateSlug(nomeAldeia);
      
      // Verificar se slug já existe
      const existingSlug = await prisma.aldeia.findUnique({
        where: { slug },
      });

      const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

      const planoGratuito = await prisma.plano.findFirst({
        where: { nome: 'Gratuito' },
      });

      const aldeia = await prisma.aldeia.create({
        data: {
          nome: nomeAldeia,
          slug: finalSlug,
          tipoOrganizacao,
          email: email.toLowerCase(),
          telefone,
          ativo: true,
          verificado: false,
          planoId: planoGratuito?.id,
        },
      });

      aldeiaId = aldeia.id;
      isNewOrganization = true;
    }

    // Criar utilizador
    const user = await prisma.user.create({
      data: {
        nome,
        email: email.toLowerCase(),
        password: hashedPassword,
        telefone,
        role: role || 'user',
        aldeiaId,
        emailVerificado: false,
        notificacoesEmail: true,
      },
      include: {
        aldeia: true,
      },
    });

    // Gerar token JWT
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      aldeiaId: user.aldeiaId as string,
    });

    // Criar notificação de boas-vindas
    await prisma.notificacao.create({
      data: {
        tipo: 'sistema',
        titulo: 'Bem-vindo ao Aldeias Games!',
        mensagem: 'A sua conta foi criada com sucesso. Explore os jogos disponíveis!',
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registo bem-sucedido',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        telefone: user.telefone,
        role: user.role,
        aldeiaId: user.aldeiaId as string,
        aldeia: user.aldeia,
        notificacoesEmail: user.notificacoesEmail,
      },
      token,
      isNewOrganization,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro no registo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
