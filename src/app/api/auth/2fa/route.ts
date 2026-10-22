import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { generateMFASecret, generateMFAQRCode, verifyMFAOTP, setupBackupCodes } from '@/lib/mfa';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { logCRUD as logAudit, getClientIP } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;
    const ip = getClientIP(request);
    const ua = request.headers.get('user-agent') || 'unknown';

    if (action === 'setup') {
      const secret = generateMFASecret();
      const qrCode = await generateMFAQRCode(user.email, secret);

      await prisma.twoFactorAuth.upsert({
        where: { userId: user.id },
        update: { secret, enabled: false },
        create: { userId: user.id, secret },
      });

      await logAudit(user.id, '2fa_setup', 'security', undefined, { email: user.email }, ip, ua);

      return NextResponse.json({
        success: true,
        secret,
        qrCode,
        message: 'Escaneie o QR Code com a sua app de autenticação',
      });
    }

    if (action === 'verify') {
      const { code } = body;

      const rateLimit = await checkRateLimit(`2fa-verify:${user.id}`, rateLimitConfigs.twoFactor);
      if (!rateLimit.allowed) {
        return createRateLimitResponse(rateLimit.resetTime);
      }
      
      const tfa = await prisma.twoFactorAuth.findUnique({
        where: { userId: user.id },
      });

      if (!tfa) {
        return NextResponse.json({ error: '2FA não configurado' }, { status: 400 });
      }

      // FIX (segurança, T1/A2): verifyMFAOTP é async desde que passou a usar
      // otplib v13 (Promise<VerifyResult>). Sem await, `isValid` era uma
      // Promise truthy — ou seja, QUALQUER código era aceite. Este era um
      // bug crítico de autenticação 2FA.
      const isValid = await verifyMFAOTP(code, tfa.secret);

      if (!isValid) {
        await logAudit(user.id, '2fa_verify_fail', 'security', undefined, { email: user.email }, ip, ua);
        return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
      }

      await prisma.twoFactorAuth.update({
        where: { userId: user.id },
        data: { enabled: true },
      });

      // A2 (Sprint 1): gerar 10 backup codes single-use no enable 2FA.
      // Os códigos em claro são retornados UMA única vez — na BD fica
      // apenas o array JSON de hashes SHA-256 (ver src/lib/mfa.ts).
      let backupCodes: string[] | undefined;
      try {
        backupCodes = await setupBackupCodes(user.id);
      } catch (e) {
        console.error('[2FA] Falha ao gerar backup codes:', e);
      }

      await logAudit(user.id, '2fa_enable', 'security', undefined, { email: user.email }, ip, ua);

      return NextResponse.json({
        success: true,
        message: '2FA ativado com sucesso',
        backupCodes,
        backupCodesWarning: backupCodes
          ? 'Guarda estes códigos num local seguro. Só são mostrados uma vez e cada um só pode ser usado uma vez.'
          : undefined,
      });
    }

    if (action === 'disable') {
      const { code } = body;

      // HIGH #10: Requer verificação TOTP para desativar 2FA
      if (!code) {
        return NextResponse.json({ error: 'Código TOTP obrigatório para desativar 2FA' }, { status: 400 });
      }

      const tfa = await prisma.twoFactorAuth.findUnique({
        where: { userId: user.id },
      });

      if (!tfa || !tfa.enabled) {
        return NextResponse.json({ error: '2FA não está ativo' }, { status: 400 });
      }

      // FIX (segurança, T1/A2): async — ver comentário no bloco 'verify'.
      const isValid = await verifyMFAOTP(code, tfa.secret);
      if (!isValid) {
        await logAudit(user.id, '2fa_disable_fail', 'security', undefined, { email: user.email }, ip, ua);
        return NextResponse.json({ error: 'Código TOTP inválido' }, { status: 400 });
      }

      await prisma.twoFactorAuth.update({
        where: { userId: user.id },
        data: { enabled: false },
      });

      await logAudit(user.id, '2fa_disable', 'security', undefined, { email: user.email }, ip, ua);

      return NextResponse.json({
        success: true,
        message: '2FA desativado',
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar 2FA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tfa = await prisma.twoFactorAuth.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      enabled: tfa?.enabled || false,
    });
  } catch (error) {
    console.error('Erro ao verificar 2FA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
