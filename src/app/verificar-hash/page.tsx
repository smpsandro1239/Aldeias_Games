import { Suspense } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { LayoutHeader } from '@/components/layout-header';
import VerificarHashClient from './VerificarHashClient';

export default function VerificarHashPage() {
  return (
    <RoleGuard
      allowedRoles={['super_admin', 'aldeia_admin', 'vendedor']}
      redirectPath="/clientedashboard"
      panelName="VerificarHash"
    >
      <LayoutHeader>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Verificar Hash</h1>
          <Suspense fallback={<div>A carregar...</div>}>
            <VerificarHashClient />
          </Suspense>
        </div>
      </div>
    </LayoutHeader>
    </RoleGuard>
  );
}