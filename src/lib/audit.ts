import { prisma } from '@/lib/db';

// Constants
const USER_AGENT_MAX_LENGTH = 500;
const SEED_HASH_TRUNCATE_LENGTH = 16;
const AUDIT_ACTIONS = {
  JOGO_TOGGLE: 'jogo.toggle_estado',
  SORTEIO_COMMIT: 'sorteio.commit',
  SORTEIO_REVEAL: 'sorteio.reveal',
  SORTEIO_TESTE: 'sorteio.teste',
  PREMIO_CONVERTIDO: 'premio.convertido',
  JOGO_CREATE: 'jogo.create',
  JOGO_UPDATE: 'jogo.update',
} as const;

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
    let metadataJson: string | undefined;
    if (options.metadata) {
      try {
        metadataJson = JSON.stringify(options.metadata);
      } catch (jsonError) {
        console.warn('[AuditLog] Failed to serialize metadata:', jsonError);
        metadataJson = JSON.stringify({ error: 'Failed to serialize metadata' });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        aldeiaId: options.aldeiaId,
        action: options.action,
        resource: options.resource,
        resourceId: options.resourceId,
        metadata: metadataJson,
        ip: options.ip,
        userAgent: options.userAgent?.substring(0, USER_AGENT_MAX_LENGTH),
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
    action: AUDIT_ACTIONS.JOGO_TOGGLE,
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
  const actionMap = {
    commit: AUDIT_ACTIONS.SORTEIO_COMMIT,
    reveal: AUDIT_ACTIONS.SORTEIO_REVEAL,
    teste: AUDIT_ACTIONS.SORTEIO_TESTE,
  };

  logAudit({
    userId,
    action: actionMap[tipo],
    resource: 'sorteio',
    resourceId: jogoId,
    metadata: {
      jogoNome,
      tipo,
      seed: seed?.substring(0, SEED_HASH_TRUNCATE_LENGTH),
      hash: hash?.substring(0, SEED_HASH_TRUNCATE_LENGTH),
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
    action: AUDIT_ACTIONS.PREMIO_CONVERTIDO,
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
  const action = tipo === 'create' ? AUDIT_ACTIONS.JOGO_CREATE : AUDIT_ACTIONS.JOGO_UPDATE;

  logAudit({
    userId,
    action,
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

/**
 * Helper para log CRUD genérico (substitui auditLog.ts)
 */
export function logCRUD(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown> | null,
  ip?: string,
  userAgent?: string
): void {
  logAudit({
    userId,
    action,
    resource,
    resourceId,
    metadata: metadata ?? undefined,
    ip,
    userAgent,
  });
}

/**
 * Extrair IP do cliente a partir do request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Query audit logs de um utilizador
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  createdAt: Date;
  ip: string | null;
  metadata: unknown;
}>> {
  return await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      resource: true,
      resourceId: true,
      createdAt: true,
      ip: true,
      metadata: true,
    },
  });
}
