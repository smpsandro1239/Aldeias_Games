/**
 * role-permissions.ts
 * Mapeamento completo de permissões por role
 */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'VENDEDOR' | 'CLIENTE';

export type Permission = 
  // Global
  | 'view_global_dashboard'
  | 'manage_global_settings'
  | 'view_all_tenants'
  | 'manage_tenants'
  | 'manage_global_users'
  | 'view_audit_logs'
  
  // Tenant (Aldeia)
  | 'view_tenant_dashboard'
  | 'manage_campaigns'
  | 'manage_sellers'
  | 'view_tenant_metrics'
  | 'manage_prizes'
  | 'manage_tenant_settings'
  
  // Sales
  | 'sell'
  | 'view_own_sales'
  | 'view_commissions'
  | 'scan_qr'
  
  // Player
  | 'play_games'
  | 'view_campaigns'
  | 'view_own_prizes'
  | 'manage_profile';

// Mapeamento de permissions por role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    // Global
    'view_global_dashboard',
    'manage_global_settings',
    'view_all_tenants',
    'manage_tenants',
    'manage_global_users',
    'view_audit_logs',
    // Tenant (pode gerir qualquer aldeia)
    'view_tenant_dashboard',
    'manage_campaigns',
    'manage_sellers',
    'view_tenant_metrics',
    'manage_prizes',
    'manage_tenant_settings',
    // Sales (pode vender em qualquer lado)
    'sell',
    'view_own_sales',
    'view_commissions',
    'scan_qr',
    // Player
    'play_games',
    'view_campaigns',
    'view_own_prizes',
    'manage_profile',
  ],
  
  ADMIN: [
    // Tenant
    'view_tenant_dashboard',
    'manage_campaigns',
    'manage_sellers',
    'view_tenant_metrics',
    'manage_prizes',
    'manage_tenant_settings',
    // Sales
    'sell',
    'view_own_sales',
    'view_commissions',
    'scan_qr',
    // Player
    'play_games',
    'view_campaigns',
    'view_own_prizes',
    'manage_profile',
  ],
  
  VENDEDOR: [
    // Sales
    'sell',
    'view_own_sales',
    'view_commissions',
    'scan_qr',
    // Player
    'play_games',
    'view_campaigns',
    'view_own_prizes',
    'manage_profile',
  ],
  
  CLIENTE: [
    // Player
    'play_games',
    'view_campaigns',
    'view_own_prizes',
    'manage_profile',
  ],
};

// Helper functions
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

export function canAccessRoute(role: Role, route: string): boolean {
  // Route-based access control
  const routePermissions: Record<string, Permission[]> = {
    '/dashboard/super-admin': ['view_global_dashboard'],
    '/dashboard/admin': ['view_tenant_dashboard'],
    '/dashboard/vendedor': ['sell'],
    '/dashboard/cliente': ['play_games'],
    '/admin/tenants': ['manage_tenants'],
    '/admin/users': ['manage_global_users'],
    '/admin/audit': ['view_audit_logs'],
    '/admin/settings': ['manage_global_settings'],
    '/admin/campaigns': ['manage_campaigns'],
    '/admin/sellers': ['manage_sellers'],
    '/admin/prizes': ['manage_prizes'],
    '/venda': ['sell'],
    '/jogos': ['play_games'],
  };
  
  // Check exact match or parent path
  for (const [path, perms] of Object.entries(routePermissions)) {
    if (route.startsWith(path) && hasAnyPermission(role, perms)) {
      return true;
    }
  }
  
  return false;
}

// Server-side check
export async function checkPermission(permission: Permission): Promise<boolean> {
  // This will be called in server components/actions
  // Will be implemented with actual auth check
  return true;
}
