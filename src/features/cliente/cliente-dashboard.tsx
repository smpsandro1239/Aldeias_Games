"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Play, Ticket, Receipt, Trophy, MapPin, Gamepad2 } from "lucide-react";
import { GameList } from "@/components/games/game-list";
import { WalletCard } from "@/components/wallet/wallet-card";
import { AldeiaWizardModal } from "@/components/modals/aldeia-wizard-modal";
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list";
import { ParticipacaoConfirmacaoModal } from "@/components/modals/participacao-confirmacao-modal";
import { ProvaJogoModal } from "@/components/modals/prova-jogo-modal";
import { NumberSelectorModal, PoioDaVacaModal, PaymentModal, ConfirmModal, VictoryCelebration } from "@/components/modals";
import { useClienteDashboard } from "./use-cliente-dashboard";
import { ClienteStatCards } from "./cliente-stat-cards";
import { ClienteParticipacaoCard } from "./cliente-participacao-card";
import { ClienteExtratoList } from "./cliente-extrato-list";
import { ClientePagination } from "./cliente-pagination";

export function ClienteDashboard({ token: _token }: { token?: string }) {
  const game = useClienteDashboard();

  const {
    router, fetchData, getTipoIcon,
    participacoes, jogos, loading, activeTab, setActiveTab,
    saldo, walletStats, userProfile,
    numberSelectorOpen, setNumberSelectorOpen,
    poioDaVacaOpen, setPoioDaVacaOpen,
    paymentOpen, setPaymentOpen,
    selectedJogo, setSelectedJogo,
    selectedParticipacao, setSelectedParticipacao,
    numerosSelecionados, setNumerosSelecionados,
    selecaoPoioDaVaca, setSelecaoPoioDaVaca,
    numerosOcupadosPoio, setNumerosOcupadosPoio,
    numerosOcupadosRifa, setNumerosOcupadosRifa,
    confirmOpen, setConfirmOpen, confirmAldeia, setConfirmAldeia,
    wizardOpen, setWizardOpen,
    victoryOpen, setVictoryOpen, victoryPremio, setVictoryPremio,
    detalhesParticipacaoOpen, setDetalhesParticipacaoOpen,
    participacaoDetalhes, setParticipacaoDetalhes,
    provaModalOpen, setProvaModalOpen,
    provaParticipacaoId, setProvaParticipacaoId,
    searchQuery, setSearchQuery,
    jogosPage, setJogosPage, participacoesPage, setParticipacoesPage,
    extratoPage, setExtratoPage, rankingPage, setRankingPage,
    itemsPerPage,
    handleJogar, proceedToJogo,
    handleRevelarRaspadinha, handleVerVitoria,
    handleConfirmarPagamento, handleRevelar,
    filteredJogos, filteredParticipacoes,
    paginatedJogos, paginatedParticipacoes,
    extratoItems, paginatedExtrato,
    stats,
  } = game;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-30" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative">
            <Gamepad2 className="h-16 w-16 text-secondary animate-pulse" />
            <div className="absolute inset-0 h-16 w-16 bg-secondary/20 blur-xl rounded-full animate-pulse" />
          </div>
          <div className="text-gradient font-gaming text-2xl tracking-wider">A carregar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="fixed inset-0 animated-gradient opacity-20 -z-10" />
      <div className="fixed inset-0 particle-bg opacity-10 -z-10" />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 items-start">
        <div className="md:col-span-2 lg:col-span-3">
          <h1 className="text-2xl md:text-4xl font-gaming font-bold">
            <span className="text-gradient">Os Meus Jogos</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Participa nos jogos e tenta a tua sorte</p>
        </div>
        <div className="md:col-span-1">
          <WalletCard />
        </div>
      </div>

      <ClienteStatCards stats={stats} />

      <div className="relative max-w-md">
        <Input
          type="search"
          placeholder="Procurar em todas as abas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-surface-container-low border border-outline-variant/30 p-1 grid grid-cols-4 rounded-2xl w-full">
          {[
            { value: "jogos", icon: Play, label: "Jogar" },
            { value: "participacoes", icon: Ticket, label: "Bilhetes" },
            { value: "extrato", icon: Receipt, label: "Extrato" },
            { value: "ranking", icon: Trophy, label: "Rankings" },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger key={value} value={value}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold rounded-xl transition-all duration-200 text-muted-foreground text-xs sm:text-sm"
            >
              <Icon className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="jogos" className="space-y-4">
          {userProfile?.role !== 'super_admin' && !userProfile?.aldeiaId ? (
            <Card className="p-12 text-center bg-card/50 border-white/10 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <MapPin className="h-16 w-16 text-muted-foreground" />
                  <div className="absolute inset-0 bg-secondary/10 blur-xl rounded-full" />
                </div>
                <div>
                  <p className="text-xl font-gaming font-bold text-foreground">Escolhe a tua Aldeia</p>
                  <p className="text-sm text-muted-foreground mt-2">Precisas de selecionar uma aldeia para ver os jogos disponíveis.</p>
                  <Button onClick={() => setWizardOpen(true)} className="mt-6 bg-secondary hover:bg-secondary/90">
                    Escolher Aldeia
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <GameList
                jogos={paginatedJogos as any}
                onJogoClick={(jogo) => handleJogar(jogo as any)}
                loading={loading}
                title={userProfile?.role === 'super_admin' ? "Todos os Jogos" : `Jogos de ${userProfile?.aldeia?.nome || "A carregar..."}`}
                emptyMessage={userProfile?.role === 'super_admin' ? "Nenhum jogo disponível" : "Nenhum jogo disponível na tua aldeia"}
                emptySubtext={userProfile?.role === 'super_admin' ? "Volte mais tarde!" : "Não há jogos ativos na tua aldeia de momento."}
                showAldeia={userProfile?.role === 'super_admin'}
              />
              {filteredJogos.length > itemsPerPage && (
                <ClientePagination page={jogosPage} setPage={setJogosPage} totalItems={filteredJogos.length} itemsPerPage={itemsPerPage} label="jogos" />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="participacoes" className="space-y-4">
          {participacoes.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <Ticket className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Nenhuma participação</p>
                  <p className="text-sm text-muted-foreground">Ainda não participou em nenhum jogo. Escolha um jogo para participar!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedParticipacoes.map((p) => (
                  <ClienteParticipacaoCard
                    key={p.id}
                    participacao={p}
                    getTipoIcon={getTipoIcon}
                    onVerVitoria={handleVerVitoria}
                    onRevelarRaspadinha={handleRevelarRaspadinha}
                    onVerProva={(id) => { setProvaParticipacaoId(id); setProvaModalOpen(true); }}
                    onVerDetalhes={(pp) => { setParticipacaoDetalhes(pp); setDetalhesParticipacaoOpen(true); }}
                  />
                ))}
              </div>
              {filteredParticipacoes.length > itemsPerPage && (
                <ClientePagination page={participacoesPage} setPage={setParticipacoesPage} totalItems={filteredParticipacoes.length} itemsPerPage={itemsPerPage} label="bilhetes" />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="extrato" className="space-y-4">
          <ClienteExtratoList
            extratoItems={extratoItems}
            paginatedExtrato={paginatedExtrato}
            extratoPage={extratoPage}
            setExtratoPage={setExtratoPage}
          />
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <LeaderboardList
            aldeiaId={userProfile?.aldeiaId}
            tipo="all"
            page={rankingPage}
            limit={itemsPerPage}
            onPageChange={setRankingPage}
          />
        </TabsContent>
      </Tabs>

      {selectedJogo && selectedJogo.tipo === "raspadinha" && (
        <PaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          valor={selectedJogo.preco}
          descricao={selectedJogo.nome}
          saldoDisponivel={saldo}
          userRole="user"
          telefoneInicial={userProfile?.telefone || undefined}
          onMBWayPayment={async (telefone) => { await handleConfirmarPagamento("mbway"); }}
          onSaldoPayment={async () => { await handleConfirmarPagamento("saldo"); }}
        />
      )}

      {selectedJogo && (selectedJogo.tipo === "rifa" || selectedJogo.tipo === "euromilhoes") && (
        <NumberSelectorModal
          open={numberSelectorOpen}
          onOpenChange={setNumberSelectorOpen}
          numeroInicial={selectedJogo.configuracao.numeroInicial as number}
          numeroFinal={selectedJogo.configuracao.numeroFinal as number}
          numerosOcupados={numerosOcupadosRifa}
          numerosSelecionados={numerosSelecionados}
          onSelect={setNumerosSelecionados}
          onConfirm={() => { setNumberSelectorOpen(false); setPaymentOpen(true); }}
          preco={selectedJogo.preco}
        />
      )}

      {selectedJogo && selectedJogo.tipo === "poio_da_vaca" && (
        <PoioDaVacaModal
          open={poioDaVacaOpen}
          onOpenChange={setPoioDaVacaOpen}
          letras={(selectedJogo.configuracao.letras as string[]) || ["A", "B", "C", "D", "E"]}
          numerosPorLetra={(selectedJogo.configuracao.numerosPorLetra as number) || 20}
          numerosOcupados={numerosOcupadosPoio}
          numerosJogados={participacoes
            .filter(p => p.jogo?.id === selectedJogo.id)
            .map(p => { const d = p.dadosParticipacao as any; return d?.coordenadas || []; }).flat()
            .map((c: any) => ({ letra: c.letra, numero: c.numero }))}
          precoIndividual={selectedJogo.preco}
          precoCartao={((selectedJogo.configuracao.precos as any)?.cartao) || selectedJogo.preco * 4}
          onSelect={setSelecaoPoioDaVaca}
          onConfirm={() => { setPoioDaVacaOpen(false); setPaymentOpen(true); }}
        />
      )}

      {selectedParticipacao && selectedParticipacao.jogo?.tipo === "raspadinha" && !selectedParticipacao.revelado && (
        <ConfirmModal
          open={true}
          onOpenChange={(open) => { if (!open) setSelectedParticipacao(null); }}
          title="RASPADINHA PREMIUM"
          description={<div className="text-center py-4"><p className="mb-4">Tem uma raspadinha para revelar!</p><p className="text-sm text-muted-foreground">Clique em "Revelar" para ir para o jogo.</p></div>}
          confirmText="Revelar Raspadinha"
          onConfirm={() => { if (selectedParticipacao?.jogo?.tipo === "raspadinha") { setSelectedParticipacao(null); router.push(`/jogos/raspadinha-premium?participacaoId=${selectedParticipacao.id}`); } }}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={(open) => { setConfirmOpen(open); if (!open) setConfirmAldeia(null); }}
        title="Aviso - Aldeia Diferente"
        description={<div><p className="mb-2">Está a jogar na aldeia <strong>"{confirmAldeia?.nome}"</strong>, que não é a sua aldeia de registo <strong>"{userProfile?.aldeia?.nome}"</strong>.</p><p>Deseja continuar?</p></div>}
        confirmText="Continuar"
        cancelText="Cancelar"
        onConfirm={() => { if (confirmAldeia?.jogo) proceedToJogo(confirmAldeia.jogo); }}
      />

      <AldeiaWizardModal
        open={wizardOpen}
        onComplete={(id, nome) => { setWizardOpen(false); fetchData(); }}
      />

      {victoryPremio && (
        <VictoryCelebration
          open={victoryOpen}
          onOpenChange={setVictoryOpen}
          premio={victoryPremio.premio}
          jogoNome={victoryPremio.jogoNome}
          tipoJogo={victoryPremio.tipoJogo}
        />
      )}

      <ParticipacaoConfirmacaoModal
        open={detalhesParticipacaoOpen}
        onOpenChange={setDetalhesParticipacaoOpen}
        participacao={participacaoDetalhes}
      />

      <ProvaJogoModal
        open={provaModalOpen}
        onOpenChange={setProvaModalOpen}
        participacaoId={provaParticipacaoId || undefined}
      />
    </div>
  );
}
