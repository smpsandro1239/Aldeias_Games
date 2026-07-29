"use client";

import { Trophy, Star, Hash, Euro, Info, Phone, Mail, User, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticipacaoConfirmacaoModal } from "@/components/modals/participacao-confirmacao-modal";
import { PlayerDataConfirmModal } from "@/components/modals/player-data-confirm-modal";
import { useGamePage } from "@/hooks/useGamePage";
import { GameDetailLayout } from "@/components/game-detail-layout";
import { GamePaymentDialog } from "@/components/game-payment-dialog";
import { useEuromilhoesGame } from "./use-euromilhoes-game";
import { EuromilhoesNumberGrid } from "./euromilhoes-number-grid";
import { EuromilhoesConfirmationView } from "./euromilhoes-confirmation-view";
import type { JogoEuromilhoes } from "./euromilhoes-types";
import { TOTAL_NUMEROS } from "./euromilhoes-types";

export default function EuromilhoesPage() {
  const gamePage = useGamePage<JogoEuromilhoes>();
  const {
    jogo, loading, userRole,
    participante, setParticipante,
    paymentModalOpen, setPaymentModalOpen,
    confirmacaoModalOpen, setConfirmacaoModalOpen,
    participacaoCriada,
    participacaoConfirmada,
    playerDataConfirmOpen, setPlayerDataConfirmOpen,
    handlePlayerConfirmOwnData,
    handlePlayerConfirmNewData,
  } = gamePage;

  const {
    grelha, numerosSelecionados, setNumerosSelecionados,
    numerosOcupados, submetendo,
    provaModalOpen, setProvaModalOpen,
    toggleNumero, selectRandomNumbers,
    handleParticipar, processarPagamento,
    handlePlayAgain, totalPago,
  } = useEuromilhoesGame(gamePage);

  if (loading) {
    return <GameDetailLayout title="Euromilhões" loading><></></GameDetailLayout>;
  }

  if (participacaoConfirmada) {
    return (
      <EuromilhoesConfirmationView
        numerosSelecionados={numerosSelecionados}
        jogo={jogo}
        grelha={grelha}
        totalPago={totalPago}
        setProvaModalOpen={setProvaModalOpen}
        handlePlayAgain={handlePlayAgain}
          participacaoCriada={participacaoCriada}
        userRole={userRole as string | undefined}
        provaModalOpen={provaModalOpen}
      />
    );
  }

  return (
    <GameDetailLayout title="Euromilhões" userRole={userRole}
      headerRight={grelha ? (
        <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
          <Hash className="w-3 h-3 text-primary" />
          <span className="text-xs font-bold text-primary">Grelha {grelha.numero}</span>
        </div>
      ) : undefined}>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container to-[#2d1a0f] p-1">
        <div className="bg-surface-container-highest/90 backdrop-blur-md rounded-[1.9rem] p-6 md:p-8">
          <div className="mb-4 inline-block bg-secondary-container/10 border border-secondary-container/20 px-3 py-1 rounded-full">
            <span className="text-secondary text-xs font-bold tracking-widest uppercase">{jogo?.evento?.aldeia?.nome || "EUROMILHÕES"}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">{jogo?.nome || "Euromilhões"}</h2>
          </div>
          <p className="text-primary text-lg font-medium">Escolhe 1 a 50 números de 1 a 50</p>
        </div>
      </div>

      <div className="bg-surface-container rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-1">Preço por Número</p>
            <div className="flex items-center gap-2">
              <Euro className="w-5 h-5 text-primary" />
              <span className="text-2xl font-headline font-bold text-on-surface">{jogo?.preco?.toFixed(2) || "2.00"}€</span>
            </div>
          </div>
          {grelha?.premioDescricao && (
            <div className="bg-primary-container text-on-primary-container px-4 py-2 rounded-2xl flex items-center gap-2">
              <Star className="w-4 h-4" /><span className="text-sm font-bold">{grelha.premioDescricao}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-high rounded-xl p-3 text-center">
            <p className="text-[10px] text-on-surface/50 uppercase">Total</p>
            <p className="text-lg font-bold">{TOTAL_NUMEROS}</p>
          </div>
          <div className="bg-surface-container-high rounded-xl p-3 text-center">
            <p className="text-[10px] text-on-surface/50 uppercase">Disponíveis</p>
            <p className="text-lg font-bold text-green-400">{TOTAL_NUMEROS - numerosOcupados.length}</p>
          </div>
          <div className="bg-surface-container-high rounded-xl p-3 text-center">
            <p className="text-[10px] text-on-surface/50 uppercase">Vendidos</p>
            <p className="text-lg font-bold text-primary">{numerosOcupados.length}</p>
          </div>
        </div>
      </div>

      {grelha?.sorteioData && (
        <div className="bg-surface-container rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Próximo Sorteio</p>
            <p>{new Date(grelha.sorteioData).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            {grelha.bloqueioData && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Participações encerram em {new Date(grelha.bloqueioData).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
      )}

      <EuromilhoesNumberGrid
        numerosSelecionados={numerosSelecionados}
        setNumerosSelecionados={setNumerosSelecionados}
        numerosOcupados={numerosOcupados}
        toggleNumero={toggleNumero}
        selectRandomNumbers={selectRandomNumbers}
      />

      <div className="bg-surface-container rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
          <User className="w-5 h-5 text-secondary" />
          <h4 className="text-xl font-headline font-bold">Dados do Cliente</h4>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo *</label>
          <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
            <User className="w-5 h-5 text-primary" />
            <input type="text" value={participante.nome} onChange={(e) => setParticipante((p: any) => ({ ...p, nome: e.target.value }))}
              className="flex-1 bg-transparent outline-none text-foreground" placeholder="O seu nome" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Telemóvel *</label>
            <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
              <Phone className="w-5 h-5 text-primary" />
              <input type="tel" value={participante.telefone} onChange={(e) => setParticipante((p: any) => ({ ...p, telefone: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-foreground" placeholder="+351 000 000 000" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Email (opcional)</label>
            <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
              <Mail className="w-5 h-5 text-primary" />
              <input type="email" value={participante.email} onChange={(e) => setParticipante((p: any) => ({ ...p, email: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-foreground" placeholder="email@exemplo.com" />
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleParticipar} disabled={numerosSelecionados.length < 1 || !participante.nome.trim() || submetendo}
        className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-full text-lg hover:shadow-[0_0_20px_rgba(255,115,75,0.4)]">
        <Ticket className="w-5 h-5 mr-2" /> Participar — {totalPago.toFixed(2)}€
      </Button>

      <p className="text-center text-on-surface/40 text-xs">Ao participar, concorda com os termos do jogo. Escolha 1 a 50 números de 1 a 50.</p>

      <div className="bg-surface-container-high rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Como funciona o Euromilhões</p>
          <p>Selecione entre 1 a 50 números. O sorteio será realizado na data indicada pelo organizador. Todos os lucros revertem para a associação cultural.</p>
        </div>
      </div>

      <GamePaymentDialog
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        amount={jogo?.preco || 0}
        gameName="Euromilhões"
        onSelect={processarPagamento}
        description={`${numerosSelecionados.length} número${numerosSelecionados.length > 1 ? "s" : ""} selecionado${numerosSelecionados.length > 1 ? "s" : ""} — Total: ${totalPago.toFixed(2)}€`}
      />

      <ParticipacaoConfirmacaoModal open={confirmacaoModalOpen} onOpenChange={setConfirmacaoModalOpen} participacao={participacaoCriada} />

      <PlayerDataConfirmModal
        open={playerDataConfirmOpen}
        onOpenChange={setPlayerDataConfirmOpen}
        userName={gamePage.userOriginalData.nome}
        userPhone={gamePage.userOriginalData.telefone}
        userEmail={gamePage.userOriginalData.email}
        onConfirmWithOwnData={handlePlayerConfirmOwnData}
        onConfirmWithNewData={handlePlayerConfirmNewData}
      />
    </GameDetailLayout>
  );
}
