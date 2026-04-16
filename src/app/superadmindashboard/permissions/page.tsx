'use client';

import { PermissionsMatrix } from '@/components/PermissionsMatrix';
import { Shield } from 'lucide-react';

export default function PermissionsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="card-m3 mb-8 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 p-3">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">Permissões do Sistema</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Visualize a matriz completa de permissões por papel. Esta página ajuda a entender
                quais operações cada tipo de utilizador pode realizar no sistema.
              </p>
            </div>
          </div>
        </div>
        <div className="card-m3 p-6">
          <PermissionsMatrix />
        </div>
      </div>
    </div>
  );
}
