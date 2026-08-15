"use client";

import { useCallback, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Grid2X2, Ticket, Star, TrendingUp, Euro, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentSelector } from "@/components/payment";
import { LayoutHeader } from "@/components/layout-header";
import { BottomNav } from "@/components/bottom-nav";
import { PlayerDataConfirmModal } from "@/components/modals/player-data-confirm-modal";
import { useGamePage } from "@/hooks/useGamePage";
import { usePoioGame } from "./use-poio-game";
import { PoioFieldGrid } from "./poio-field-grid";
import { PoioBetModal } from "./poio-bet-modal";
import { PoioConfirmationDialog } from "./poio-confirmation-dialog";
import type { Jogo } from "./poio-types";
import { calcularRentabilidade, getRentabilidadeStatus } from "./poio-types";

function PoioDaVacaPage() {
  const router = useRouter();
  const {
    jogo: baseJogo, setJogo: setBaseJogo, loading, jogoId,
    userRole, isAdmin, isNonRegularUser,
    userOriginalData,
    playerDataConfirmOpen, setPlayerDataConfirmOpen,
    playerDataModified, setPlayerDataModified,
    refreshBalance,
  } = useGamePage<Jogo>();

  const jogo = baseJogo as Jogo | null;
  const game = usePoioGame(
    jogo, jogoId, userRole, isAdmin, isNonRegularUser,
    userOriginalData, playerDataConfirmOpen, setPlayerDataConfirmOpen,
    playerDataModified, setPlayerDataModified,
    refreshBalance, setBaseJogo,
  );

  const {
    selectedSquares, betModalOpen, setBetModalOpen,
    paymentModalOpen, setPaymentModalOpen,
    jogadorForm, setJogadorForm,
    apostaConfirmada, setApostaConfirmada,
    cells, dimensoes, numerosOcupados, apostasParaLista,
    custoPorQuadrado, valorMercado, valorCompra,
    randomOptions, isVendedor,
    fetchJogo, fetchOcupados, fetchParticipacoes,
    handleSquareClick, handleRandomPlay, handleClearSelection,
    handleBet, handleSubmitBet, processarPagamento,
    handlePlayerConfirmOwnData, handlePlayerConfirmNewData,
  } = game;

  const totalCells = dimensoes.x * dimensoes.y;
  const rentabilidade = calcularRentabilidade(custoPorQuadrado, valorMercado, valorCompra, totalCells);
  const statusRentabilidade = getRentabilidadeStatus(rentabilidade);

  useEffect(() => { fetchJogo(); fetchOcupados(); fetchParticipacoes(); }, [fetchJogo, fetchOcupados, fetchParticipacoes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  return (
    <LayoutHeader>
      <div className="min-h-screen bg-background text-foreground font-body">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <Grid2X2 className="text-primary" />
            <h1 className="font-serif text-xl tracking-wide text-accent font-bold italic">Poio da Vaca</h1>
          </div>
        </header>

        <main className="px-4 pt-6 space-y-6">
          <section className="relative space-y-4 px-2">
            <div className="relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-10 -mt-10" />
              <div className="relative glass-card rounded-3xl p-6 overflow-hidden">
                <p className="text-xs font-semibold tracking-widest text-secondary uppercase mb-2">Grande Evento</p>
                <h2 className="font-serif text-3xl leading-tight text-foreground max-w-[80%]">Onde a Sorte Encontra a Tradição</h2>
                <div className="flex flex-col gap-2 mt-4">
                  {isAdmin ? (
                    <span className="text-primary font-bold text-sm">GRANDE PRÉMIO</span>
                  ) : (
                    <span className="text-primary font-bold text-sm">VALOR EM JOGO</span>
                  )}
                  <p className="font-serif text-xl text-accent">
                    {valorMercado > 500 ? "Vaca de Raça" : `${valorMercado}€ em Cartão`}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground text-sm bg-surface-container-low/50 self-start px-3 py-1 rounded-full">
                    <Star className="w-3 h-3 text-primary" />
                    <span>Sorteio Local Certificado</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {isAdmin && (
            <section className="px-2">
              <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  <h3 className="font-serif text-lg text-accent">Análise de Rentabilidade</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-surface-container-low p-3 rounded-xl">
                    <p className="text-[10px] text-muted-foreground uppercase">Receita Total</p>
                    <p className="font-serif text-xl text-primary">{custoPorQuadrado * totalCells}€</p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-xl">
                    <p className="text-[10px] text-muted-foreground uppercase">Custo Real (Contabilidade)</p>
                    <p className="font-serif text-xl text-red-400">{valorCompra}€</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="flex justify-between bg-surface-container-low p-2 rounded-lg">
                    <span className="text-on-surface-variant">Valor Mercado (Jogadores):</span>
                    <span className="font-bold">{valorMercado}€</span>
                  </div>
                  <div className="flex justify-between bg-surface-container-low p-2 rounded-lg">
                    <span className="text-on-surface-variant">Valor Compra (Contabilidade):</span>
                    <span className="font-bold">{valorCompra}€</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${rentabilidade >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold">Rentabilidade:</span>
                    <span className={`font-headline text-2xl ${statusRentabilidade.cor}`}>{rentabilidade}%</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{statusRentabilidade.descricao}</p>
                </div>
                <div className="mt-3 text-xs text-on-surface-variant/60">
                  Campo: {dimensoes.x}×{dimensoes.y} = {totalCells} quadrados • {custoPorQuadrado}€ cada
                </div>
              </div>
            </section>
          )}

          <section className="px-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-lg">Seleção Rápida</h3>
              <button onClick={handleClearSelection} className="text-xs text-on-surface-variant hover:text-error transition-colors">
                Limpar tudo
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {randomOptions.map(count => (
                <button
                  key={count}
                  onClick={() => handleRandomPlay(count)}
                  className="px-4 py-2 bg-surface-container-high rounded-xl text-sm font-bold hover:bg-primary-container/20 hover:text-primary-container transition-colors"
                >
                  +{count}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-2">
              <span className="bg-primary-container/20 px-2 py-1 rounded-lg text-primary-container font-bold">
                {selectedSquares.length}
              </span>
              <span>quadrado{selectedSquares.length !== 1 ? 's' : ''} selecionado{selectedSquares.length !== 1 ? 's' : ''}</span>
            </div>
          </section>

          <PoioFieldGrid
            cells={cells}
            dimensoes={dimensoes}
            selectedSquares={selectedSquares}
            numerosOcupados={numerosOcupados}
            onSquareClick={handleSquareClick}
          />

          <section className="px-2">
            <div className="bg-surface-container p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-on-surface-variant">Preço por quadrado</p>
                <p className="font-headline text-2xl text-primary">{custoPorQuadrado}€</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-on-surface-variant">Total</p>
                <p className="font-headline text-2xl text-secondary">
                  {selectedSquares.length * custoPorQuadrado}€
                </p>
              </div>
            </div>
          </section>

          {apostasParaLista.length > 0 && (isAdmin || isVendedor) && (
            <section className="px-2">
              <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
                <div className="flex items-center gap-2 mb-3">
                  <Ticket className="w-5 h-5 text-primary" />
                  <h3 className="font-serif text-lg text-accent">
                    {isAdmin ? "Todas as Apostas" : "As Minhas Vendas"}
                  </h3>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-auto">
                    {apostasParaLista.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {apostasParaLista.map((aposta) => {
                    const numerosArray = Array.isArray(aposta.numeros) ? aposta.numeros : [];
                    const numerosFormatados = numerosArray.map((n: number) => cells[n - 1]?.display || `N${n}`).join(", ");
                    return (
                      <div key={aposta.id} className="p-3 rounded-xl bg-surface-container-low">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-accent text-sm">{numerosFormatados}</p>
                            <p className="text-xs text-muted-foreground mt-1">👤 {aposta.jogadorNome || "Anónimo"}</p>
                            {aposta.jogadorTelefone && <p className="text-xs text-muted-foreground/60">📞 {aposta.jogadorTelefone}</p>}
                            {aposta.jogadorEmail && <p className="text-xs text-muted-foreground/60">✉️ {aposta.jogadorEmail}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground/60">
                              {aposta.createdAt ? new Date(aposta.createdAt).toLocaleDateString("pt-PT") : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="pb-6 px-2">
            <Button
              onClick={handleBet}
              disabled={selectedSquares.length === 0}
              className="w-full bg-primary-container text-on-primary-container font-bold py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl shadow-primary-container/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Ticket className="w-5 h-5" />
              <span className="text-lg">
                {selectedSquares.length === 0
                  ? "Selecione quadrados"
                  : `Apostar em ${selectedSquares.length} quadrado${selectedSquares.length > 1 ? 's' : ''}`
                }
              </span>
            </Button>
            <p className="text-center text-on-surface-variant/50 text-[10px] mt-3 px-4">
              Ao apostar, concorda com os regulamentos da Aldeias Games e das autoridades locais.
            </p>
          </section>

          <section className="px-2 pb-4">
            <div className="bg-surface-container-low p-4 rounded-[1.5rem] flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-container-high flex items-center justify-center text-3xl">🐄</div>
              <div className="space-y-1">
                <h4 className="font-headline text-base">Como funciona?</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Uma vaca é solta no campo quadrado. Quando defecar pela primeira vez, verificamos as coordenadas (X,Y) do "coco" e o quadrado correspondente é o vencedor!
                </p>
              </div>
            </div>
          </section>
        </main>

        <PoioBetModal
          open={betModalOpen}
          onOpenChange={setBetModalOpen}
          jogadorForm={jogadorForm}
          setJogadorForm={setJogadorForm}
          selectedSquares={selectedSquares}
          cells={cells}
          custoPorQuadrado={custoPorQuadrado}
          onSubmit={handleSubmitBet}
        />

        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="font-headline text-xl flex items-center gap-2">
                <Euro className="w-5 h-5 text-primary" />
                Pagamento
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <div className="bg-surface-container-high rounded-xl p-4 text-center">
                <p className="text-xs text-on-surface-variant">Total a pagar</p>
                <p className="font-headline text-3xl text-primary">{selectedSquares.length * custoPorQuadrado}€</p>
              </div>
              <div className="space-y-4">
                <PaymentSelector
                  amount={selectedSquares.length * custoPorQuadrado}
                  onSelect={processarPagamento as any}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <PlayerDataConfirmModal
          open={playerDataConfirmOpen}
          onOpenChange={setPlayerDataConfirmOpen}
          userName={userOriginalData.nome}
          userPhone={userOriginalData.telefone}
          userEmail={userOriginalData.email}
          onConfirmWithOwnData={handlePlayerConfirmOwnData}
          onConfirmWithNewData={handlePlayerConfirmNewData}
        />

        <PoioConfirmationDialog
          apostaConfirmada={apostaConfirmada}
          onClose={() => setApostaConfirmada(null)}
        />
      </div>
      <BottomNav role={userRole || undefined} />
    </LayoutHeader>
  );
}

export default function PoioDaVacaPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">A carregar...</div></div>}>
      <PoioDaVacaPage />
    </Suspense>
  );
}
