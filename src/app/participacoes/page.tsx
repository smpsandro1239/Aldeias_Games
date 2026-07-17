import { Suspense } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { LayoutHeader } from '@/components/layout-header';
import ParticipacoesClient from './ParticipacoesClient';

export default function ParticipacoesPage() {
  return (
    <RoleGuard
      allowedRoles={['user']}
      redirectPath="/clientedashboard"
      panelName="Participacoes"
    >
      <LayoutHeader>
        <div className="min-h-screen bg-background text-foreground font-body">
          <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="font-serif text-2xl font-bold text-accent">Minhas Participações</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Números jogados, hashes de verificação e detalhes de cada participação
              </p>
            </div>
            <Suspense fallback={<div className="text-center text-muted-foreground py-8">A carregar...</div>}>
              <ParticipacoesClient />
            </Suspense>
          </div>
        </div>
      </LayoutHeader>
    </RoleGuard>
  );
}