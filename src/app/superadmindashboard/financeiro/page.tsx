"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import dynamic from "next/dynamic";

const FinanceiroOverview = dynamic(() => import("@/features/admin/financeiro-overview").then(mod => ({ default: mod.FinanceiroOverview })), { ssr: false });

export default function SuperAdminFinanceiroPage() {
  return (
    <DashboardShell allowedRoles={["super_admin"]} redirectPath="/superadmindashboard" panelName="Visão Financeira Global">
      <FinanceiroOverview />
    </DashboardShell>
  );
}
