'use client';

import { DashboardShell } from '@/components/dashboard-shell';
import { PermissionsMatrix } from '@/components/PermissionsMatrix';
import { Shield, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PermissionsPage() {
  const router = useRouter();
  return (
    <DashboardShell allowedRoles={["super_admin"]} panelName="Permissões">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center gap-3 px-4 py-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <span className="font-serif font-bold text-lg text-accent">Permissões</span>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="card-m3 mb-8 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 p-3">
              <Shield className="h-6 w-6 text-foreground" />
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
    </DashboardShell>
  );
}
