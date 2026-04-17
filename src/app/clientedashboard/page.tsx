"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";

const ClienteDashboard = dynamic(
  () => import("@/features/cliente/cliente-dashboard").then((mod) => mod.ClienteDashboard),
  { ssr: false }
);

export default function ClienteDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
    setLoading(false);
  }, []);

  if (loading || !token) {
    return <LoaderScreen message="A carregar" />;
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
