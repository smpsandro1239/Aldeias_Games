import { Suspense } from 'react';
import { LayoutHeader } from '@/components/layout-header';
import { BottomNav } from '@/components/bottom-nav';
import NumerosJogadosClient from './NumerosJogadosClient';

export default function NumerosJogadosPage() {
  return (
    <LayoutHeader>
      <div className="min-h-screen bg-background text-foreground font-body">
        <div className="px-4 py-6 max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-accent">Números Jogados</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Consulta todos os números jogados, hashes de verificação e detalhes
            </p>
          </div>
          <Suspense fallback={<div className="text-center text-muted-foreground py-8">A carregar...</div>}>
            <NumerosJogadosClient />
          </Suspense>
        </div>
      </div>
    </LayoutHeader>
  );
}
