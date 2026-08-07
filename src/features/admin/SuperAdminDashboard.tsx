"use client";
import { useState, useCallback, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAdminDashboardData } from "./hooks/use-admin-dashboard-data";
import useAdminCrudHandlers from "./hooks/use-admin-crud-handlers";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { StatsDetailPanels } from "./components/stats-detail-panels";
import {
  Trophy, CreditCard, Shield, TrendingUp, BarChart3, Hash,
  Calendar, Gamepad2, Building2, Users,
} from "lucide-react";
import { usePendingChangesCount } from "@/hooks/use-pending-changes-count";

import {
  DashboardLoadingSkeleton, DashboardModalsLayer,
  OverviewTab, EventosTab, JogosTab, VencedoresTab,
  UsersTab, VerificarTab,
} from "./components";
import { SuperHeader } from "@/components/dashboard/super-header";
import { SuperQuickActions } from "@/components/dashboard/super-quick-actions";
import { SuperRecentActivity } from "@/components/dashboard/super-recent-activity";
import type { Evento, Jogo, Vencedor, Aldeia } from "./components/types";
import type { JogoData } from "@/components/modals/create-jogo-types";
import type { AldeiaData } from "@/components/modals/aldeia-modal";
import type { UserData } from "@/components/modals/user-modal";

const DashboardAnalytics = lazy(() =>
  import("./analytics-dashboard").then((m) => ({ default: m.DashboardAnalytics }))
);
const AldeiasTab = lazy(() =>
  import("./components").then((m) => ({ default: m.AldeiasTab }))
);
const TransacoesTab = lazy(() =>
  import("./components").then((m) => ({ default: m.TransacoesTab }))
);
const AuditoriaTab = lazy(() =>
  import("./components").then((m) => ({ default: m.AuditoriaTab }))
);

interface SuperAdminDashboardProps {
  aldeiaId?: string;
  userRole?: string;
  aldeia?: {
    id: string;
    nome: string;
    slug: string;
    tipoOrganizacao: string;
    logoUrl?: string;
    metodosPagamentoDefault?: string;
  };
}

export default function SuperAdminDashboard({
  aldeiaId,
  userRole = "super_admin",
  aldeia,
}: SuperAdminDashboardProps) {
  const router = useRouter();
  useAuth();
  const pendingCount = usePendingChangesCount();

  const {
    loading, stats, eventos, jogos, users, vencedores, aldeias,
    transacoes, logs, vendedoresStats, pedidosPendentesCount,
    entregasPendentesCount, paymentMethodsDefault,
    selectedEventoIdParaJogo, filtroEventoId, activeTab,
    eventoModalOpen, setActiveTab, setPaymentMethodsDefault,
    setSelectedEventoIdParaJogo, setFiltroEventoId,
    setEventoModalOpen, fetchData,
  } = useAdminDashboardData({ aldeiaId, userRole, aldeia });

  const [jogoModalOpen, setJogoModalOpen] = useState(false);
  const [aldeiaModalOpen, setAldeiaModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [convertPrizeOpen, setConvertPrizeOpen] = useState(false);
  const [confirmEntregaOpen, setConfirmEntregaOpen] = useState(false);
  const [verificarHashOpen, setVerificarHashOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [resultadosExternosOpen, setResultadosExternosOpen] = useState(false);
  const [testJogoOpen, setTestJogoOpen] = useState(false);

  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedJogo, setSelectedJogo] = useState<JogoData | null>(null);
  const [selectedAldeia, setSelectedAldeia] = useState<AldeiaData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedPremio, setSelectedPremio] = useState<Vencedor | null>(null);
  const [eventoModalAldeiaId, setEventoModalAldeiaId] = useState("");
  const [convertValor, setConvertValor] = useState("25");
  const [qrCodeData, setQrCodeData] = useState<{ jogoId?: string; eventoId?: string; aldeiaSlug?: string; type: "jogo" | "evento" | "aldeia" } | null>(null);
  const [testJogo, setTestJogo] = useState<Jogo | null>(null);
  const [testJogoTotalParticipacoes, setTestJogoTotalParticipacoes] = useState(0);
  const [deleteData, setDeleteData] = useState<{ type: string; id: string } | null>(null);
  const [toggleJogoData, setToggleJogoData] = useState<{ jogo: Jogo; novoEstado: 'aberto' | 'fechado' } | null>(null);
  const [focusAldeiaId, setFocusAldeiaId] = useState<string | null>(null);

  const handleAbrirAldeia = useCallback((aldeia: Aldeia) => {
    setFocusAldeiaId(aldeia.id);
    setActiveTab("aldeias");
  }, [setActiveTab]);

  const {
    handleProcessRecurringEvents, handleSaveEvento, handleSaveJogo,
    handleToggleJogoEstado, handleTestarJogo, executeToggleJogoEstado,
    handleSaveAldeia, handleSaveUser, handleConvertPrize,
    requestDelete, executeDelete, getEstadoBadge,
    handleVerJogos: hookHandleVerJogos, handleLimparFiltroJogos,
    handleSetSelectedJogo, handleSetSelectedAldeia, handleSetSelectedUser,
  } = useAdminCrudHandlers({
    fetchData, aldeiaId, userRole, eventoModalOpen, jogoModalOpen,
    aldeiaModalOpen, userModalOpen, convertPrizeOpen, deleteData,
    toggleJogoData, selectedEventoIdParaJogo, filtroEventoId,
    setTestJogoOpen, setTestJogo, setTestJogoTotalParticipacoes,
    setSelectedEventoIdParaJogo, setFiltroEventoId, setEventoModalOpen,
    setJogoModalOpen, setAldeiaModalOpen, setUserModalOpen,
    setConvertPrizeOpen, setDeleteData, setToggleJogoData,
    setSelectedEvento, setSelectedJogo, setSelectedAldeia, setSelectedUser,
  });

  const handleVerJogos = useCallback((eventoId: string) => {
    hookHandleVerJogos(eventoId);
    setActiveTab("jogos");
  }, [hookHandleVerJogos]);

  if (loading) return <DashboardLoadingSkeleton />;

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <SuperHeader
        onNovaAldeia={() => { setSelectedAldeia(null); setAldeiaModalOpen(true); }}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* ===== STATS GRID + DETAILS ===== */}
        <StatsDetailPanels
          stats={stats}
          aldeias={aldeias}
          eventos={eventos}
          jogos={jogos}
          transacoes={transacoes}
          vencedores={vencedores}
          mode="global"
          onNavigate={setActiveTab}
          onPush={router.push}
          onSelectAldeia={handleAbrirAldeia}
        />

        {/* ===== QUICK ACTIONS ===== */}
        <SuperQuickActions
          pendingCount={pendingCount}
          onNovaAldeia={() => { setSelectedAldeia(null); setAldeiaModalOpen(true); }}
          onNovoEvento={() => { setSelectedEvento(null); setEventoModalOpen(true); }}
          onNovoJogo={() => { setSelectedJogo(null); setJogoModalOpen(true); }}
          onCofreGlobal={() => router.push("/superadmindashboard/cofre")}
          onNumeros={() => router.push("/numeros-jogados")}
          onFinanceiro={() => router.push("/superadmindashboard/financeiro")}
          onLotariaExterna={() => setResultadosExternosOpen(true)}
          onRecorrentes={handleProcessRecurringEvents}
          onUtilizadores={() => setActiveTab("users")}
          onPedidosPendentes={() => router.push("/pending-changes")}
          onAuditoria={() => setActiveTab("auditoria")}
        />

        {/* ===== RECENT ACTIVITY ===== */}
        <SuperRecentActivity
          transacoes={transacoes}
          eventos={eventos}
          onVerTudoTransacoes={() => setActiveTab("transacoes")}
          onVerTudoEventos={() => setActiveTab("eventos")}
        />

        {/* ===== TABS (deep dive) ===== */}
        <div>
          <h2 className="font-serif text-lg font-semibold text-accent mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Gestão Detalhada
          </h2>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
              <TabsList className="flex overflow-x-auto gap-1 bg-surface-container-low p-1 rounded-xl scrollbar-none">
                <TabsTrigger value="overview" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-lg transition-all">
                  <TrendingUp className="h-4 w-4" /> Geral
                </TabsTrigger>
                <TabsTrigger value="eventos" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-lg transition-all">
                  <Calendar className="h-4 w-4" /> Eventos
                </TabsTrigger>
                <TabsTrigger value="jogos" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-lg transition-all">
                  <Gamepad2 className="h-4 w-4" /> Jogos
                </TabsTrigger>
                <TabsTrigger value="vencedores" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-lg transition-all">
                  <Trophy className="h-4 w-4" /> Prémios
                </TabsTrigger>
                <TabsTrigger value="aldeias" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-lg transition-all">
                  <Building2 className="h-4 w-4" /> Aldeias
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-lg transition-all">
                  <Users className="h-4 w-4" /> Users
                </TabsTrigger>
                <TabsTrigger value="transacoes" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-lg transition-all">
                  <CreditCard className="h-4 w-4" /> Transações
                </TabsTrigger>
                <TabsTrigger value="verificar" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-lg transition-all">
                  <Hash className="h-4 w-4" /> Verificar
                </TabsTrigger>
                <TabsTrigger value="auditoria" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold data-[state=active]:shadow-lg transition-all">
                  <Shield className="h-4 w-4" /> Auditoria
                </TabsTrigger>
              </TabsList>
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            </div>

            <div className="mt-4">
              <TabsContent value="overview">
                <OverviewTab
                  stats={stats} eventos={eventos} setSelectedEvento={setSelectedEvento}
                  setEventoModalOpen={setEventoModalOpen} setJogoModalOpen={setJogoModalOpen}
                  setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
                  getEstadoBadge={getEstadoBadge} userRole={userRole}
                />
              </TabsContent>
              <TabsContent value="eventos">
                <EventosTab eventos={eventos} setSelectedEvento={setSelectedEvento}
                  setEventoModalOpen={setEventoModalOpen} setJogoModalOpen={setJogoModalOpen}
                  requestDelete={requestDelete} getEstadoBadge={getEstadoBadge}
                  onVerJogos={handleVerJogos}
                />
              </TabsContent>
              <TabsContent value="jogos">
                <JogosTab jogos={jogos} eventos={eventos} userRole={userRole}
                  selectedEventoIdParaJogo={selectedEventoIdParaJogo}
                   setSelectedJogo={handleSetSelectedJogo} setJogoModalOpen={setJogoModalOpen}
                  setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
                  setQrCodeData={setQrCodeData} setQrCodeOpen={setQrCodeOpen}
                  handleTestarJogo={handleTestarJogo} setTestJogoOpen={setTestJogoOpen}
                  requestDelete={requestDelete} getEstadoBadge={getEstadoBadge}
                  onToggleEstado={handleToggleJogoEstado} filtroEventoId={filtroEventoId}
                  onLimparFiltro={handleLimparFiltroJogos}
                />
              </TabsContent>
              <TabsContent value="vencedores">
                <VencedoresTab vencedores={vencedores} setSelectedPremio={setSelectedPremio}
                  setConvertPrizeOpen={setConvertPrizeOpen} setConfirmEntregaOpen={setConfirmEntregaOpen}
                />
              </TabsContent>
              <TabsContent value="users">
                <UsersTab users={users}                 setSelectedUser={handleSetSelectedUser}
                  setUserModalOpen={setUserModalOpen} requestDelete={requestDelete}
                />
              </TabsContent>
              <TabsContent value="aldeias">
                <Suspense fallback={<div className="p-8 text-center text-muted-foreground">A carregar...</div>}>
                  <AldeiasTab aldeias={aldeias} eventos={eventos} jogos={jogos}
                    setSelectedAldeia={handleSetSelectedAldeia}
                    setAldeiaModalOpen={setAldeiaModalOpen}
                    setSelectedEvento={setSelectedEvento}
                    setEventoModalOpen={setEventoModalOpen}
                    setEventoModalAldeiaId={setEventoModalAldeiaId}
                    setSelectedJogo={handleSetSelectedJogo}
                    setJogoModalOpen={setJogoModalOpen}
                    setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
                    onToggleJogoEstado={handleToggleJogoEstado}
                    requestDelete={requestDelete}
                    focusAldeiaId={focusAldeiaId}
                    onFocusConsumed={() => setFocusAldeiaId(null)}
                  />
                </Suspense>
              </TabsContent>
              <TabsContent value="transacoes">
                <Suspense fallback={<div className="p-8 text-center text-muted-foreground">A carregar...</div>}>
                  <TransacoesTab transacoes={transacoes} />
                </Suspense>
              </TabsContent>
              <TabsContent value="verificar">
                <VerificarTab setVerificarHashOpen={setVerificarHashOpen} />
              </TabsContent>
              <TabsContent value="auditoria">
                <Suspense fallback={<div className="p-8 text-center text-muted-foreground">A carregar...</div>}>
                  <AuditoriaTab logs={logs} />
                </Suspense>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <DashboardModalsLayer
        userRole={userRole} aldeiaId={aldeiaId} aldeia={aldeia}
        aldeias={aldeias} paymentMethodsDefault={paymentMethodsDefault}
        selectedEvento={selectedEvento} selectedJogo={selectedJogo}
        selectedAldeia={selectedAldeia} selectedUser={selectedUser}
        selectedPremio={selectedPremio} selectedEventoIdParaJogo={selectedEventoIdParaJogo}
        deleteData={deleteData} toggleJogoData={toggleJogoData}
        qrCodeData={qrCodeData} testJogo={testJogo}
        testJogoTotalParticipacoes={testJogoTotalParticipacoes}
        convertValor={convertValor} eventoModalOpen={eventoModalOpen}
        jogoModalOpen={jogoModalOpen} aldeiaModalOpen={aldeiaModalOpen}
        userModalOpen={userModalOpen} resultadosExternosOpen={resultadosExternosOpen}
        verificarHashOpen={verificarHashOpen} qrCodeOpen={qrCodeOpen}
        testJogoOpen={testJogoOpen} convertPrizeOpen={convertPrizeOpen}
        confirmEntregaOpen={confirmEntregaOpen}
        setEventoModalOpen={setEventoModalOpen} setJogoModalOpen={setJogoModalOpen}
        setAldeiaModalOpen={setAldeiaModalOpen} setUserModalOpen={setUserModalOpen}
        setResultadosExternosOpen={setResultadosExternosOpen}
        setVerificarHashOpen={setVerificarHashOpen} setQrCodeOpen={setQrCodeOpen}
        setTestJogoOpen={setTestJogoOpen} setConvertPrizeOpen={setConvertPrizeOpen}
        setConfirmEntregaOpen={setConfirmEntregaOpen} setDeleteData={setDeleteData}
        setToggleJogoData={setToggleJogoData} setSelectedAldeia={handleSetSelectedAldeia} setSelectedPremio={setSelectedPremio}
        setConvertValor={setConvertValor}         handleSaveEvento={handleSaveEvento}
        handleSaveJogo={handleSaveJogo} handleSaveAldeia={handleSaveAldeia}
        handleSaveUser={handleSaveUser} handleConvertPrize={handleConvertPrize}
        executeDelete={executeDelete} executeToggleJogoEstado={executeToggleJogoEstado}
        fetchData={fetchData}
        eventoModalAldeiaId={eventoModalAldeiaId} setEventoModalAldeiaId={setEventoModalAldeiaId}
      />
    </div>
  );
}
