/**
 * require-role.ts
 * Funções para verificar papéis e permissões, evitando duplicação de checks.
 */

import { Role } from './role-permissions';

// Constants
const UNAUTHORIZED_STATUS = 403;

// User interface for type safety
interface UserWithPermissions {
  role: Role;
  permissions?: string[];
}

/**
 * Lança um erro se o utilizador não tiver o papel esperado.
 * @param user - O objeto do utilizador (pode ser null ou undefined)
 * @param expectedRole - O papel que é necessário ter
 * @throws Error com status 403 se a verificação falhar
 */
export function requireRole(user: UserWithPermissions | null | undefined, expectedRole: Role): void {
  if (!user || user.role !== expectedRole) {
    const error = new Error(`Não autorizado - Papel ${expectedRole} necessário`);
    (error as any).status = UNAUTHORIZED_STATUS;
    throw error;
  }
}

/**
 * Lança um erro se o utilizador não tiver nenhuma das permissões esperadas.
 * @param user - O objeto do utilizador
 * @param permissions - Array de permissões que são aceitáveis (pelo menos uma deve estar presente)
 * @throws Error com status 403 se a verificação falhar
 */
export function requireAnyPermission(user: UserWithPermissions | null | undefined, permissions: string[]): void {
  if (!user || !user.permissions || !permissions.some(p => user.permissions!.includes(p))) {
    const error = new Error(`Não autorizado - Nenhuma das permissões necessárias: ${permissions.join(', ')}`);
    (error as any).status = UNAUTHORIZED_STATUS;
    throw error;
  }
}

/**
 * Lança um erro se o utilizador não tiver todas as permissões esperadas.
 * @param user - O objeto do utilizador
 * @param permissions - Array de permissões que são todas necessárias
 * @throws Error com status 403 se a verificação falhar
 */
export function requireAllPermissions(user: UserWithPermissions | null | undefined, permissions: string[]): void {
  if (!user || !user.permissions || !permissions.every(p => user.permissions!.includes(p))) {
    const missingPermissions = permissions.filter(p => !user!.permissions?.includes(p));
    const error = new Error(`Não autorizado - Faltam as seguintes permissões: ${missingPermissions.join(', ')}`);
    (error as any).status = UNAUTHORIZED_STATUS;
    throw error;
  }
}

/**
 * Versão específica para SUPER_ADMIN - mantida para clareza e possível futuro refinamento.
 */
export function requireSuperAdmin(user: UserWithPermissions | null | undefined): void {
  requireRole(user, 'SUPER_ADMIN');
}

/**
 * Versão específica para ALDEIA_ADMIN.
 */
export function requireAldeaAdmin(user: UserWithPermissions | null | undefined): void {
  requireRole(user, 'ADMIN');
}

/**
 * Versão específica para VENDEDOR.
 */
export function requireVendedor(user: UserWithPermissions | null | undefined): void {
  requireRole(user, 'VENDEDOR');
}

/**
 * Versão específica para CLIENTE (embora raramente precise de proteção explícita).
 */
export function requireCliente(user: UserWithPermissions | null | undefined): void {
  requireRole(user, 'CLIENTE');
}