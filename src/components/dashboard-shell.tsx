"use client";

import { useState, useEffect } from "react";
import { LayoutHeader } from "@/components/layout-header";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoaderScreen } from "@/components/loader-screen";

interface DashboardShellProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectPath?: string;
  panelName?: string;
}

export function DashboardShell({
  children,
  allowedRoles,
  redirectPath = "/",
  panelName = "Dashboard",
}: DashboardShellProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <LoaderScreen message="A carregar" />;
  }

  return (
    <RoleGuard
      allowedRoles={allowedRoles}
      redirectPath={redirectPath}
      panelName={panelName}
    >
      <LayoutHeader>
        {children}
      </LayoutHeader>
    </RoleGuard>
  );
}
