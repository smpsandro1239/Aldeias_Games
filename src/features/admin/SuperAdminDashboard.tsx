"use client";
import { useState, useCallback, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAdminDashboardData } from "./hooks/use-admin-dashboard-data";
import useAdminCrudHandlers from "./hooks/use-admin-crud-handlers";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notification-bell";

import { QuickAction } from "@/components/dashboard/quick-action";
import { StatsDetailPanels } from "./components/stats-detail-panels";
import {
  Plus, Building2, Calendar, Wallet, Globe, RotateCcw,
  Users, Gamepad2, Trophy, CreditCard,
  Shield, TrendingUp, ArrowRight, BarChart3, Hash, Ticket, ClipboardList,
  Receipt, ArrowUpRight, ArrowDownRight, Clock,
} from "lucide-react";
import { usePendingChangesCount } from "@/hooks/use-pending-changes-count";

import {
  DashboardLoadingSkeleton, DashboardModalsLayer,
  OverviewTab, EventosTab, JogosTab, VencedoresTab,
  UsersTab, VerificarTab,
} from "./components";
import type { Evento, Jogo, Vencedor, Aldeia } from "./components/types";
import type { JogoData } from "@/components/modals/create-jogo-types";
import type { AldeiaData } from "@/components/modals/aldeia-modal";
import type { UserData } from "@/components/modals/user-modal";
import { formatCurrency } from "@/lib/utils";

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
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-accent">Painel Global</h1>
            <p className="text-sm text-muted-foreground">Gestão de todas as aldeias</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button size="sm" onClick={() => { setSelectedAldeia(null); setAldeiaModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Aldeia
            </Button>
          </div>
        </div>
      </div>

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
        <div>
          <h2 className="font-serif text-lg font-semibold text-accent mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction
              icon={<Building2 className="h-5 w-5" />}
              label="Nova Aldeia"
              onClick={() => { setSelectedAldeia(null); setAldeiaModalOpen(true); }}
              color="violet"
            />
            <QuickAction
              icon={<Calendar className="h-5 w-5" />}
              label="Novo Evento"
              onClick={() => { setSelectedEvento(null); setEventoModalOpen(true); }}
              color="blue"
            />
            <QuickAction
              icon={<Gamepad2 className="h-5 w-5" />}
              label="Novo Jogo"
              onClick={() => { setSelectedJogo(null); setJogoModalOpen(true); }}
              color="green"
            />
            <QuickAction
              icon={<Wallet className="h-5 w-5" />}
              label="Cofre Global"
              onClick={() => router.push("/superadmindashboard/cofre")}
              color="emerald"
            />
            <QuickAction
              icon={<Ticket className="h-5 w-5" />}
              label="Números"
              onClick={() => router.push("/numeros-jogados")}
              color="pink"
            />
            <QuickAction
              icon={<BarChart3 className="h-5 w-5" />}
              label="Financeiro"
              onClick={() => router.push("/superadmindashboard/financeiro")}
              color="amber"
            />
            <QuickAction
              icon={<Globe className="h-5 w-5" />}
              label="Lotaria Externa"
              onClick={() => setResultadosExternosOpen(true)}
              color="pink"
            />
            <QuickAction
              icon={<RotateCcw className="h-5 w-5" />}
              label="Recorrentes"
              onClick={handleProcessRecurringEvents}
              color="orange"
            />
            <QuickAction
              icon={<Users className="h-5 w-5" />}
              label="Utilizadores"
              onClick={() => setActiveTab("users")}
              color="blue"
            />
            <QuickAction
              icon={<ClipboardList className="h-5 w-5" />}
              label="Pedidos Pendentes"
              onClick={() => router.push("/pending-changes")}
              color="amber"
              badge={pendingCount}
            />
            <QuickAction
              icon={<Shield className="h-5 w-5" />}
              label="Auditoria"
              onClick={() => setActiveTab("auditoria")}
              color="violet"
            />
          </div>
        </div>

        {/* ===== RECENT ACTIVITY ===== */}
        {(transacoes.length > 0 || eventos.length > 0) && (
          <div>
            <h2 className="font-serif text-lg font-semibold text-accent mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" /> Atividade Recente
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {transacoes.length > 0 && (
                <Card className="bg-surface-container-low border-outline-variant/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-3 flex items-center justify-between border-b border-outline-variant/5">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Últimas Transações</h3>
                    </div>
                    <button onClick={() => setActiveTab("transacoes")} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium">
                      Ver tudo <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      {transacoes.slice(0, 5).map((t) => {
                        const isCredit = t.tipo === 'carregamento' || t.tipo === 'deposito';
                        return (
                          <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                {isCredit
                                  ? <ArrowUpRight className={`h-4 w-4 ${isCredit ? 'text-emerald-500' : 'text-red-500'}`} />
                                  : <ArrowDownRight className="h-4 w-4 text-red-500" />
                                }
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-accent truncate">{t.user?.nome || "Sistema"}</p>
                                <p className="text-xs text-muted-foreground truncate">{t.descricao || t.tipo}</p>
                              </div>
                            </div>
                            <div className="text-right ml-3 shrink-0">
                              <span className={`text-sm font-bold ${isCredit ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isCredit ? '+' : '-'}{formatCurrency(Math.abs(t.valor))}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
              {eventos.length > 0 && (
                <Card className="bg-surface-container-low border-outline-variant/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500/5 to-transparent px-4 py-3 flex items-center justify-between border-b border-outline-variant/5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <h3 className="text-sm font-semibold">Últimos Eventos</h3>
                    </div>
                    <button onClick={() => setActiveTab("eventos")} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium">
                      Ver tudo <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      {eventos.slice(0, 5).map((e) => (
                        <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-accent truncate">{e.nome}</p>
                              <p className="text-xs text-muted-foreground">{e.aldeia?.nome || "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={e.estado === "ativo" ? "default" : "secondary"} className={`text-xs capitalize ${e.estado === "ativo" ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20" : ""}`}>
                              {e.estado}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

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
