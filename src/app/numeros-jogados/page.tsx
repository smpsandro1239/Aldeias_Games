import { Suspense } from 'react';
import { LayoutHeader } from '@/components/layout-header';
import { BottomNav } from '@/components/bottom-nav';
import { Ticket } from 'lucide-react';
import NumerosJogadosClient from './NumerosJogadosClient';

export default function NumerosJogadosPage() {
  return (
    <LayoutHeader>
      <div className="min-h-screen bg-background text-foreground font-body">
        <div className="px-4 py-6 max-w-5xl mx-auto space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-xl flex-shrink-0">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-accent">Números Jogados</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Consulta todos os números jogados, hashes de verificação e detalhes
                </p>
              </div>
            </div>
          </div>
          <Suspense fallback={<div className="text-center text-muted-foreground py-8">A carregar...</div>}>
            <NumerosJogadosClient />
          </Suspense>
        </div>
      </div>
    </LayoutHeader>
  );
}
