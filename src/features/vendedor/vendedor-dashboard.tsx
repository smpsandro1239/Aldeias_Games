"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { PedidosCarregamentoInline } from "./pedidos-inline";
import { VerificarHashModal } from "@/components/verificar-hash-modal";
import { VendedorCashbox } from "./vendedor-cashbox";
import { ProvaJogoModal } from "@/components/modals/prova-jogo-modal";
import { VendedorHeader } from "./vendedor-header";
import { VendedorStatGrid } from "./vendedor-stat-grid";
import { VendedorQuickActions } from "./vendedor-quick-actions";
import { VendedorOverviewTab } from "./vendedor-overview-tab";
import { VendedorAngariacaoTab } from "./vendedor-angariacao-tab";
import { VendedorHistoricoTab } from "./vendedor-historico-tab";
import { VendedorTabMenu } from "./vendedor-tab-menu";
import { VendedorAtividade } from "./vendedor-atividade";
import { VendedorEntregaDialog } from "./vendedor-entrega-dialog";
import type { VendedorStats, SaldoAngariado } from "./vendedor-types";

interface VendedorDashboardProps {
  token: string;
}

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockAtual: number;
  estado: string;
}

export function VendedorDashboard({ token }: VendedorDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<VendedorStats | null>(null);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "overview");
  const [pedidosPendentesCount, setPedidosPendentesCount] = useState(0);
  const [saldoAngariado, setSaldoAngariado] = useState<SaldoAngariado>({
    totalAngariado: 0,
    totalEntregue: 0,
    totalSolicitado: 0,
    saldoAEntregar: 0,
    historicoPedidos: [],
    historicoEntregas: []
  });
  const [entregaModalOpen, setEntregaModalOpen] = useState(false);
  const [verificarHashOpen, setVerificarHashOpen] = useState(false);
  const [depositoExternoOpen, setDepositoExternoOpen] = useState(false);
  const [provaModalOpen, setProvaModalOpen] = useState(false);
  const [provaParticipacaoId, setProvaParticipacaoId] = useState<string | null>(null);

  const handleSolicitarEntrega = async (valor: number) => {
    if (!valor || valor <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    if (valor > saldoAngariado.saldoAEntregar) {
      toast.error(`Valor máximo: €${saldoAngariado.saldoAEntregar.toFixed(2)}`);
      return;
    }

    try {
      const res = await apiRequest("/api/vendedor/entrega-saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor,
          observacoes: "Solicitação via dashboard"
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Solicitação de entrega enviada ao administrador!");
        setEntregaModalOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "Erro ao solicitar entrega");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao solicitar entrega");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const statsRes = await apiRequest("/api/dashboard/vendedor");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      const jogosRes = await apiRequest("/api/jogos?ativos=true");
      if (jogosRes.ok) {
        const jogosData = await jogosRes.json();
        setJogos(jogosData.data);
      }

      const pedidosRes = await apiRequest("/api/pedidos-carregamento?estado=pendente");
      if (pedidosRes.ok) {
        const pedidosData = await pedidosRes.json();
        setPedidosPendentesCount(pedidosData.data?.length || 0);
      }

      const saldoRes = await apiRequest("/api/vendedor/saldo-angariado");
      if (saldoRes.ok) {
        const saldoData = await saldoRes.json();
        setSaldoAngariado(saldoData.data || {
          totalAngariado: 0,
          totalEntregue: 0,
          totalSolicitado: 0,
          saldoAEntregar: 0
        });
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <VendedorLoadingSkeleton />;
  }

  const openDepositar = () => {
    setActiveTab("cofre");
    setTimeout(() => setDepositoExternoOpen(true), 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <VendedorHeader />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <VendedorStatGrid stats={stats} onNavigate={setActiveTab} />

        <VendedorQuickActions
          pedidosPendentesCount={pedidosPendentesCount}
          onGeral={() => setActiveTab("overview")}
          onJogos={() => router.push("/jogos")}
          onPedidos={() => setActiveTab("pedidos")}
          onAngariacao={() => setActiveTab("angariacao")}
          onCaixa={() => setActiveTab("cofre")}
          onHistorico={() => setActiveTab("historico")}
          onVerificar={() => setVerificarHashOpen(true)}
          onDepositar={openDepositar}
          onPedirSaldo={() => setActiveTab("pedidos")}
        />

        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="space-y-6">
              <VendedorOverviewTab saldoAngariado={saldoAngariado} />
            </TabsContent>

            <TabsContent value="pedidos" className="space-y-4">
              <PedidosCarregamentoInline token={token} />
            </TabsContent>

            <TabsContent value="angariacao" className="space-y-4">
              <VendedorAngariacaoTab
                saldoAngariado={saldoAngariado}
                onSolicitarEntrega={() => setEntregaModalOpen(true)}
              />
            </TabsContent>

            <TabsContent value="cofre" className="space-y-4">
              <VendedorCashbox
                token={token}
                externalDepositOpen={depositoExternoOpen}
                onExternalDepositOpenChange={setDepositoExternoOpen}
              />
            </TabsContent>

            <TabsContent value="historico" className="space-y-4">
              <VendedorHistoricoTab
                vendas={stats?.ultimasVendas || []}
                onVerProva={(id) => { setProvaParticipacaoId(id); setProvaModalOpen(true); }}
              />
            </TabsContent>

            <VendedorTabMenu
              pedidosPendentesCount={pedidosPendentesCount}
              onJogos={() => router.push("/jogos")}
              onVerificar={() => setVerificarHashOpen(true)}
              onDepositar={openDepositar}
              onPedirSaldo={() => setActiveTab("pedidos")}
            />
          </Tabs>
        </div>

        {stats?.ultimasVendas && stats.ultimasVendas.length > 0 && (
          <VendedorAtividade
            vendas={stats.ultimasVendas}
            onVerTudo={() => setActiveTab("historico")}
          />
        )}
      </div>

      <VendedorEntregaDialog
        open={entregaModalOpen}
        onOpenChange={setEntregaModalOpen}
        saldoDisponivel={saldoAngariado.saldoAEntregar}
        onSubmit={handleSolicitarEntrega}
      />

      <VerificarHashModal
        open={verificarHashOpen}
        onOpenChange={setVerificarHashOpen}
      />

      <ProvaJogoModal
        open={provaModalOpen}
        onOpenChange={setProvaModalOpen}
        participacaoId={provaParticipacaoId || undefined}
      />
    </div>
  );
}

export function VendedorLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-surface-container rounded animate-pulse" />
            <div className="h-4 w-64 bg-surface-container-low rounded animate-pulse" />
          </div>
          <div className="h-9 w-9 bg-surface-container rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}