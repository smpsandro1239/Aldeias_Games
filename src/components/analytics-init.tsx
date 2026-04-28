"use client";

import { useEffect } from "react";
import { initAnalyticsSession } from "@/lib/game-analytics";

export function AnalyticsInit() {
  useEffect(() => {
    // Inicializar session ID na primeira visita
    initAnalyticsSession();
  }, []);

  return null; // Componente invisível
}
