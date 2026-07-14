"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { SuperAdminCofre } from "@/features/admin/superadmin-cofre";

export default function SuperAdminCofrePage() {
  return (
    <DashboardShell allowedRoles={["super_admin"]} redirectPath="/admindashboard/cofre" panelName="Cofre Global">
      <SuperAdminCofre />
    </DashboardShell>
  );
}
