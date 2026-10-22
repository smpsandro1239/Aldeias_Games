"use client";

import { useState, useEffect } from "react";

// FIX (segurança): o nome do cookie de autenticação é derivado em runtime para
// acompanhar o prefixo __Host- usado em produção (ver src/lib/auth.ts).
// NOTA: o cookie é httpOnly, portanto este hook só funciona como heurística
// em desenvolvimento; a autenticação real é sempre validada no servidor.
function getAuthCookieName(): string {
  const isProd =
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    !["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isProd ? "__Host-auth-token" : "auth-token";
}

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkCookie = () => {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(c => c.trim().startsWith(`${getAuthCookieName()}=`));
      if (authCookie) {
        const tokenValue = authCookie.split('=')[1];
        setToken(tokenValue);
      } else {
        setToken(null);
      }
    };

    checkCookie();

    const interval = setInterval(checkCookie, 1000);
    return () => clearInterval(interval);
  }, []);

  return token;
}

export function getAuthHeaders(): HeadersInit {
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(c => c.trim().startsWith(`${getAuthCookieName()}=`));

  if (authCookie) {
    const token = authCookie.split('=')[1];
    return { Authorization: `Bearer ${token}` };
  }

  return {};
}
