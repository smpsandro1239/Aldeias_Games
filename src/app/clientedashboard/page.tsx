"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";

const ClienteDashboard = dynamic(
  () => import("@/features/cliente/cliente-dashboard").then((mod) => mod.ClienteDashboard),
  { ssr: false }
);

interface User {
  role: string;
}

export default function ClienteDashboardPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <RoleGuard
      allowedRoles={["user"]}
      redirectPath="/"
      panelName="ClienteDashboard"
    >
      <ClienteDashboard token={token} />
    </RoleGuard>
  );
}
