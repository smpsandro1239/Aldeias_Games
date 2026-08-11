"use client";

import { lazy, Suspense } from "react";
import { TabsContent } from "@/components/ui/tabs";

import {
  OverviewTab,
  EventosTab,
  JogosTab,
  VencedoresTab,
  UsersTab,
  ComissoesTab,
  VerificarTab,
  MinhaAldeiaTab,
} from ".";

import type {
  Stats,
  Evento,
  Jogo,
  User,
  Aldeia,
  Transacao,
  Log,
  Vencedor,
  VendedorStats,
} from "./types";

const DashboardAnalytics = lazy(() =>
  import("../analytics-dashboard").then((mod) => ({ default: mod.DashboardAnalytics }))
);
const AldeiasTab = lazy(() =>
  import(".").then((mod) => ({ default: mod.AldeiasTab }))
);
const TransacoesTab = lazy(() =>
  import(".").then((mod) => ({ default: mod.TransacoesTab }))
);
const AuditoriaTab = lazy(() =>
  import(".").then((mod) => ({ default: mod.AuditoriaTab }))
);

interface DashboardTabContentProps {
  activeTab: string;
  aldeiaId?: string;
  userRole: string;
  stats: Stats | null;
  eventos: Evento[];
  jogos: Jogo[];
  users: User[];
  vencedores: Vencedor[];
  aldeias: Aldeia[];
  transacoes: Transacao[];
  logs: Log[];
  vendedoresStats: VendedorStats[];
  filtroEventoId: string | null;
  selectedEventoIdParaJogo: string;
  setEventoModalOpen: (open: boolean) => void;
  setJogoModalOpen: (open: boolean) => void;
  setSelectedEvento: (evento: Evento | null) => void;
  setSelectedJogo: (jogo: Jogo | null) => void;
  setSelectedAldeia: (aldeia: Aldeia | null) => void;
  setSelectedUser: (user: User | null) => void;
  setSelectedEventoIdParaJogo: (id: string) => void;
  setAldeiaModalOpen: (open: boolean) => void;
  setUserModalOpen: (open: boolean) => void;
  setQrCodeData: (data: { jogoId?: string; eventoId?: string; aldeiaSlug?: string; type: "jogo" | "evento" | "aldeia" } | null) => void;
  setQrCodeOpen: (open: boolean) => void;
  setTestJogoOpen: (open: boolean) => void;
  setVerificarHashOpen: (open: boolean) => void;
  setSelectedPremio: (premio: Vencedor | null) => void;
  setConvertPrizeOpen: (open: boolean) => void;
  setConfirmEntregaOpen: (open: boolean) => void;
  handleToggleJogoEstado: (jogo: Jogo) => void;
  handleTestarJogo: (jogo: Jogo) => void;
  handleVerJogos: (eventoId: string) => void;
  handleLimparFiltroJogos: () => void;
  requestDelete: (type: string, id: string) => void;
  onRequestEliminacao?: (tipo: "jogo" | "evento" | "aldeia", recursoId: string, recursoNome: string) => void;
  onOpenEliminacoesList?: () => void;
  onOpenJogoDetalhes?: (jogo: Jogo) => void;
  getEstadoBadge: (estado: string) => React.ReactNode;
  focusAldeiaId?: string | null;
  onFocusConsumed?: () => void;
}

export function DashboardTabContent({
  activeTab,
  aldeiaId,
  userRole,
  stats,
  eventos,
  jogos,
  users,
  vencedores,
  aldeias,
  transacoes,
  logs,
  vendedoresStats,
  filtroEventoId,
  selectedEventoIdParaJogo,
  setEventoModalOpen,
  setJogoModalOpen,
  setSelectedEvento,
  setSelectedJogo,
  setSelectedAldeia,
  setSelectedUser,
  setSelectedEventoIdParaJogo,
  setAldeiaModalOpen,
  setUserModalOpen,
  setQrCodeData,
  setQrCodeOpen,
  setTestJogoOpen,
  setVerificarHashOpen,
  setSelectedPremio,
  setConvertPrizeOpen,
  setConfirmEntregaOpen,
  handleToggleJogoEstado,
  handleTestarJogo,
  handleVerJogos,
  handleLimparFiltroJogos,
  requestDelete,
  onRequestEliminacao,
  onOpenEliminacoesList,
  onOpenJogoDetalhes,
  getEstadoBadge,
  focusAldeiaId,
  onFocusConsumed,
}: DashboardTabContentProps) {
  return (
    <>
      <TabsContent value="overview">
        <OverviewTab
          stats={stats}
          eventos={eventos}
          setSelectedEvento={setSelectedEvento}
          setEventoModalOpen={setEventoModalOpen}
          setJogoModalOpen={setJogoModalOpen}
          setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
          getEstadoBadge={getEstadoBadge}
          userRole={userRole}
        />
      </TabsContent>

      <TabsContent value="analytics">
        <Suspense fallback={<div className="flex items-center justify-center p-8 text-muted-foreground">A carregar analytics...</div>}>
          <DashboardAnalytics aldeiaId={aldeiaId} />
        </Suspense>
      </TabsContent>

      <TabsContent value="eventos">
        {userRole === "aldeia_admin" ? (
          <MinhaAldeiaTab
            aldeias={aldeias}
            eventos={eventos}
            jogos={jogos}
            setSelectedAldeia={setSelectedAldeia}
            setAldeiaModalOpen={setAldeiaModalOpen}
            setSelectedEvento={setSelectedEvento}
            setEventoModalOpen={setEventoModalOpen}
            setSelectedJogo={setSelectedJogo}
            setJogoModalOpen={setJogoModalOpen}
            setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
            onToggleJogoEstado={handleToggleJogoEstado}
            requestDelete={requestDelete}
            onRequestEliminacao={onRequestEliminacao}
          />
        ) : (
          <EventosTab
            eventos={eventos}
            setSelectedEvento={setSelectedEvento}
            setEventoModalOpen={setEventoModalOpen}
            setJogoModalOpen={setJogoModalOpen}
            requestDelete={requestDelete}
            onRequestEliminacao={onRequestEliminacao}
            getEstadoBadge={getEstadoBadge}
            onVerJogos={handleVerJogos}
          />
        )}
      </TabsContent>

      <TabsContent value="jogos">
        <JogosTab
          jogos={jogos}
          eventos={eventos}
          userRole={userRole}
          selectedEventoIdParaJogo={selectedEventoIdParaJogo}
          setSelectedJogo={setSelectedJogo}
          setJogoModalOpen={setJogoModalOpen}
          setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
          setQrCodeData={setQrCodeData}
          setQrCodeOpen={setQrCodeOpen}
          handleTestarJogo={handleTestarJogo}
          setTestJogoOpen={setTestJogoOpen}
          requestDelete={requestDelete}
          onRequestEliminacao={onRequestEliminacao}
          onOpenEliminacoesList={onOpenEliminacoesList}
          onOpenJogoDetalhes={onOpenJogoDetalhes}
          getEstadoBadge={getEstadoBadge}
          onToggleEstado={handleToggleJogoEstado}
          filtroEventoId={filtroEventoId}
          onLimparFiltro={handleLimparFiltroJogos}
        />
      </TabsContent>

      <TabsContent value="vencedores">
        <VencedoresTab
          vencedores={vencedores}
          setSelectedPremio={setSelectedPremio}
          setConvertPrizeOpen={setConvertPrizeOpen}
          setConfirmEntregaOpen={setConfirmEntregaOpen}
        />
      </TabsContent>

      <TabsContent value="verificar">
        <VerificarTab setVerificarHashOpen={setVerificarHashOpen} />
      </TabsContent>

      <TabsContent value="users">
        <UsersTab
          users={users}
          setSelectedUser={setSelectedUser}
          setUserModalOpen={setUserModalOpen}
          requestDelete={requestDelete}
        />
      </TabsContent>

      {userRole === "aldeia_admin" && (
        <TabsContent value="comissoes">
          <ComissoesTab
            vendedoresStats={vendedoresStats}
            setSelectedUser={setSelectedUser}
            setUserModalOpen={setUserModalOpen}
          />
        </TabsContent>
      )}

      {userRole === "super_admin" && (
        <TabsContent value="aldeias">
          <Suspense fallback={<div>A carregar...</div>}>
            <AldeiasTab
              aldeias={aldeias}
              eventos={eventos}
              jogos={jogos}
              setSelectedAldeia={setSelectedAldeia}
              setAldeiaModalOpen={setAldeiaModalOpen}
              setSelectedEvento={setSelectedEvento}
              setEventoModalOpen={setEventoModalOpen}
              setSelectedJogo={setSelectedJogo}
              setJogoModalOpen={setJogoModalOpen}
              setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
              onToggleJogoEstado={handleToggleJogoEstado}
              requestDelete={requestDelete}
              onRequestEliminacao={onRequestEliminacao}
              focusAldeiaId={focusAldeiaId}
              onFocusConsumed={onFocusConsumed}
            />
          </Suspense>
        </TabsContent>
      )}

      {userRole === "super_admin" && (
        <TabsContent value="transacoes">
          <Suspense fallback={<div>A carregar...</div>}>
            <TransacoesTab transacoes={transacoes} />
          </Suspense>
        </TabsContent>
      )}

      {userRole === "super_admin" && (
        <TabsContent value="auditoria">
          <Suspense fallback={<div>A carregar...</div>}>
            <AuditoriaTab logs={logs} />
          </Suspense>
        </TabsContent>
      )}
    </>
  );
}
