"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, RefreshCw, Scale } from "lucide-react";
import { toast } from "sonner";
import { CofreHeader } from "@/components/dashboard/cofre-header";
import { CofreStatsCards } from "@/components/dashboard/cofre-stats-cards";
import { CofreQuickActions } from "@/components/dashboard/cofre-quick-actions";
import { CofrePendentesTab } from "@/components/dashboard/cofre-pendentes-tab";
import { CofreConfirmadosTab } from "@/components/dashboard/cofre-confirmados-tab";
import { CofreLevantamentosTab } from "@/components/dashboard/cofre-levantamentos-tab";
import { CofreConfirmModals } from "@/components/dashboard/cofre-confirm-modals";
import { CofreTransactionHistory } from "./cofre-transaction-history";
import { CofreDepositDialog } from "./cofre-deposit-dialog";
import { CofreWithdrawalDialog } from "./cofre-withdrawal-dialog";
import type { DepositoData, VaultData, VaultTransacao, Levantamento } from "./admin-cofre-types";

export function AdminCofre() {
  const [depositos, setDepositos] = useState<DepositoData[]>([]);
  const [vault, setVault] = useState<VaultData | null>(null);
  const [levantamentos, setLevantamentos] = useState<Levantamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pendentes");
  const [vaultTransacoes, setVaultTransacoes] = useState<VaultTransacao[]>([]);
  const [vaultTransacoesTotal, setVaultTransacoesTotal] = useState(0);
  const [vaultTransacoesPage, setVaultTransacoesPage] = useState(1);
  const vaultTransacoesLimit = 20;

  const [levantamentoModalOpen, setLevantamentoModalOpen] = useState(false);
  const [depositoModalOpen, setDepositoModalOpen] = useState(false);

  const [confirmDepId, setConfirmDepId] = useState<string | null>(null);
  const [rejectDepId, setRejectDepId] = useState<string | null>(null);
  const [confirmLevId, setConfirmLevId] = useState<string | null>(null);
  const [rejectLevId, setRejectLevId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const aldeiaId = searchParams.get("aldeiaId") || undefined;

  const fetchData = useCallback(async () => {
    try {
      const [depRes, vaultRes, levRes] = await Promise.all([
        apiRequest(`/api/cofre/pedido-deposito${aldeiaId ? `?aldeiaId=${aldeiaId}` : ''}`),
        apiRequest(`/api/cofre/historico?page=${vaultTransacoesPage}&limit=${vaultTransacoesLimit}${aldeiaId ? `&aldeiaId=${aldeiaId}` : ''}`),
        apiRequest(`/api/cofre/levantamento${aldeiaId ? `?aldeiaId=${aldeiaId}` : ''}`),
      ]);

      if (depRes.ok) {
        const data = await depRes.json();
        setDepositos(data.data);
      }
      if (vaultRes.ok) {
        const data = await vaultRes.json();
        setVault(data.data);
        if (data.transacoes) {
          setVaultTransacoes(data.transacoes.data || []);
          setVaultTransacoesTotal(data.transacoes.pagination?.total || 0);
        }
      }
      if (levRes.ok) {
        const data = await levRes.json();
        setLevantamentos(data.data);
      }
    } catch {
      toast.error("Erro ao carregar dados do cofre");
    } finally {
      setLoading(false);
    }
  }, [vaultTransacoesPage, vaultTransacoesLimit, aldeiaId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirmarDeposito = async (id: string) => {
    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "confirmar" })
      });
      if (res.ok) {
        toast.success("Depósito confirmado com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao confirmar depósito");
      }
    } catch {
      toast.error("Erro ao confirmar depósito");
    }
  };

  const handleRejeitarDeposito = async (id: string, motivo: string) => {
    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "rejeitar", observacoes: motivo })
      });
      if (res.ok) {
        toast.success("Depósito rejeitado");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao rejeitar depósito");
      }
    } catch {
      toast.error("Erro ao rejeitar depósito");
    }
  };

  const handleConfirmarLevantamento = async (id: string) => {
    try {
      const res = await apiRequest(`/api/cofre/levantamento/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "confirmar" })
      });
      if (res.ok) {
        toast.success("Levantamento confirmado!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao confirmar");
      }
    } catch {
      toast.error("Erro ao confirmar levantamento");
    }
  };

  const handleRejeitarLevantamento = async (id: string, motivo: string) => {
    try {
      const res = await apiRequest(`/api/cofre/levantamento/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "rejeitar", observacoes: motivo })
      });
      if (res.ok) {
        toast.success("Levantamento rejeitado");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao rejeitar");
      }
    } catch {
      toast.error("Erro ao rejeitar levantamento");
    }
  };

  const goReconciliacao = () => {
    window.location.href = aldeiaId ? `/admindashboard/cofre/reconciliacao?aldeiaId=${aldeiaId}` : '/admindashboard/cofre/reconciliacao';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const pendentes = depositos.filter(d => d.estado === 'pendente');
  const confirmados = depositos.filter(d => d.estado === 'confirmado');
  const levPendentes = levantamentos.filter(l => l.estado === 'pendente');
  const levProcessados = levantamentos.filter(l => l.estado !== 'pendente');

  return (
    <>
      <div className="space-y-6 p-4 md:p-6">
        <CofreHeader aldeiaId={aldeiaId} />

        <CofreStatsCards
          vault={vault}
          pendentesCount={pendentes.length}
          levPendentesCount={levPendentes.length}
          levantamentos={levantamentos}
        />

        <CofreQuickActions
          onDepositar={() => setDepositoModalOpen(true)}
          onLevantar={() => setLevantamentoModalOpen(true)}
          onReconciliacao={goReconciliacao}
          onMovimentos={() => setActiveTab("historico")}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="pendentes" className="relative">
                Pendentes
                {pendentes.length + levPendentes.length > 0 && (
                  <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs">
                    {pendentes.length + levPendentes.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="confirmados">Depósitos</TabsTrigger>
              <TabsTrigger value="levantamentos">Levantamentos</TabsTrigger>
              <TabsTrigger value="historico">Movimentos</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setDepositoModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Send className="w-4 h-4 mr-2" />
                Depositar no Cofre
              </Button>
              <Button variant="outline" size="sm" onClick={goReconciliacao}>
                <Scale className="w-4 h-4 mr-2" />
                Reconciliação
              </Button>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          <CofrePendentesTab
            levPendentes={levPendentes}
            pendentes={pendentes}
            onAprovarLev={(id) => setConfirmLevId(id)}
            onRejeitarLev={(id) => setRejectLevId(id)}
            onConfirmarDep={(id) => setConfirmDepId(id)}
            onRejeitarDep={(id) => setRejectDepId(id)}
          />

          <CofreConfirmadosTab confirmados={confirmados} />

          <CofreLevantamentosTab
            levPendentes={levPendentes}
            levProcessados={levProcessados}
            onAprovarLev={handleConfirmarLevantamento}
            onRejeitarLev={(id) => setRejectLevId(id)}
            onSolicitar={() => setLevantamentoModalOpen(true)}
          />

          <TabsContent value="historico" className="space-y-3 mt-4">
            <CofreTransactionHistory
              transacoes={vaultTransacoes}
              total={vaultTransacoesTotal}
              page={vaultTransacoesPage}
              limit={vaultTransacoesLimit}
              onPageChange={setVaultTransacoesPage}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CofreDepositDialog
        open={depositoModalOpen}
        onOpenChange={setDepositoModalOpen}
        aldeiaId={aldeiaId}
        onSuccess={fetchData}
      />

      <CofreWithdrawalDialog
        open={levantamentoModalOpen}
        onOpenChange={setLevantamentoModalOpen}
        vaultSaldo={vault?.saldo || 0}
        aldeiaId={aldeiaId}
        onSuccess={fetchData}
      />

      <CofreConfirmModals
        confirmDepId={confirmDepId}
        rejectDepId={rejectDepId}
        confirmLevId={confirmLevId}
        rejectLevId={rejectLevId}
        setConfirmDepId={setConfirmDepId}
        setRejectDepId={setRejectDepId}
        setConfirmLevId={setConfirmLevId}
        setRejectLevId={setRejectLevId}
        onConfirmarDeposito={handleConfirmarDeposito}
        onRejeitarDeposito={handleRejeitarDeposito}
        onConfirmarLevantamento={handleConfirmarLevantamento}
        onRejeitarLevantamento={handleRejeitarLevantamento}
      />
    </>
  );
}
