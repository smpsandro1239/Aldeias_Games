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

  // MEDIUM #12: Não expor detalhes de configuração de serviços externos
  const services: Record<string, { status: string; latency?: number; error?: string }> = {};
  if (process.env.STRIPE_SECRET_KEY) services.stripe = { status: 'available' };
  if (process.env.MBWAY_API_KEY) services.mbway = { status: 'available' };
  if (process.env.SMTP_HOST) services.smtp = { status: 'available' };
  (checks as Record<string, unknown>).services = services;

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services: checks.services,
  }, { status: statusCode });
}
