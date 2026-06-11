import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse, getClientIdentifier } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import { generateSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, rateLimitConfigs.register);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.resetTime);

    const body = await request.json();
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 });
    }

    const { nome, email, password, telefone, role, tipoOrganizacao, aldeiaId: aldeiaIdFromBody } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return NextResponse.json({ success: true, message: 'Se o email for válido, receberá instruções de verificação.' });
    }

    const hashedPassword = await hashPassword(password);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      let finalAldeiaId = aldeiaIdFromBody;

      // Se estiver a criar uma nova organização (aldeia_admin sem aldeiaId)
      if (role === 'aldeia_admin' && !finalAldeiaId) {
        const slug = generateSlug(nome);
        const newAldeia = await tx.aldeia.create({
          data: {
            nome: `${nome} Organization`,
            slug,
            tipoOrganizacao: (tipoOrganizacao as any) || 'aldeia',
            email: email.toLowerCase(),
            responsavel: nome,
            ativo: false, // Requer aprovação do super_admin
          }
        });
        finalAldeiaId = newAldeia.id;
      }

      const user = await tx.user.create({
        data: {
          nome,
          email: email.toLowerCase(),
          password: hashedPassword,
          telefone,
          role: (role as any) || 'user',
          aldeiaId: finalAldeiaId,
          emailVerificado: false,
        },
        include: { aldeia: true }
      });

      await tx.passwordReset.create({
        data: { userId: user.id, token: emailVerificationToken, expires }
      });

      return user;
    });

    // Email async (não bloqueia resposta)
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${emailVerificationToken}`;
    sendEmail({
      to: email,
      subject: 'Verifique o seu email - Aldeia Viva',
      html: `<p>Olá ${nome}, clique no link para ativar a sua conta: <a href="${verifyUrl}">${verifyUrl}</a></p>`
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Registo efetuado. Verifique o seu email.',
      user: { id: result.id, email: result.email, role: result.role }
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no registo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
