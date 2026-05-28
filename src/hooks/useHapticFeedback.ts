import { useCallback } from "react"

/**
 * Hook para feedback háptico (vibração) padronizado
 * Fornece uma função segura para vibrar o dispositivo móvel
 */
export function useHapticFeedback() {
  const vibrate = useCallback((duration: number = 10) => {
    // Verificar se estamos em um ambiente que suporta vibração
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(duration);
      } catch (e) {
        // Falha silenciosa - alguns navegadores podem não suportar ou bloquear
        console.debug("Haptic feedback not supported or blocked:", e);
      }
    }
  }, []);

  return { vibrate };
}
