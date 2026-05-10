import { Suspense } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import ParticipacoesClient from './ParticipacoesClient';

export default function ParticipacoesPage() {
  return (
    <RoleGuard
      allowedRoles={['user']}
      redirectPath="/clientedashboard"
      panelName="Participacoes"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Minhas Participações</h1>
          <Suspense fallback={<div>Carregando...</div>}>
            <ParticipacoesClient />
          </Suspense>
        </div>
      </div>
    </RoleGuard>
  );
}