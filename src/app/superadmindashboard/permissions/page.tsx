'use client';

import { PermissionsMatrix } from '@/components/PermissionsMatrix';
import { getUserFromRequest } from '@/lib/auth';
import { requireSuperAdmin } from '@/lib/require-role';

export default async function PermissionsPage() {
  const user = await getUserFromRequest();
  requireSuperAdmin(user);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Permissões do Sistema</h1>
      <p className="text-gray-600 mb-4">
        Visualize a matriz completa de permissões por papel. Esta página ajuda a entender
        quais operações cada tipo de utilizador pode realizar no sistema.
      </p>
      <PermissionsMatrix />
    </div>
  );
}