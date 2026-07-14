"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { AdminCofre } from "@/features/admin/admin-cofre";

const AdminCofrePage = () => {
  return (
    <DashboardShell allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="Cofre">
      <AdminCofre />
    </DashboardShell>
  );
};

export default AdminCofrePage;
