"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { toast } from "sonner";
import { generateCSV, downloadCSV } from "@/lib/export-utils";
import { SuperCofreHeader } from "@/components/dashboard/super-cofre-header";
import { SuperCofreStatsCards } from "@/components/dashboard/super-cofre-stats-cards";
import { SuperCofreToolbar } from "@/components/dashboard/super-cofre-toolbar";
import { SuperCofreAldeiasTab } from "@/components/dashboard/super-cofre-aldeias-tab";
import { SuperCofrePendentesTab } from "@/components/dashboard/super-cofre-pendentes-tab";
import { SuperCofreMovimentosTab } from "@/components/dashboard/super-cofre-movimentos-tab";
import type { AldeiaResumo, PendenteItem } from "./superadmin-cofre-types";

export function SuperAdminCofre() {
  const [aldeias, setAldeias] = useState<AldeiaResumo[]>([]);
  const [pendentes, setPendentes] = useState<PendenteItem[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDepId, setConfirmDepId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiRequest("/api/superadmin/cofre");
      if (res.ok) {
        const data = await res.json();
        setAldeias(data.data.aldeias);
        setPendentes(data.data.pendentes);
        setTotalGeral(data.data.totalGeral);
        setTotalPendentes(data.data.totalPendentes);
      }
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirmar = async (id: string) => {
    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ acao: "confirmar" })
      });
      if (res.ok) {
        toast.success("Depósito confirmado!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao confirmar");
      }
    } catch {
      toast.error("Erro ao confirmar depósito");
    }
  };

  const handleExportCSV = () => {
    const headers = ['Aldeia', 'Saldo Cofre', 'Vendedores', 'Total Angariado'];
    const rows = aldeias.map(a => [
      a.nome,
      a.saldoCofre.toFixed(2),
      String(a.numVendedores),
      a.totalAngariado.toFixed(2),
    ]);
    downloadCSV(generateCSV(headers, rows), `cofre-global-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const filteredAldeias = aldeias.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 p-4 md:p-6">
      <SuperCofreHeader />

      <SuperCofreStatsCards
        totalGeral={totalGeral}
        totalPendentes={totalPendentes}
        pendentesCount={pendentes.length}
        aldeiasCount={aldeias.length}
      />

      <SuperCofreToolbar
        search={search}
        onSearchChange={setSearch}
        onFinanceiro={() => window.location.href = '/superadmindashboard/financeiro'}
        onExportCSV={handleExportCSV}
        onRefresh={fetchData}
      />

      <Tabs defaultValue="aldeias">
        <TabsList>
          <TabsTrigger value="aldeias">Aldeias</TabsTrigger>
          <TabsTrigger value="pendentes" className="relative">
            Pendentes
            {pendentes.length > 0 && (
              <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs">
                {pendentes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="movimentos">Movimentos Globais</TabsTrigger>
        </TabsList>

        <SuperCofreAldeiasTab aldeias={filteredAldeias} />

        <SuperCofrePendentesTab
          pendentes={pendentes}
          onConfirmar={(id) => setConfirmDepId(id)}
        />

        <SuperCofreMovimentosTab aldeias={aldeias} />
      </Tabs>
    </div>

    <ConfirmModal
      open={!!confirmDepId}
      onOpenChange={(open) => { if (!open) setConfirmDepId(null); }}
      title="Confirmar Depósito"
      description="Tem a certeza de que deseja confirmar este depósito? O valor será creditado no cofre da aldeia."
      confirmText="Confirmar"
      variant="default"
      onConfirm={() => { if (confirmDepId) { handleConfirmar(confirmDepId); setConfirmDepId(null); } }}
    />
    </>
  );
}
