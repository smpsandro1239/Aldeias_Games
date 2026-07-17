"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import dynamic from "next/dynamic";

const FinanceiroOverview = dynamic(() => import("@/features/admin/financeiro-overview").then(mod => ({ default: mod.FinanceiroOverview })), { ssr: false });

const FinanceiroPage = () => {
  return (
    <DashboardShell allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="Financeiro">
      <FinanceiroOverview />
    </DashboardShell>
  );
};

export default FinanceiroPage;
