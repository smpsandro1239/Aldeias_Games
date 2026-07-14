"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, X } from "lucide-react";

const CONSENT_KEY = "aldeias-cookies-consent";

type ConsentLevel = "essential" | "analytics" | "all";

function getStoredConsent(): ConsentLevel | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CONSENT_KEY) as ConsentLevel | null;
}

function setStoredConsent(level: ConsentLevel): void {
  localStorage.setItem(CONSENT_KEY, level);
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleConsent = async (level: ConsentLevel) => {
    setStoredConsent(level);
    setVisible(false);

    // Record consent in DB (best-effort, anonymous if not logged in)
    try {
      await fetch("/api/rgpd/consentimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "cookies",
          concedeu: level !== "essential",
          dados: { nivel: level },
        }),
      });
    } catch {
      // Silent fail — consent is stored locally regardless
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-2xl bg-surface-container-high border border-outline-variant/20 rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-serif font-bold text-foreground">Cookies e Privacidade</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Utilizamos cookies para garantir o funcionamento da plataforma e melhorar a sua experiência.
              Pode escolher quais cookies aceitar.
            </p>
          </div>
          <button
            onClick={() => handleConsent("essential")}
            className="p-1 hover:bg-surface-container rounded-full transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {showDetails && (
          <div className="text-sm text-muted-foreground space-y-2 pl-8">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked disabled className="accent-primary" />
              <span><strong>Essenciais</strong> — Necessários para o funcionamento (sessão, autenticação, segurança)</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked disabled className="accent-primary" />
              <span><strong>Funcionais</strong> — Preferências de idioma, tema e configurações</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked disabled className="accent-primary" />
              <span><strong>Analíticos</strong> — Estatísticas anónimas de uso para melhorar a plataforma</span>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Pode alterar as suas preferências a qualquer momento em{" "}
              <a href="/dados-pessoais" className="text-primary hover:underline">Dados Pessoais</a>.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {!showDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(true)}
              className="text-xs"
            >
              Personalizar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConsent("essential")}
            className="text-xs"
          >
            Apenas Essenciais
          </Button>
          <Button
            size="sm"
            onClick={() => handleConsent("all")}
            className="text-xs bg-primary text-primary-foreground"
          >
            Aceitar Todos
          </Button>
        </div>
      </div>
    </div>
  );
}
