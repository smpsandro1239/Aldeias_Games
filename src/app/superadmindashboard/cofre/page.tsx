"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";
import { SuperAdminCofre } from "@/features/admin/superadmin-cofre";

export default function SuperAdminCofrePage() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      if (savedToken) setToken(savedToken);
      else setError("Token não encontrado");
    } catch {
      setError("Erro ao carregar dados");
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) return <LoaderScreen message="A carregar" />;

  if (error || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8">
          <p className="text-destructive mb-4">{error}</p>
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
    <RoleGuard allowedRoles={["super_admin"]} redirectPath="/admindashboard/cofre" panelName="Cofre Global">
      <SuperAdminCofre token={token} />
    </RoleGuard>
  );
}
