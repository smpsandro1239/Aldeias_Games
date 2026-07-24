"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import { ReconciliacaoCofre } from "@/features/admin/reconciliacao-cofre";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReconciliacaoPage() {
  const router = useRouter();
  return (
    <DashboardShell allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="Reconciliação">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center gap-3 px-4 py-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <span className="font-serif font-bold text-lg text-accent">Reconciliação</span>
      </div>
      <ReconciliacaoCofre />
    </DashboardShell>
  );
}
