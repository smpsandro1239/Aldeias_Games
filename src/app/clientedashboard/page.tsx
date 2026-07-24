"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { LayoutHeader } from "@/components/layout-header";
import { BottomNav } from "@/components/bottom-nav";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";
import { useAuth } from "@/hooks/use-auth";

// Constants
const ALLOWED_ROLES = ["user"];
const REDIRECT_PATH = "/";
const PANEL_NAME = "ClienteDashboard";

const ClienteDashboard = dynamic(
  () => import("@/features/cliente/cliente-dashboard").then((mod) => mod.ClienteDashboard),
  { ssr: false }
);

export default function ClienteDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return <LoaderScreen message="A carregar" />;
  }

  if (!isAuthenticated) {
    return <LoaderScreen message="Autenticando..." />;
  }

  return (
    <RoleGuard
      allowedRoles={ALLOWED_ROLES}
      redirectPath={REDIRECT_PATH}
      panelName={PANEL_NAME}
    >
      <LayoutHeader>
        <ClienteDashboard />
        <BottomNav role={user?.role || "user"} />
      </LayoutHeader>
    </RoleGuard>
  );
}
