"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { LayoutHeader } from "@/components/layout-header";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";

const AdminDashboard = dynamic(
  () => import("@/features/admin/SuperAdminDashboard").then((mod) => mod.default),
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <LoaderScreen message="A carregar" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8">
          <p className="text-destructive mb-4">Utilizador não encontrado. Faça login novamente.</p>
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
          aldeiaId={user.aldeiaId}
          userRole={user.role}
          aldeia={user.aldeia}
        />
      </LayoutHeader>
    </RoleGuard>
  );
}
