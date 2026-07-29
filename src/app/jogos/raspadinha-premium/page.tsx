"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useRef, useCallback, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Sparkles, Trophy, Lock, Loader2, Ticket, HelpCircle, Info, Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ParticipacaoConfirmacaoModal } from "@/components/modals/participacao-confirmacao-modal";
import { PlayerDataConfirmModal } from "@/components/modals/player-data-confirm-modal";
import { ProvaJogoModal } from "@/components/modals/prova-jogo-modal";
import { useGamePage } from "@/hooks/useGamePage";
import { GamePaymentDialog } from "@/components/game-payment-dialog";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenuButton } from "@/components/user-menu-button";
import { useRaspadinhaGame } from "./use-raspadinha-game";
import { RaspadinhaWinOverlay } from "./raspadinha-win-overlay";
import type { Jogo } from "./raspadinha-types";

function RaspadinhaLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">A carregar jogo...</p>
      </div>
    </div>
  );
}

function RaspadinhaPremiumContent() {
  const router = useRouter();
  const {
    jogo, loading, jogoId,
    userRole, isNonRegularUser,
    participante, setParticipante,
    userOriginalData,
    paymentModalOpen, setPaymentModalOpen,
    confirmacaoModalOpen, setConfirmacaoModalOpen,
    participacaoCriada, setParticipacaoCriada,
    playerDataConfirmOpen, setPlayerDataConfirmOpen,
    playerDataModified, setPlayerDataModified,
    refreshBalance,
    fetchJogo,
    handlePlayerConfirmOwnData,
    handlePlayerConfirmNewData,
    processarPagamento,
  } = useGamePage<Jogo>();

  const game = useRaspadinhaGame(
    jogo, jogoId, participante,
    setParticipante, userOriginalData,
    isNonRegularUser, refreshBalance,
    setPaymentModalOpen, setParticipacaoCriada,
  );

  const {
    slots, showWin, winningPrize, winningSlotIds, totalRevealed,
    participacaoId, gamePhase, premioClaimed, creditedAmount, claiming,
    showPurchaseAnimation, howItWorksOpen, setHowItWorksOpen,
    provaModalOpen, setProvaModalOpen,
    slotSummary, premiosDisplay,
    titulo, subtitulo, organizacao, premioMaximo, preco,
    initSlotCanvas, handlePointerDown, handlePointerMove, handlePointerUp,
    scratchAll, claimPremio, criarParticipacao, handleComprarNova,
    setShowWin, initSlotsFromGrid,
  } = game;

  useEffect(() => {
    if (jogoId) {
      sessionStorage.removeItem(`raspadinha_${jogoId}`);
      fetchJogo();
    }
  }, [jogoId, fetchJogo]);

  const processarPagamentoLocal = async (metodo: "dinheiro" | "saldo" | "mbway" | "stripe" | "transferencia") => {
    await processarPagamento(metodo, criarParticipacao);
  };

  const handleJogar = () => {
    if (isNonRegularUser && !playerDataModified) {
      setPlayerDataConfirmOpen(true);
    } else {
      setPaymentModalOpen(true);
    }
  };

  if (loading) {
    return <RaspadinhaLoading />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-32">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <span className="font-serif italic text-primary text-lg font-bold">
              {organizacao}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-lg text-accent">
              {titulo}
            </h1>
          </div>
          <UserMenuButton />
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            {subtitulo}
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight">
            Ganha até{" "}
            <span className="text-primary">{premioMaximo.toLocaleString("pt-PT")}€</span>
          </h2>
        </motion.section>

        <button
          onClick={() => setHowItWorksOpen(true)}
          className="mx-auto flex items-center gap-2 px-4 py-2 bg-surface-container/50 border border-primary/30 rounded-full text-sm text-primary hover:bg-surface-container hover:border-primary/50 transition-all"
        >
          <HelpCircle className="w-4 h-4" />
          Como Funciona
        </button>

        {gamePhase === "not_paid" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[24px] blur-xl" />
            <div className="relative bg-surface-container rounded-[24px] p-8 shadow-2xl flex flex-col items-center gap-4">
              <Lock className="w-12 h-12 text-primary/60" />
              <p className="text-center text-muted-foreground text-sm">
                Adquire a tua raspadinha e tenta a tua sorte
              </p>
              <p className="text-4xl font-bold text-secondary">
                {preco}€
              </p>
            </div>
          </motion.div>
        )}

        {gamePhase === "payment_loading" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[24px] blur-xl" />
            <div className="relative bg-surface-container rounded-[24px] p-8 shadow-2xl flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-center text-muted-foreground text-sm">
                A processar pagamento...
              </p>
            </div>
          </motion.div>
        )}

        {showPurchaseAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-[24px] blur-xl" />
            <div className="relative bg-surface-container rounded-[24px] p-8 shadow-2xl flex flex-col items-center gap-4">
              <Sparkles className="w-12 h-12 text-secondary animate-pulse" />
              <p className="text-center text-muted-foreground text-lg font-bold">
                Cartela comprada!
              </p>
              <p className="text-center text-muted-foreground/60 text-xs">
                Raspe para revelar o seu prémio
              </p>
            </div>
          </motion.div>
        )}

        {(gamePhase === "paid" || gamePhase === "all_revealed") && slots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[24px] blur-xl" />
            <div className="relative bg-surface-container rounded-[24px] p-4 shadow-2xl">
              <div className="grid grid-cols-3 gap-3">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`relative aspect-square rounded-2xl overflow-hidden bg-surface-container-highest transition-all duration-500 ${
                      slot.revealed && winningSlotIds.includes(slot.id)
                        ? "ring-2 ring-primary shadow-[0_0_12px_rgba(255,215,0,0.6)]"
                        : ""
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Trophy className="text-4xl text-primary" />
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                          {slot.prize?.valorDinheiroAlternative
                            ? `${slot.prize.valorDinheiroAlternative}€`
                            : slot.prize?.nome || "?"}
                        </p>
                      </div>
                    </div>

                    {!slot.revealed && (
                      <canvas
                        ref={(el) => {
                          if (el) {
                            setTimeout(() => initSlotCanvas(el, slot.id), 50);
                          }
                        }}
                        className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                        style={{ touchAction: "none" }}
                        onPointerDown={(e) => handlePointerDown(slot.id, e)}
                        onPointerMove={(e) => handlePointerMove(slot.id, e)}
                        onPointerUp={(e) => handlePointerUp(slot.id, e)}
                        onPointerLeave={(e) => handlePointerUp(slot.id, e)}
                      />
                    )}

                    {slot.scratchPercent > 10 && !slot.revealed && (
                      <div className="absolute top-1 right-1 bg-black/60 text-[8px] text-foreground px-1.5 py-0.5 rounded-full font-mono">
                        {slot.scratchPercent}%
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalRevealed < 9 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 flex justify-center"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full">
                    <Sparkles className="text-secondary text-sm animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground">
                      Raspe para revelar
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {gamePhase === "all_revealed" && slotSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-container-low/60 backdrop-blur-xl rounded-3xl p-5 space-y-3 border border-outline-variant/10"
          >
            {slotSummary.hasWon ? (
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-serif text-lg font-bold text-accent">Ganhaste!</h3>
              </div>
            ) : slotSummary.closestPrize && slotSummary.remaining <= 2 ? (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-lg font-bold text-accent">
                  Por pouco! {slotSummary.remaining === 1 ? `Faltou só 1` : `Faltaram ${slotSummary.remaining}`} para ganhares {slotSummary.closestPrize.valor}€
                </h3>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg">🍀</span>
                <h3 className="font-serif text-lg font-bold text-accent">Resumo da Raspadinha</h3>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {slotSummary.items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl ${
                    item.count >= 3 && item.valor > 0
                      ? "bg-yellow-500/10 ring-1 ring-yellow-500/30"
                      : "bg-surface-container-highest/40"
                  }`}
                >
                  <span className={`text-sm font-medium ${item.valor > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                    {item.valor > 0 ? `${item.valor}€` : item.nome || "Nada"}
                  </span>
                  <span className={`text-sm font-bold ${item.count >= 3 && item.valor > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>
                    {item.count}x
                  </span>
                </div>
              ))}
            </div>

            {!slotSummary.hasWon && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                Tenta novamente, a próxima pode ser a boa!
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          {gamePhase === "not_paid" && (
            <button
              onClick={handleJogar}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-glow active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              <span className="text-lg">Participar por</span>
              <span className="px-2 py-0.5 bg-black/10 rounded-lg text-sm">
                {preco}€
              </span>
            </button>
          )}

          {gamePhase === "payment_loading" && (
            <button
              disabled
              className="w-full py-4 bg-primary/50 text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>A processar...</span>
            </button>
          )}

          {(gamePhase === "paid" || gamePhase === "all_revealed") && totalRevealed < 9 && (
            <button
              onClick={scratchAll}
              className="w-full py-4 bg-surface-container-low text-muted-foreground font-semibold rounded-2xl border border-outline-variant/20 active:scale-[0.98] transition-all duration-200"
            >
              Raspar Tudo
            </button>
          )}

          {gamePhase === "all_revealed" && winningPrize && !premioClaimed && (!isNonRegularUser || !playerDataModified) && (
            <button
              disabled={claiming}
              onClick={() => {
                if (participacaoId) claimPremio(participacaoId, "carteira");
              }}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-glow active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trophy className="w-5 h-5" />
              <span className="text-lg">Reclamar Prémio - {winningPrize.valorDinheiroAlternative}€</span>
            </button>
          )}

          {gamePhase === "all_revealed" && winningPrize && !premioClaimed && isNonRegularUser && playerDataModified && (
            <div className="flex flex-col gap-2">
              <button
                disabled={claiming}
                onClick={() => { if (participacaoId) claimPremio(participacaoId, "pagar_cliente"); }}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trophy className="w-5 h-5" />
                <span>Pagar ao Cliente - {winningPrize.valorDinheiroAlternative}€</span>
              </button>
              <button
                disabled={claiming}
                onClick={() => { if (participacaoId) claimPremio(participacaoId, "cofre"); }}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trophy className="w-5 h-5" />
                <span>Entregar ao Cofre - {winningPrize.valorDinheiroAlternative}€</span>
              </button>
              <button
                disabled={claiming}
                onClick={() => { if (participacaoId) claimPremio(participacaoId, "jogar_novamente"); }}
                className="w-full py-3 bg-surface-container-low text-muted-foreground font-semibold rounded-2xl border border-outline-variant/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                Usar para Jogar Novamente
              </button>
            </div>
          )}

          {gamePhase === "all_revealed" && (
            <button
              onClick={handleComprarNova}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-glow active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              <span className="text-lg">Comprar Nova</span>
              <span className="px-2 py-0.5 bg-black/10 rounded-lg text-sm">
                {preco}€
              </span>
            </button>
          )}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-container-low/60 backdrop-blur-xl rounded-3xl p-5 space-y-3 border border-outline-variant/10"
        >
          <h3 className="font-serif text-lg text-accent">
            Prémios
          </h3>
          <div className="space-y-2">
            {premiosDisplay.map((premio, i) => (
              <div
                key={premio.id || i}
                className="flex items-center justify-between p-3 bg-surface-container-highest/40 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {premio.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {premio.percentagem != null && (
                    <span className="text-xs text-muted-foreground">{premio.percentagem}%</span>
                  )}
                  <span className="font-bold text-secondary">
                    {premio.valorDinheiroAlternative ? `${premio.valorDinheiroAlternative}€` : "-"}
                  </span>
                </div>
              </div>
            ))}
            {premiosDisplay.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Sem prémios configurados
              </p>
            )}
          </div>
        </motion.section>

        <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
          <h3 className="font-serif text-accent font-bold mb-3">Como Funciona?</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Ticket className="w-4 h-4 text-primary mt-0.5" />
              <span>Compre a sua raspadinha e escolha o método de pagamento</span>
            </li>
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-primary mt-0.5" />
              <span>Raspe os 9 quadrados para revelar os seus prémios</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-primary mt-0.5" />
              <span>Encontre 3 símbolos iguais para ganhar o prémio correspondente</span>
            </li>
          </ul>
        </div>
      </main>

      <RaspadinhaWinOverlay
        showWin={showWin}
        winningPrize={winningPrize}
        premioClaimed={premioClaimed}
        creditedAmount={creditedAmount}
        claiming={claiming}
        isNonRegularUser={isNonRegularUser}
        playerDataModified={playerDataModified}
        playerDataConfirmed={false}
        participacaoId={participacaoId}
        onClaim={(claimType) => { if (participacaoId) claimPremio(participacaoId, claimType); }}
        onClose={() => setShowWin(false)}
        onViewProva={() => setProvaModalOpen(true)}
      />

      <BottomNav />

      <GamePaymentDialog
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        amount={preco}
        gameName="Raspadinha"
        showCustomerForm={true}
        participante={participante}
        setParticipante={setParticipante}
        onSelect={processarPagamentoLocal}
        description={`Raspadinha: ${jogo?.nome || ''}`}
      />

      <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md bg-surface-container border border-outline-variant/10 p-4 overflow-hidden max-h-[85vh] overflow-y-auto">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Como Funciona a Raspadinha
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4 space-y-4">
            <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Info className="w-4 h-4" />
                Lógica de Vitória
              </h3>
              <p className="text-sm text-muted-foreground">
                Cada raspadinha usa um sistema <strong>aleatório e justo</strong>.
                Quando compras, é gerado um número aleatório (0-9999) que determina se ganhas e qual prémio.
              </p>
              <p className="text-sm text-muted-foreground">
                As probabilidades são definidas pelos organizadores e cada prémio tem uma percentagem de sair.
              </p>
            </div>

            {(jogo?.configuracao?.premios || jogo?.premios) && (
              <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Prémios e Probabilidades
                </h3>
                <div className="space-y-2">
                  {(jogo?.configuracao?.premios || jogo?.premios || []).map((premio: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{premio.nome}</p>
                        {premio.valorDinheiroAlternative > 0 && (
                          <p className="text-xs text-secondary">{premio.valorDinheiroAlternative}€</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{premio.percentagem || 0}%</p>
                        <p className="text-xs text-muted-foreground/60">chance</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60 mt-2 pt-2 border-t border-outline-variant/10">
                  Soma das percentagens: {(jogo?.configuracao?.premios || jogo?.premios || []).reduce((acc: number, p: any) => acc + (p.percentagem || 0), 0)}%
                </p>
              </div>
            )}

            <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Como Ganhar
              </h3>
              <p className="text-sm text-muted-foreground">
                Para ganhar, precisas de encontrar <strong>3 símbolos iguais</strong> entre as 9 células.
              </p>
              <p className="text-sm text-muted-foreground">
                Arranca com o dedo para revelar as células. Se encontrares 3 iguais, ganhas o prémio correspondente!
              </p>
            </div>

            {premioMaximo > 0 && (
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-4">
                <p className="text-sm text-center">
                  <span className="text-muted-foreground">Prémio máximo: </span>
                  <span className="font-bold text-primary">{premioMaximo.toLocaleString("pt-PT")}€</span>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ParticipacaoConfirmacaoModal
        open={confirmacaoModalOpen}
        onOpenChange={setConfirmacaoModalOpen}
        participacao={participacaoCriada as any}
      />

      <PlayerDataConfirmModal
        open={playerDataConfirmOpen}
        onOpenChange={setPlayerDataConfirmOpen}
        userName={userOriginalData.nome}
        userPhone={userOriginalData.telefone}
        userEmail={userOriginalData.email}
        onConfirmWithOwnData={handlePlayerConfirmOwnData}
        onConfirmWithNewData={handlePlayerConfirmNewData}
      />

      <ProvaJogoModal
        open={provaModalOpen}
        onOpenChange={setProvaModalOpen}
        participacaoId={participacaoId || undefined}
      />

    </div>
  );
}

export default function RaspadinhaPremiumPage() {
  return (
    <Suspense fallback={<RaspadinhaLoading />}>
      <RaspadinhaPremiumContent />
    </Suspense>
  );
}
