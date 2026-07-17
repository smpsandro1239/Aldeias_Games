"use client";
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdminDashboardData } from "./hooks/use-admin-dashboard-data";
import useAdminCrudHandlers from "./hooks/use-admin-crud-handlers";

import { Tabs } from "@/components/ui/tabs";

import {
  DashboardLoadingSkeleton,
  DashboardHeader,
  DashboardStatCards,
  DashboardTabsNavigation,
  DashboardTabContent,
  DashboardModalsLayer,
} from "./components";

import type {
  Evento,
  Jogo,
  Vencedor,
} from "./components/types";
import type { JogoData } from "@/components/modals/create-jogo-modal";
import type { AldeiaData } from "@/components/modals/aldeia-modal";
import type { UserData } from "@/components/modals/user-modal";

interface AdminDashboardProps {
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

export default function AdminDashboard({
  aldeiaId,
  userRole = "aldeia_admin",
  aldeia,
}: AdminDashboardProps) {
  const { token } = useAuth();

  const {
    loading,
    stats,
    eventos,
    jogos,
    users,
    vencedores,
    aldeias,
    transacoes,
    logs,
    vendedoresStats,
    pedidosPendentesCount,
    entregasPendentesCount,
    paymentMethodsDefault,
    selectedEventoIdParaJogo,
    filtroEventoId,
    activeTab,
    eventoModalOpen,
    setActiveTab,
    setPaymentMethodsDefault,
    setSelectedEventoIdParaJogo,
    setFiltroEventoId,
    setEventoModalOpen,
    fetchData,
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
  const [convertValor, setConvertValor] = useState("25");
  const [qrCodeData, setQrCodeData] = useState<{ jogoId?: string; eventoId?: string; aldeiaSlug?: string; type: "jogo" | "evento" | "aldeia" } | null>(null);
  const [testJogo, setTestJogo] = useState<Jogo | null>(null);
  const [testJogoTotalParticipacoes, setTestJogoTotalParticipacoes] = useState(0);
  const [deleteData, setDeleteData] = useState<{ type: string; id: string } | null>(null);
  const [toggleJogoData, setToggleJogoData] = useState<{ jogo: Jogo; novoEstado: 'aberto' | 'fechado' } | null>(null);

  // ==================== HANDLERS (extracted to hook) ====================
  const {
    handleProcessRecurringEvents,
    handleSaveEvento,
    handleSaveJogo,
    handleToggleJogoEstado,
    handleTestarJogo,
    executeToggleJogoEstado,
    handleSaveAldeia,
    handleSaveUser,
    handleConvertPrize,
    requestDelete,
    executeDelete,
    getEstadoBadge,
    handleVerJogos: hookHandleVerJogos,
    handleLimparFiltroJogos,
    handleSetSelectedJogo,
    handleSetSelectedAldeia,
    handleSetSelectedUser,
  } = useAdminCrudHandlers({
    fetchData,
    aldeiaId,
    userRole,
    eventoModalOpen,
    jogoModalOpen,
    aldeiaModalOpen,
    userModalOpen,
    convertPrizeOpen,
    deleteData,
    toggleJogoData,
    selectedEventoIdParaJogo,
    filtroEventoId,
    setTestJogoOpen,
    setTestJogo,
    setTestJogoTotalParticipacoes,
    setSelectedEventoIdParaJogo,
    setFiltroEventoId,
    setEventoModalOpen,
    setJogoModalOpen,
    setAldeiaModalOpen,
    setUserModalOpen,
    setConvertPrizeOpen,
    setDeleteData,
    setToggleJogoData,
    setSelectedEvento,
    setSelectedJogo,
    setSelectedAldeia,
    setSelectedUser,
  });

  const handleVerJogos = useCallback((eventoId: string) => {
    hookHandleVerJogos(eventoId);
    setActiveTab("jogos");
  }, [hookHandleVerJogos]);

  // ==================== RENDER ====================
  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        userRole={userRole}
        aldeia={aldeia}
        token={token}
        onOpenEventoModal={() => { setSelectedEvento(null); setEventoModalOpen(true); }}
        onOpenAldeiaModal={() => { setSelectedAldeia(null); setAldeiaModalOpen(true); }}
        onProcessRecurring={handleProcessRecurringEvents}
        onOpenResultadosExternos={() => setResultadosExternosOpen(true)}
      />

      <DashboardStatCards stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-5">
        <DashboardTabsNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={userRole}
          pedidosPendentesCount={pedidosPendentesCount}
          entregasPendentesCount={entregasPendentesCount}
        />

        <DashboardTabContent
          activeTab={activeTab}
          token={token}
          aldeiaId={aldeiaId}
          userRole={userRole}
          stats={stats}
          eventos={eventos}
          jogos={jogos}
          users={users}
          vencedores={vencedores}
          aldeias={aldeias}
          transacoes={transacoes}
          logs={logs}
          vendedoresStats={vendedoresStats}
          filtroEventoId={filtroEventoId}
          selectedEventoIdParaJogo={selectedEventoIdParaJogo}
          setEventoModalOpen={setEventoModalOpen}
          setJogoModalOpen={setJogoModalOpen}
          setSelectedEvento={setSelectedEvento}
          setSelectedJogo={handleSetSelectedJogo}
          setSelectedAldeia={handleSetSelectedAldeia}
          setSelectedUser={handleSetSelectedUser}
          setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
          setAldeiaModalOpen={setAldeiaModalOpen}
          setUserModalOpen={setUserModalOpen}
          setQrCodeData={setQrCodeData}
          setQrCodeOpen={setQrCodeOpen}
          setTestJogoOpen={setTestJogoOpen}
          setVerificarHashOpen={setVerificarHashOpen}
          setSelectedPremio={setSelectedPremio}
          setConvertPrizeOpen={setConvertPrizeOpen}
          setConfirmEntregaOpen={setConfirmEntregaOpen}
          handleToggleJogoEstado={handleToggleJogoEstado}
          handleTestarJogo={handleTestarJogo}
          handleVerJogos={handleVerJogos}
          handleLimparFiltroJogos={handleLimparFiltroJogos}
          requestDelete={requestDelete}
          getEstadoBadge={getEstadoBadge}
        />
      </Tabs>

      <DashboardModalsLayer
        token={token}
        userRole={userRole}
        aldeiaId={aldeiaId}
        aldeia={aldeia}
        aldeias={aldeias}
        paymentMethodsDefault={paymentMethodsDefault}
        selectedEvento={selectedEvento}
        selectedJogo={selectedJogo}
        selectedAldeia={selectedAldeia}
        selectedUser={selectedUser}
        selectedPremio={selectedPremio}
        selectedEventoIdParaJogo={selectedEventoIdParaJogo}
        deleteData={deleteData}
        toggleJogoData={toggleJogoData}
        qrCodeData={qrCodeData}
        testJogo={testJogo}
        testJogoTotalParticipacoes={testJogoTotalParticipacoes}
        convertValor={convertValor}
        eventoModalOpen={eventoModalOpen}
        jogoModalOpen={jogoModalOpen}
        aldeiaModalOpen={aldeiaModalOpen}
        userModalOpen={userModalOpen}
        resultadosExternosOpen={resultadosExternosOpen}
        verificarHashOpen={verificarHashOpen}
        qrCodeOpen={qrCodeOpen}
        testJogoOpen={testJogoOpen}
        convertPrizeOpen={convertPrizeOpen}
        confirmEntregaOpen={confirmEntregaOpen}
        setEventoModalOpen={setEventoModalOpen}
        setJogoModalOpen={setJogoModalOpen}
        setAldeiaModalOpen={setAldeiaModalOpen}
        setUserModalOpen={setUserModalOpen}
        setResultadosExternosOpen={setResultadosExternosOpen}
        setVerificarHashOpen={setVerificarHashOpen}
        setQrCodeOpen={setQrCodeOpen}
        setTestJogoOpen={setTestJogoOpen}
        setConvertPrizeOpen={setConvertPrizeOpen}
        setConfirmEntregaOpen={setConfirmEntregaOpen}
        setDeleteData={setDeleteData}
        setToggleJogoData={setToggleJogoData}
        setSelectedPremio={setSelectedPremio}
        setConvertValor={setConvertValor}
        handleSaveEvento={handleSaveEvento}
        handleSaveJogo={handleSaveJogo}
        handleSaveAldeia={handleSaveAldeia}
        handleSaveUser={handleSaveUser}
        handleConvertPrize={handleConvertPrize}
        executeDelete={executeDelete}
        executeToggleJogoEstado={executeToggleJogoEstado}
        fetchData={fetchData}
        setQrCodeData={setQrCodeData}
      />
    </div>
  );
}
