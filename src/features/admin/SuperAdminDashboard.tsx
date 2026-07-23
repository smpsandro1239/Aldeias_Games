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

import {
  Plus, Building2, Calendar, Wallet, Globe, RotateCcw,
  DollarSign, Users, Gamepad2, Trophy, CreditCard,
  Shield, TrendingUp, ArrowRight, BarChart3, Hash,
} from "lucide-react";

import {
  DashboardLoadingSkeleton, DashboardModalsLayer,
  OverviewTab, EventosTab, JogosTab, VencedoresTab,
  UsersTab, VerificarTab,
} from "./components";
import type { Evento, Jogo, Vencedor } from "./components/types";
import type { JogoData } from "@/components/modals/create-jogo-modal";
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
  const { token } = useAuth();

  const {
    loading, stats, eventos, jogos, users, vencedores, aldeias,
    transacoes, logs, vendedoresStats, pedidosPendentesCount,
    entregasPendentesCount, paymentMethodsDefault,
    selectedEventoIdParaJogo, filtroEventoId, activeTab,
    eventoModalOpen, setActiveTab, setPaymentMethodsDefault,
    setSelectedEventoIdParaJogo, setFiltroEventoId,
    setEventoModalOpen, fetchData,
  } = useAdminDashboardData({ aldeiaId, userRole, token, aldeia });

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
            <NotificationBell token={token} />
            <Button size="sm" onClick={() => { setSelectedAldeia(null); setAldeiaModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Aldeia
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* ===== STATS GRID ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Total Angariado"
            value={stats?.totalAngariado ? formatCurrency(stats.totalAngariado) : "0,00 €"}
            icon={<DollarSign className="h-5 w-5" />}
            color="emerald"
          />
          <StatCard
            title="Participações"
            value={stats?.totalParticipacoes?.toLocaleString("pt-PT") || "0"}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Aldeias"
            value={aldeias.length.toString()}
            icon={<Building2 className="h-5 w-5" />}
            color="violet"
          />
          <StatCard
            title="Jogos Ativos"
            value={stats?.jogosAtivos?.toString() || "0"}
            icon={<Gamepad2 className="h-5 w-5" />}
            color="amber"
          />
        </div>

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
              icon={<Wallet className="h-5 w-5" />}
              label="Cofre Global"
              onClick={() => router.push("/superadmindashboard/cofre")}
              color="emerald"
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
            <h2 className="font-serif text-lg font-semibold text-accent mb-3">Atividade Recente</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {transacoes.length > 0 && (
                <Card className="bg-card border-outline-variant/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Últimas Transações</h3>
                      <button onClick={() => setActiveTab("transacoes")} className="text-xs text-primary hover:underline flex items-center gap-1">
                        Ver tudo <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {transacoes.slice(0, 5).map((t) => (
                        <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-outline-variant/5 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-accent truncate">{t.user?.nome || "Sistema"}</p>
                            <p className="text-xs text-muted-foreground truncate">{t.descricao || t.tipo}</p>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <p className={`text-sm font-bold ${t.tipo === 'carregamento' || t.tipo === 'deposito' ? 'text-emerald-500' : 'text-red-500'}`}>
                              {t.tipo === 'carregamento' || t.tipo === 'deposito' ? '+' : '-'}{formatCurrency(t.valor)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {eventos.length > 0 && (
                <Card className="bg-card border-outline-variant/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Últimos Eventos</h3>
                      <button onClick={() => setActiveTab("eventos")} className="text-xs text-primary hover:underline flex items-center gap-1">
                        Ver tudo <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {eventos.slice(0, 5).map((e) => (
                        <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-outline-variant/5 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-accent truncate">{e.nome}</p>
                            <p className="text-xs text-muted-foreground">{e.aldeia?.nome || "—"}</p>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <Badge variant={e.estado === "ativo" ? "default" : "secondary"} className="text-xs">
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
          <h2 className="font-serif text-lg font-semibold text-accent mb-3">Gestão Detalhada</h2>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex overflow-x-auto gap-1 bg-surface-container-low p-1 rounded-xl">
              <TabsTrigger value="overview" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <TrendingUp className="h-4 w-4" /> Geral
              </TabsTrigger>
              <TabsTrigger value="eventos" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Calendar className="h-4 w-4" /> Eventos
              </TabsTrigger>
              <TabsTrigger value="jogos" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Gamepad2 className="h-4 w-4" /> Jogos
              </TabsTrigger>
              <TabsTrigger value="vencedores" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Trophy className="h-4 w-4" /> Prémios
              </TabsTrigger>
              <TabsTrigger value="aldeias" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Building2 className="h-4 w-4" /> Aldeias
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Users className="h-4 w-4" /> Users
              </TabsTrigger>
              <TabsTrigger value="transacoes" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <CreditCard className="h-4 w-4" /> Transações
              </TabsTrigger>
              <TabsTrigger value="verificar" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Hash className="h-4 w-4" /> Verificar
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Shield className="h-4 w-4" /> Auditoria
              </TabsTrigger>
            </TabsList>

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
                  setSelectedJogo={setSelectedJogo} setJogoModalOpen={setJogoModalOpen}
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
                  token={token}
                />
              </TabsContent>
              <TabsContent value="users">
                <UsersTab users={users} setSelectedUser={setSelectedUser}
                  setUserModalOpen={setUserModalOpen} requestDelete={requestDelete}
                />
              </TabsContent>
              <TabsContent value="aldeias">
                <Suspense fallback={<div className="p-8 text-center text-muted-foreground">A carregar...</div>}>
                  <AldeiasTab aldeias={aldeias} eventos={eventos} jogos={jogos}
                    setSelectedAldeia={setSelectedAldeia}
                    setAldeiaModalOpen={setAldeiaModalOpen}
                    setSelectedEvento={setSelectedEvento}
                    setEventoModalOpen={setEventoModalOpen}
                    setEventoModalAldeiaId={setEventoModalAldeiaId}
                    setSelectedJogo={handleSetSelectedJogo}
                    setJogoModalOpen={setJogoModalOpen}
                    setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
                    onToggleJogoEstado={handleToggleJogoEstado}
                    requestDelete={requestDelete}
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
        token={token} userRole={userRole} aldeiaId={aldeiaId} aldeia={aldeia}
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
        setToggleJogoData={setToggleJogoData} setSelectedPremio={setSelectedPremio}
        setConvertValor={setConvertValor}         handleSaveEvento={handleSaveEvento}
        handleSaveJogo={handleSaveJogo} handleSaveAldeia={handleSaveAldeia}
        handleSaveUser={handleSaveUser} handleConvertPrize={handleConvertPrize}
        executeDelete={executeDelete} executeToggleJogoEstado={executeToggleJogoEstado}
        fetchData={fetchData} setQrCodeData={setQrCodeData}
        eventoModalAldeiaId={eventoModalAldeiaId} setEventoModalAldeiaId={setEventoModalAldeiaId}
      />
    </div>
  );
}

/* ===== Local sub-components ===== */

function StatCard({
  title, value, icon, color,
}: {
  title: string; value: string; icon: React.ReactNode;
  color: "emerald" | "blue" | "violet" | "amber" | "pink" | "orange";
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };
  const borderMap = {
    emerald: "border-l-emerald-500",
    blue: "border-l-blue-500",
    violet: "border-l-violet-500",
    amber: "border-l-amber-500",
    pink: "border-l-pink-500",
    orange: "border-l-orange-500",
  };
  return (
    <Card className={`bg-card border-l-4 ${borderMap[color]} shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-xl md:text-2xl font-black text-foreground">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  icon, label, onClick, color,
}: {
  icon: React.ReactNode; label: string; onClick: () => void;
  color: "emerald" | "blue" | "violet" | "amber" | "pink" | "orange";
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
    violet: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
    pink: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 dark:text-pink-400",
    orange: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400",
  };
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl ${colorMap[color]} transition-all hover:scale-[1.02] active:scale-[0.98]`}
    >
      {icon}
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
  );
}
