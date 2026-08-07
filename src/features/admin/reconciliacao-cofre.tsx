"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { generateCSV, downloadCSV } from "@/lib/export-utils";
import { ReconciliacaoHeader } from "@/components/dashboard/reconciliacao-header";
import { ReconciliacaoSummaryCards } from "@/components/dashboard/reconciliacao-summary-cards";
import { ReconciliacaoEquation } from "@/components/dashboard/reconciliacao-equation";
import { ReconciliacaoFilters } from "@/components/dashboard/reconciliacao-filters";
import { ReconciliacaoVendedoresTable } from "@/components/dashboard/reconciliacao-vendedores-table";
import { ReconciliacaoPendentesCard } from "@/components/dashboard/reconciliacao-pendentes-card";
import type { VendedorRec, PendenteItem, AldeiaResumo } from "./reconciliacao-cofre-types";

export function ReconciliacaoCofre() {
  const [vendedores, setVendedores] = useState<VendedorRec[]>([]);
  const [pendentes, setPendentes] = useState<PendenteItem[]>([]);
  const [aldeias, setAldeias] = useState<AldeiaResumo[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await apiRequest("/api/cofre/reconciliacao");
      if (res.ok) {
        const data = await res.json();
        setVendedores(data.data.vendedores);
        setPendentes(data.data.pendentes);
        setResumo(data.data.resumo);
        if (data.data.aldeias) setAldeias(data.data.aldeias);
      } else {
        toast.error("Erro ao carregar reconciliação");
      }
    } catch {
      toast.error("Erro ao carregar reconciliação");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportCSV = () => {
    const headers = ['Vendedor', 'Email', 'Total Recebido', 'Total Depositado', 'Saldo Cashbox', 'Saldo Esperado', 'Discrepância'];
    const rows = vendedores.map(v => [
      v.nome,
      v.email,
      v.totalRecebido.toFixed(2),
      v.totalDepositado.toFixed(2),
      v.saldoCashbox.toFixed(2),
      v.saldoEsperado.toFixed(2),
      v.discrepancia.toFixed(2),
    ]);
    downloadCSV(generateCSV(headers, rows), `reconciliacao-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const filteredVendedores = vendedores.filter(v =>
    v.nome.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <ReconciliacaoHeader
        onExportCSV={handleExportCSV}
        onRefresh={fetchData}
      />

      <ReconciliacaoSummaryCards resumo={resumo} />

      <ReconciliacaoEquation resumo={resumo} />

      <ReconciliacaoFilters
        aldeias={aldeias}
        search={search}
        onSearchChange={setSearch}
      />

      <ReconciliacaoVendedoresTable vendedores={filteredVendedores} />

      <ReconciliacaoPendentesCard pendentes={pendentes} />
    </div>
  );
}
