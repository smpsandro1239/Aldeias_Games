"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { ReconciliacaoCofre } from "@/features/admin/reconciliacao-cofre";

export default function ReconciliacaoPage() {
  return (
    <DashboardShell allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="Reconciliação">
      <ReconciliacaoCofre />
    </DashboardShell>
  );
}
