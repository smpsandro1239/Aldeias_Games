"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="pt-PT">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold">Algo correu mal</h1>
          <p className="text-muted-foreground">
            Ocorreu um erro inesperado. Por favor tente novamente.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60">
              Código de erro: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
