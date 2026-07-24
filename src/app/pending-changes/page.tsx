import { Suspense } from 'react';
import { LayoutHeader } from '@/components/layout-header';
import { BottomNav } from '@/components/bottom-nav';
import PendingChangesClient from './PendingChangesClient';

export default function PendingChangesPage() {
  return (
    <LayoutHeader>
      <div className="min-h-screen bg-background text-foreground font-body">
        <div className="px-4 py-6 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-accent">Alterações Pendentes</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Pedidos de alteração de dados sensíveis que aguardam aprovação
            </p>
          </div>
          <Suspense fallback={<div className="text-center text-muted-foreground py-8">A carregar...</div>}>
            <PendingChangesClient />
          </Suspense>
        </div>
      </div>
      <BottomNav />
    </LayoutHeader>
  );
}
