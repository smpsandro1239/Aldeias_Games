"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { FinanceiroOverview } from "@/features/admin/financeiro-overview";

export default function SuperAdminFinanceiroPage() {
  return (
    <DashboardShell allowedRoles={["super_admin"]} redirectPath="/superadmindashboard" panelName="Visão Financeira Global">
      <FinanceiroOverview />
    </DashboardShell>
  );
}
