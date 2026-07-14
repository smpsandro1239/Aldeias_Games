"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { FinanceiroOverview } from "@/features/admin/financeiro-overview";

const FinanceiroPage = () => {
  return (
    <DashboardShell allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="Financeiro">
      <FinanceiroOverview />
    </DashboardShell>
  );
};

export default FinanceiroPage;
