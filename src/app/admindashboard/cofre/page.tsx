"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";
import { AdminCofre } from "@/features/admin/admin-cofre";

const AdminCofrePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
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
    } catch (e) {
      setError("Erro ao carregar dados.");
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready || isLoading) {
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
    <RoleGuard allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="Cofre">
      <AdminCofre token={token} />
    </RoleGuard>
  );
};

export default AdminCofrePage;
