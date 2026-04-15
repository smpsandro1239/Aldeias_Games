import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
  let overallStatus = 'healthy';

  // Verificar conexão com a base de dados
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'connected', latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: 'disconnected', error: 'Connection failed' };
    overallStatus = 'unhealthy';
  }

  // Verificar variáveis de ambiente críticas
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingEnvVars.length > 0) {
    checks.environment = { status: 'misconfigured', error: `Missing: ${missingEnvVars.join(', ')}` };
    overallStatus = 'degraded';
  } else {
    checks.environment = { status: 'configured' };
  }

  // Verificar serviços externos (configurados ou não)
  checks.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
  };
  checks.mbway = {
    status: process.env.MBWAY_API_KEY ? 'configured' : 'not_configured',
  };
  checks.smtp = {
    status: process.env.SMTP_HOST ? 'configured' : 'not_configured',
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '3.11.1',
    environment: process.env.NODE_ENV || 'development',
    services: checks,
    backup: {
      policy: 'Backups diários com retenção de 30 dias (configurar no provedor de base de dados)',
      lastBackup: 'Configurar monitorização de backups no provedor',
    },
  }, { status: statusCode });
}
