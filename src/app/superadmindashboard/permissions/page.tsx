'use client';

import { DashboardShell } from '@/components/dashboard-shell';
import { Shield, ArrowLeft, UserCog, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
                A gestão de papéis (RBAC) é feita na página de Administração. As permissões
                são aplicadas no backend via papéis globais e por aldeia.
              </p>
            </div>
          </div>
        </div>
        <div className="card-m3 p-6">
          <Link
            href="/admin/rbac"
            className="flex items-center justify-between rounded-xl border border-[var(--card-alt)] bg-surface-container-low hover:bg-surface-container-high p-6 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[var(--secondary)]/15 p-3">
                <UserCog className="h-6 w-6 text-[var(--secondary)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text)]">Gestão de Permissões (RBAC)</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Atribuir papéis globais e por aldeia, permissões e acesso de utilizadores.
                </p>
              </div>
            </div>
            <ExternalLink className="h-5 w-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}