"use client";
import { DashboardShell } from "@/components/dashboard-shell";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const FinanceiroOverview = dynamic(() => import("@/features/admin/financeiro-overview").then(mod => ({ default: mod.FinanceiroOverview })), { ssr: false });

const FinanceiroPage = () => {
  const router = useRouter();
  return (
    <DashboardShell allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="Financeiro">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center gap-3 px-4 py-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <span className="font-serif font-bold text-lg text-accent">Financeiro</span>
      </div>
      <FinanceiroOverview />
    </DashboardShell>
  );
};

export default FinanceiroPage;
