'use client';

import { useEffect } from 'react';

export default function VendedorDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[VendedorDashboardError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Erro no painel de vendedor
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ocorreu um erro ao carregar o painel. Por favor tente novamente.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
