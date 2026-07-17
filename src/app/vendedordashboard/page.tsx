"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { LayoutHeader } from "@/components/layout-header";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";
import { useAuth } from "@/hooks/use-auth";

const VendedorDashboard = dynamic(
  () => import("@/features/vendedor/vendedor-dashboard").then((mod) => mod.VendedorDashboard),
  { ssr: false }
);

export default function VendedorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <LoaderScreen message="A carregar" />;
  }

  return (
    <RoleGuard allowedRoles={["vendedor", "aldeia_admin"]} redirectPath="/" panelName="Vendedor">
      <LayoutHeader>
        <VendedorDashboard token={token || ""} />
      </LayoutHeader>
    </RoleGuard>
  );
}
