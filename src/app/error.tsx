'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Algo correu mal
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Ocorreu um erro inesperado. Por favor tente novamente.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Código de erro: {error.digest}
          </p>
        )}
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
