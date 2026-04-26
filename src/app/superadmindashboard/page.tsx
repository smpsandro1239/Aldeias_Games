"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { LayoutHeader } from "@/components/layout-header";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";

const AdminDashboard = dynamic(
  () => import("@/features/admin/admin-dashboard").then((mod) => mod.AdminDashboard),
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

export default function SuperAdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      
      if (savedToken) {
        setToken(savedToken);
      } else {
        setError("Token não encontrado. Faça login novamente.");
      }
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setError("Utilizador não encontrado. Faça login novamente.");
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      allowedRoles={["super_admin"]}
      redirectPath="/admindashboard"
      panelName="SuperAdminDashboard"
    >
      <LayoutHeader>
        <AdminDashboard
          token={token}
          aldeiaId={user.aldeiaId}
          userRole={user.role}
          aldeia={user.aldeia}
        />
      </LayoutHeader>
    </RoleGuard>
  );
}
