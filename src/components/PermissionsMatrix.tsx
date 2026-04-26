/**
 * PermissionsMatrix.tsx
 * Componente visual para exibir a matriz de permissões por papel.
 * Mostra quais papéis têm quais permissões em formato de tabela.
 */

import React from 'react';
import { Role, Permission, ROLE_PERMISSIONS } from '@/lib/role-permissions';

/**
 * Descrições amigáveis para cada permissão
 */
const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  // Global
  view_global_dashboard: 'Ver dashboard global com estatísticas de todo o sistema',
  manage_global_settings: 'Gerir configurações globais do sistema',
  view_all_tenants: 'Ver todas as aldeias/tenants do sistema',
  manage_tenants: 'Criar, atualizar e eliminar aldeias/tenants',
  manage_global_users: 'Gerir utilizadores de todas as aldeias',
  view_audit_logs: 'Ver registos de auditoria do sistema',

  // Tenant (Aldeia)
  view_tenant_dashboard: 'Ver dashboard da aldeia com estatísticas locais',
  manage_campaigns: 'Criar, atualizar e eliminar campanhas da aldeia',
  manage_sellers: 'Gerir vendedores associados à aldeia',
  view_tenant_metrics: 'Ver métricas detalhadas da aldeia (vendas, participação, etc.)',
  manage_prizes: 'Criar, atualizar e eliminar prémios da aldeia',
  manage_tenant_settings: 'Atualizar definições da aldeia (nome, localização, contacto, etc.)',

  // Sales
  sell: 'Efetuar vendas de bilhetes e participar em jogos',
  view_own_sales: 'Ver o histórico das próprias vendas e comissões',
  view_commissions: 'Ver detalhes das comissões ganhas',
  scan_qr: 'Escanear QR codes para validação de bilhetes',

  // Player
  play_games: 'Participar nos jogos da aldeia',
  view_campaigns: 'Ver campanhas disponíveis para participação',
  view_own_prizes: 'Ver prémios ganhos nos jogos',
  manage_profile: 'Atualizar o próprio perfil (nome, email, password, etc.)',
};

/**
 * Cores para o estado da permissão
 */
const PERMISSION_COLORS = {
  granted: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  denied: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
};

/**
 * Componente da matriz de permissões
 */
export function PermissionsMatrix() {
  const roles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'VENDEDOR', 'CLIENTE'];
  const permissions: Permission[] = Object.keys(ROLE_PERMISSIONS.SUPER_ADMIN) as Permission[];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-foreground rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Matriz de Permissões por Papel
        </h2>
        <p className="text-gray-600 mb-4">
          Esta matriz mostra quais permissões cada papel do sistema possui.
          Use-a para entender o alcance de cada papel e para onboarding de novos administradores.
        </p>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissão
                </th>
                {roles.map(role => (
                  <th
                    key={role}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {role}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {/* Exibir o papel com a primeira letra maiúscula e os restantes minúsculas */}
                      {role === 'SUPER_ADMIN' ? 'Super Admin' :
                        role === 'ADMIN' ? 'Aldeia Admin' :
                        role === 'VENDEDOR' ? 'Vendedor' : 'Cliente'}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {permissions.map(permission => (
                <tr key={permission} className="hover:bg-gray-50">
                  {/* Linha da permissão */}
                  <td className="px-6 py-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 flex items-center justify-center rounded-md">
                        {/* Ícone simples baseado na primeira letra da permissão */}
                        <span className="text-xs font-medium">
                          {permission.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="max-w-xs truncate">
                        {permission.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {/* Tooltip com descrição completa */}
                    <div className="mt-1 text-xs text-gray-500">
                      {PERMISSION_DESCRIPTIONS[permission]}
                    </div>
                  </td>
                  {/* Colunas para cada papel */}
                  {roles.map(role => (
                    <td
                      key={`${permission}-${role}`}
                      className={`px-6 py-4 text-center ${
                        ROLE_PERMISSIONS[role].includes(permission)
                          ? PERMISSION_COLORS.granted.bg
                          : PERMISSION_COLORS.denied.bg
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        {ROLE_PERMISSIONS[role].includes(permission) ? (
                          <div className={`h-5 w-5 flex items-center justify-center rounded-full ${
                            PERMISSION_COLORS.granted.iconBg
                          } ${PERMISSION_COLORS.granted.iconColor}`}>
                            {/* Ícone de check */}
                            <span className="text-xs">✓</span>
                          </div>
                        ) : (
                          <div className={`h-5 w-5 flex items-center justify-center rounded-full ${
                            PERMISSION_COLORS.denied.iconBg
                          } ${PERMISSION_COLORS.denied.iconColor}`}>
                            {/* Ícone de x */}
                            <span className="text-xs">✗</span>
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legenda */}
        <div className="mt-4 text-sm text-gray-500 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-100 rounded"></div>
            <span>Permitido</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-red-100 rounded"></div>
            <span>Negado</span>
          </div>
        </div>
      </div>

      {/* Resumo por papel */}
      <div className="bg-foreground rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo por Papel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map(role => (
            <div
              key={role}
              className="border rounded-lg p-4 text-center"
            >
              <h3 className="font-semibold text-gray-800 mb-2">
                {role === 'SUPER_ADMIN' ? 'Super Admin' :
                  role === 'ADMIN' ? 'Aldeia Admin' :
                  role === 'VENDEDOR' ? 'Vendedor' : 'Cliente'}
              </h3>
              <p className="text-2xl font-bold text-indigo-600">
                {ROLE_PERMISSIONS[role].length}
              </p>
              <p className="text-xs text-gray-500">permissões</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}