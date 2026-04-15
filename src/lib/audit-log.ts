/**
 * audit-log.ts
 * Módulo simples para registo de ações críticas realizadas por SUPER_ADMIN.
 * Em produção, isto poderia ser enviado para um serviço externo de logging
 * (ex: Elasticsearch, Loki, CloudWatch) ou armazenado numa base de dados dedicada.
 */

import { v4 as uuidv4 } from 'uuid';

// Em um sistema real, isto viria de variáveis de ambiente ou configuração
const AUDIT_ENABLED = process.env.NODE_ENV !== 'test'; // Desativar em testes

/**
 * Regista uma ação de auditoria.
 * @param action - Descrição da ação realizada (ex: 'CREATE_ALDEIA', 'DELETE_USER')
 * @param userId - ID do utilizador que realizou a ação
 * @param details - Informações adicionais (opcional)
 * @returns Promise que resolve quando o log for gravado
 */
export async function logAuditAction(
  action: string,
  userId: string,
  details: Record<string, any> = {}
): Promise<void> {
  if (!AUDIT_ENABLED) {
    // Em teste, não fazemos nada para não poluir os logs
    return;
  }

  const auditEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action,
    userId,
    details: {
      ...details,
      // Adicionamos informações de contexto se disponíveis
      // Em Next.js, poderíamos obter o IP e user agent do request
      // Mas aqui deixamos que o caller adicione o que for relevante
    },
    // Em produção, poderíamos añadir: service: 'aldeiasgames', version: process.env.VERSION
  };

  // Em desenvolvimento, apenas logamos no console
  // Em produção, enviamos para um serviço de logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(auditEntry, null, 2));
  } else {
    // Exemplo de como poderia ser enviado para um endpoint de logging
    // try {
    //   await fetch('/api/audit-log', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(auditEntry)
    //   });
    // } catch (error) {
    //   // Não queremos que a falha no logging afete a operação principal
    //   console.error('Falha ao enviar log de auditoria:', error);
    // }
    // Por enquanto, também logamos no console em produção para visibilidade
    console.log('[AUDIT]', JSON.stringify(auditEntry));
  }
}

/**
 * Funções auxiliares para ações comuns de SUPER_ADMIN
 */

export const auditLog = {
  // Aldeias
  createAldeia: (userId: string, aldeiaId: string, aldeiaNome: string) =>
    logAuditAction('CREATE_ALDEIA', userId, { aldeiaId, aldeiaNome }),

  approveAldeia: (userId: string, aldeiaId: string, aldeiaNome: string) =>
    logAuditAction('APPROVE_ALDEIA', userId, { aldeiaId, aldeiaNome }),

  suspendAldeia: (userId: string, aldeiaId: string, aldeiaNome: string, motivo?: string) =>
    logAuditAction('SUSPEND_ALDEIA', userId, { aldeiaId, aldeiaNome, motivo }),

  deleteAldeia: (userId: string, aldeiaId: string, aldeiaNome: string) =>
    logAuditAction('DELETE_ALDEIA', userId, { aldeiaId, aldeiaNome }),

  // Utilizadores
  createUser: (userId: string, createdUserId: string, createdUserEmail: string, role: string) =>
    logAuditAction('CREATE_USER', userId, { createdUserId, createdUserEmail, role }),

  deleteUser: (userId: string, targetUserId: string, targetUserEmail: string) =>
    logAuditAction('DELETE_USER', userId, { targetUserId, targetUserEmail }),

  // Backups
  createBackup: (userId: string, backupName: string, backupSize: number) =>
    logAuditAction('CREATE_BACKUP', userId, { backupName, backupSize }),

  listBackups: (userId: string) =>
    logAuditAction('LIST_BACKUPS', userId),

  // Push Notifications
  sendPushNotification: (userId: string, targetType: 'global' | 'aldeia' | 'user', targetId: string | null, messageLength: number) =>
    logAuditAction('SEND_PUSH_NOTIFICATION', userId, { targetType, targetId, messageLength }),
};

// Exportamos tanto o objeto com funções auxiliares quanto a função genérica
export default auditLog;