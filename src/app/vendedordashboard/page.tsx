"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RoleGuard } from "@/components/auth/RoleGuard";

const VendedorDashboard = dynamic(
  () => import("@/features/vendedor/vendedor-dashboard").then((mod) => mod.VendedorDashboard),
  { ssr: false }
);

interface User {
  role: string;
}

export default function VendedorDashboardPage() {
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
      allowedRoles={["vendedor"]}
      redirectPath="/clientedashboard"
      panelName="VendedorDashboard"
    >
      <VendedorDashboard token={token} />
    </RoleGuard>
  );
}
