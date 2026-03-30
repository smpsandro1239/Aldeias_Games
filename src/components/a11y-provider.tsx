"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface A11yContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  fontSize: "normal" | "large" | "xlarge";
  setFontSize: (size: "normal" | "large" | "xlarge") => void;
}

const A11yContext = createContext<A11yContextValue | null>(null);

export function A11yProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [fontSize, setFontSizeState] = useState<"normal" | "large" | "xlarge">("normal");

  // Load preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedFontSize = localStorage.getItem("fontSize") as "normal" | "large" | "xlarge" | null;
    
    if (savedTheme) setThemeState(savedTheme);
    if (savedFontSize) setFontSizeState(savedFontSize);
  }, []);

  // Listen for system preferences
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);
    
    const handleMotion = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener("change", handleMotion);

    const contrastQuery = window.matchMedia("(prefers-contrast: more)");
    setPrefersHighContrast(contrastQuery.matches);
    
    const handleContrast = (e: MediaQueryListEvent) => setPrefersHighContrast(e.matches);
    contrastQuery.addEventListener("change", handleContrast);

    return () => {
      motionQuery.removeEventListener("change", handleMotion);
      contrastQuery.removeEventListener("change", handleContrast);
    };
  }, []);

  // Apply font size to document
  useEffect(() => {
    const sizes = {
      normal: "16px",
      large: "18px",
      xlarge: "20px",
    };
    document.documentElement.style.fontSize = sizes[fontSize];
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const setFontSize = (size: "normal" | "large" | "xlarge") => {
    setFontSizeState(size);
    localStorage.setItem("fontSize", size);
  };

  return (
    <A11yContext.Provider
      value={{
        theme,
        setTheme,
        prefersReducedMotion,
        prefersHighContrast,
        fontSize,
        setFontSize,
      }}
    >
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error("useA11y must be used within A11yProvider");
  }
  return context;
}

// Accessibility settings panel
export function AccessibilitySettings() {
  const { theme, setTheme, fontSize, setFontSize, prefersReducedMotion } = useA11y();

  return (
    <div className="space-y-6 p-4 bg-[#1f1b19] rounded-xl border border-[#58413b]/20">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="text-xl">♿</span>
        Acessibilidade
      </h3>

      {/* Theme */}
      <div className="space-y-2">
        <label className="text-sm text-[#e0bfb7]">Tema</label>
        <div className="flex gap-2">
          {(["light", "dark", "system"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                theme === t
                  ? "bg-[#ff734b] text-[#110d0c]"
                  : "bg-[#2e2928] text-white hover:bg-[#58413b]/30"
              }`}
            >
              {t === "system" ? "Sistema" : t === "light" ? "Claro" : "Escuro"}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <label className="text-sm text-[#e0bfb7]">Tamanho do Texto</label>
        <div className="flex gap-2">
          {(["normal", "large", "xlarge"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                fontSize === s
                  ? "bg-[#ff734b] text-[#110d0c]"
                  : "bg-[#2e2928] text-white hover:bg-[#58413b]/30"
              }`}
            >
              {s === "normal" ? "Normal" : s === "large" ? "Grande" : "Muito Grande"}
            </button>
          ))}
        </div>
      </div>

      {/* Reduced Motion Info */}
      <div className="flex items-start gap-3 p-3 bg-[#2e2928] rounded-lg">
        <span className="text-lg">⚙️</span>
        <div>
          <p className="text-sm text-white font-medium">Movimento Reduzido</p>
          <p className="text-xs text-[#e0bfb7]">
            {prefersReducedMotion
              ? "Ativado nas definições do sistema"
              : "Use as definições do sistema para ativar"}
          </p>
        </div>
      </div>

      {/* Keyboard shortcuts info */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm text-[#e0bfb7] hover:text-white">
          Atalhos de Teclado
          <span className="transform group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#e0bfb7]">Abrir menu</span>
            <kbd className="px-2 py-1 bg-[#2e2928] rounded">Tab</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-[#e0bfb7]">Fechar modal</span>
            <kbd className="px-2 py-1 bg-[#2e2928] rounded">Esc</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-[#e0bfb7]">Confirmar ação</span>
            <kbd className="px-2 py-1 bg-[#2e2928] rounded">Enter</kbd>
          </div>
        </div>
      </details>
    </div>
  );
}
