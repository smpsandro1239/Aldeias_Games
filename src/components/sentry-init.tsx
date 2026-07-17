"use client";

import { useEffect } from "react";
// @ts-ignore
import * as Sentry from "@sentry/nextjs";

export function SentryInit() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV === "production" ? "production" : "development",
        
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
          Sentry.browserTracingIntegration(),
        ],
        
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    }
  }, []);

  return null;
}