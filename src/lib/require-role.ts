/**
 * require-role.ts
 * Funções para verificar papéis e permissões, evitando duplicação de checks.
 */

import { Role } from './role-permissions';

/**
 * Lança um erro se o utilizador não tiver o papel esperado.
 * @param user - O objeto do utilizador (pode ser null ou undefined)
 * @param expectedRole - O papel que é necessário ter
 * @throws Error com status 403 se a verificação falhar
 */
export function requireRole(user: any, expectedRole: Role): void {
  if (!user || user.role !== expectedRole) {
    const error = new Error(`Não autorizado - Papel ${expectedRole} necessário`);
    // Adicionamos uma propriedade para que o caller saiba que é um erro de autorização
    (error as any).status = 403;
    throw error;
  }
}

/**
 * Lança um erro se o utilizador não tiver nenhuma das permissões esperadas.
 * @param user - O objeto do utilizador
 * @param permissions - Array de permissões que são aceitáveis (pelo menos uma deve estar presente)
 * @throws Error com status 403 se a verificação falhar
 */
export function requireAnyPermission(user: any, permissions: string[]): void {
  if (!user || !permissions.some(p => p in user.permissions || user.permissions?.includes(p))) {
    const error = new Error(`Não autorizado - Nenhuma das permissões necessárias: ${permissions.join(', ')}`);
    (error as any).status = 403;
    throw error;
  }
}

/**
 * Lança um erro se o utilizador não tiver todas as permissões esperadas.
 * @param user - O objeto do utilizador
 * @param permissions - Array de permissões que são todas necessárias
 * @throws Error com status 403 se a verificação falhar
 */
export function requireAllPermissions(user: any, permissions: string[]): void {
  if (!user || !permissions.every(p => p in user.permissions || user.permissions?.includes(p))) {
    const error = new Error(`Não autorizado - Faltam as seguintes permissões: ${permissions.filter(p => !(p in user.permissions && !user.permissions?.includes(p))).join(', ')}`);
    (error as any).status = 403;
    throw error;
  }
}

/**
 * Versão específica para SUPER_ADMIN - mantida para clareza e possível futuro refinamento.
 */
export function requireSuperAdmin(user: any): void {
  requireRole(user, 'SUPER_ADMIN');
}

/**
 * Versão específica para ALDEIA_ADMIN.
 */
export function requireAldeaAdmin(user: any): void {
  requireRole(user, 'ADMIN');
}

/**
 * Versão específica para VENDEDOR.
 */
export function requireVendedor(user: any): void {
  requireRole(user, 'VENDEDOR');
}

/**
 * Versão específica para CLIENTE (embora raramente precise de proteção explícita).
 */
export function requireCliente(user: any): void {
  requireRole(user, 'CLIENTE');
}