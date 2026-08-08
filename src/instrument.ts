import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";

/**
 * Instrumentação server-side (Next.js App Router).
 * Só inicializa o Sentry se SENTRY_DSN (ou NEXT_PUBLIC_SENTRY_DSN) estiver
 * definido — fallback seguro: sem DSN nada é enviado e o build não falha.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV === "production" ? "production" : "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}