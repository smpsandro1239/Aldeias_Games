'use client';

import { useOfflineDetection } from '@/hooks/use-offline-detection';

/**
 * Provider que deteta estado online/offline e gestiona retry automático.
 * Deve ser incluído no layout raiz como componente client.
 */
export function OfflineProvider({ children }: { children: React.ReactNode }) {
  useOfflineDetection();
  return <>{children}</>;
}
