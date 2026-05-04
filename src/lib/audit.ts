import { prisma } from '@/lib/db';

/**
 * Cria um log de auditoria para ações críticas
 *
 * @param options - Dados do log
 * @returns Promise<void>
 *
 * @example
 * logAudit({
 *   userId: user.id,
 *   action: 'jogo.toggle',
 *   resource: 'jogo',
 *   resourceId: jogoId,
 *   metadata: { estadoAnterior: 'aberto', estadoNovo: 'fechado' },
 *   ip: request.headers.get('x-forwarded-for'),
 *   userAgent: request.headers.get('user-agent'),
 * });
 */
export async function logAudit(options: {
  userId?: string;
  aldeiaId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        aldeiaId: options.aldeiaId,
        action: options.action,
        resource: options.resource,
        resourceId: options.resourceId,
        metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
        ip: options.ip,
        userAgent: options.userAgent?.substring(0, 500), // truncate to avoid overflow
        createdAt: new Date(),
      },
    });
  } catch (error) {
    // Log audit failures but don't block main operation
    console.error('[AuditLog] Falha ao registar:', error);
  }
}

/**
 * Helper para log de ação de toggle de estado do jogo
 */
export function logJogoToggle(
  userId: string,
  jogoId: string,
  jogoNome: string,
  estadoAnterior: string,
  estadoNovo: string,
  ip?: string,
  userAgent?: string
): void {
  logAudit({
    userId,
    action: 'jogo.toggle_estado',
    resource: 'jogo',
    resourceId: jogoId,
    metadata: {
      jogoNome,
      estadoAnterior,
      estadoNovo,
    },
    ip,
    userAgent,
  });
}

/**
 * Helper para log de execução de sorteio
 */
export function logSorteio(
  userId: string,
  jogoId: string,
  jogoNome: string,
  tipo: 'commit' | 'reveal' | 'teste',
  seed?: string,
  hash?: string,
  vencedoresCount?: number,
  ip?: string,
  userAgent?: string
): void {
  logAudit({
    userId,
    action: `sorteio.${tipo}`,
    resource: 'sorteio',
    resourceId: jogoId,
    metadata: {
      jogoNome,
      tipo,
      seed: seed?.substring(0, 16),
      hash: hash?.substring(0, 16),
      vencedoresCount,
    },
    ip,
    userAgent,
  });
}

/**
 * Helper para log de conversão de prémio em saldo
 */
export function logPremioConvert(
  userId: string,
  participacaoId: string,
  jogoId: string,
  valor: number,
  ip?: string,
  userAgent?: string
): void {
  logAudit({
    userId,
    action: 'premio.convertido',
    resource: 'participacao',
    resourceId: participacaoId,
    metadata: { jogoId, valor },
    ip,
    userAgent,
  });
}

/**
 * Helper para log de criação/edição de jogo
 */
export function logJogoWrite(
  userId: string,
  jogoId: string,
  jogoNome: string,
  tipo: 'create' | 'update',
  camposAlterados?: string[],
  ip?: string,
  userAgent?: string
): void {
  logAudit({
    userId,
    action: `jogo.${tipo}`,
    resource: 'jogo',
    resourceId: jogoId,
    metadata: {
      jogoNome,
      tipo,
      camposAlterados,
    },
    ip,
    userAgent,
  });
}
