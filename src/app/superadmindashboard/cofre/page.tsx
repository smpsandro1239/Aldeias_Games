"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { SuperAdminCofre } from "@/features/admin/superadmin-cofre";

export default function SuperAdminCofrePage() {
  return (
    <DashboardShell allowedRoles={["super_admin"]} redirectPath="/superadmindashboard" panelName="Cofre Global">
      <SuperAdminCofre />
    </DashboardShell>
  );
}
