"use client";

import { useCallback } from "react";

export type GameAnalyticsEvent =
  | { type: "game_view"; gameId: string; gameType: string; source: string }
  | { type: "game_click"; gameId: string; gameType: string }
  | { type: "participation_start"; gameId: string; gameType: string; quantity: number }
  | { type: "payment_method_selected"; gameId: string; method: "mbway" | "saldo" | "stripe" }
  | { type: "payment_success"; gameId: string; amount: number; method: string }
  | { type: "payment_failed"; gameId: string; reason: string }
  | { type: "scratch_start"; gameId: string }
  | { type: "scratch_progress"; gameId: string; percent: number }
  | { type: "scratch_reveal"; gameId: string; won: boolean; prizeValue?: number }
  | { type: "tutorial_open"; gameType: string }
  | { type: "tutorial_complete"; gameType: string }
  | { type: "tutorial_skip"; gameType: string };

/**
 * Hook para rastrear eventos de engajamento nos jogos
 * Implementação simples que envia para endpoint /api/analytics
 * Os dados são anonimizados e respeitam RGPD
 */
export function useGameAnalytics() {
  const track = useCallback(async (event: GameAnalyticsEvent): Promise<void> => {
    try {
      // Validate event
      if (!event || typeof event !== 'object' || !event.type) {
        return; // Silently fail invalid events
      }

      // Enviar para API de analytics (não bloquear UI)
      const payload = {
        ...event,
        timestamp: new Date().toISOString(),
        // Anonimizar: não incluir userId, apenas sessionId se necessário
        sessionId: sessionStorage.getItem("session_id") || undefined,
      };

      // Usar navigator.sendBeacon se disponível (mais confiável)
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/game-events", blob);
      } else {
        // Fallback para fetch (não await para não bloquear)
        fetch("/api/analytics/game-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true, // Importante para requests em background
        }).catch(() => {
          // Silencioso - falhas no tracking não devem afetar UX
        });
      }
    } catch {
      // Silencioso - analytics não deve quebrar a app
    }
  }, []);

  // Handlers pré-configurados para eventos comuns
  const trackGameView = useCallback(
    (gameId: string, gameType: string, source: string = "dashboard") => {
      track({ type: "game_view", gameId, gameType, source });
    },
    [track]
  );

  const trackGameClick = useCallback(
    (gameId: string, gameType: string) => {
      track({ type: "game_click", gameId, gameType });
    },
    [track]
  );

  const trackParticipationStart = useCallback(
    (gameId: string, gameType: string, quantity: number) => {
      track({ type: "participation_start", gameId, gameType, quantity });
    },
    [track]
  );

  const trackPaymentMethodSelected = useCallback(
    (gameId: string, method: "mbway" | "saldo" | "stripe") => {
      track({ type: "payment_method_selected", gameId, method });
    },
    [track]
  );

  const trackPaymentSuccess = useCallback(
    (gameId: string, amount: number, method: string) => {
      track({ type: "payment_success", gameId, amount, method });
    },
    [track]
  );

  const trackPaymentFailed = useCallback(
    (gameId: string, reason: string) => {
      track({ type: "payment_failed", gameId, reason });
    },
    [track]
  );

  const trackScratchStart = useCallback(
    (gameId: string) => {
      track({ type: "scratch_start", gameId });
    },
    [track]
  );

  const trackScratchProgress = useCallback(
    (gameId: string, percent: number) => {
      track({ type: "scratch_progress", gameId, percent });
    },
    [track]
  );

  const trackScratchReveal = useCallback(
    (gameId: string, won: boolean, prizeValue?: number) => {
      track({ type: "scratch_reveal", gameId, won, prizeValue });
    },
    [track]
  );

  const trackTutorialOpen = useCallback(
    (gameType: string) => {
      track({ type: "tutorial_open", gameType });
    },
    [track]
  );

  const trackTutorialComplete = useCallback(
    (gameType: string) => {
      track({ type: "tutorial_complete", gameType });
    },
    [track]
  );

  const trackTutorialSkip = useCallback(
    (gameType: string) => {
      track({ type: "tutorial_skip", gameType });
    },
    [track]
  );

  return {
    track,
    trackGameView,
    trackGameClick,
    trackParticipationStart,
    trackPaymentMethodSelected,
    trackPaymentSuccess,
    trackPaymentFailed,
    trackScratchStart,
    trackScratchProgress,
    trackScratchReveal,
    trackTutorialOpen,
    trackTutorialComplete,
    trackTutorialSkip,
  };
}

// Utility para inicializar session ID (deve ser chamado uma vez na app)
export function initAnalyticsSession(): void {
  if (typeof window !== "undefined" && !sessionStorage.getItem("session_id")) {
    sessionStorage.setItem(
      "session_id",
      `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
    );
  }
}
