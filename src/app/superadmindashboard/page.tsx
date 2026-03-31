"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";

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

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Erro ao parsing user:", e);
      }
    }
  }, []);

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <RoleGuard
      allowedRoles={["super_admin"]}
      redirectPath="/admindashboard"
      panelName="SuperAdminDashboard"
    >
      <AdminDashboard
        token={token}
        aldeiaId={user.aldeiaId}
        userRole={user.role}
        aldeia={user.aldeia}
      />
    </RoleGuard>
  );
}
