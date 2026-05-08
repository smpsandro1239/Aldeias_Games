"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { LayoutHeader } from "@/components/layout-header";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";
import { useAuth } from "@/hooks/use-auth";

// Constants
const ALLOWED_ROLES = ["aldeia_admin"] as const;
const REDIRECT_PATH = "/clientedashboard";
const PANEL_NAME = "AdminDashboard";
const LOADING_MESSAGE = "A carregar";
const ERROR_MESSAGE = "Sessão inválida. Faça login novamente.";

const AdminDashboard = dynamic(
  () => import("@/features/admin/AdminDashboard").then((mod) => mod.default),
  { ssr: false }
);

interface User {
  role: string;
  aldeiaId?: string;
  aldeia?: {
    id: string;
    nome: string;
    slug: string;
    tipoOrganizacao: string;
  };
}

export default function AdminDashboardPage() {
  const { user: authUser, isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStoredData = useCallback(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (!savedToken) {
        setError("Token não encontrado. Faça login novamente.");
        return null;
      }

      if (!savedUser) {
        setError("Utilizador não encontrado. Faça login novamente.");
        return null;
      }

      const parsedUser = JSON.parse(savedUser) as User;
      return { token: savedToken, user: parsedUser };
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      setError("Erro ao carregar dados.");
      return null;
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return <LoaderScreen message={LOADING_MESSAGE} />;
  }

  if (!isAuthenticated || !authUser) {
    return <LoaderScreen message="Autenticando..." />;
  }

  const storedData = getStoredData();
  if (!storedData || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8">
          <p className="text-destructive mb-4">{error || ERROR_MESSAGE}</p>
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

  if (loading) {
    return <LoaderScreen message="A carregar" />;
  }

  if (error || !user || !token) {
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
    <RoleGuard
      allowedRoles={ALLOWED_ROLES}
      redirectPath={REDIRECT_PATH}
      panelName={PANEL_NAME}
    >
      <LayoutHeader>
        <AdminDashboard
          token={storedData.token}
          aldeiaId={storedData.user.aldeiaId}
          userRole={storedData.user.role}
          aldeia={storedData.user.aldeia}
        />
      </LayoutHeader>
    </RoleGuard>
  );
}
