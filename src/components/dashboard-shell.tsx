"use client";

import { useState, useEffect } from "react";
import { LayoutHeader } from "@/components/layout-header";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";

interface DashboardShellProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectPath?: string;
  panelName?: string;
}

export function DashboardShell({
  children,
  allowedRoles,
  redirectPath = "/",
  panelName = "Dashboard",
}: DashboardShellProps) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
      } else {
        setError("Token não encontrado. Faça login novamente.");
      }
    } catch {
      setError("Erro ao carregar dados.");
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return <LoaderScreen message="A carregar" />;
  }

  if (error || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8">
          <p className="text-destructive mb-4">{error || "Sessão inválida. Faça login novamente."}</p>
          <button
            onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={allowedRoles} redirectPath={redirectPath} panelName={panelName}>
      <LayoutHeader>
        {children}
      </LayoutHeader>
    </RoleGuard>
  );
}
