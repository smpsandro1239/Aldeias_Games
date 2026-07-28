"use client";

import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  User,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticipacaoConfirmacaoModal } from "@/components/modals/participacao-confirmacao-modal";
import { PlayerDataConfirmModal } from "@/components/modals/player-data-confirm-modal";
import { useGamePage } from "@/hooks/useGamePage";
import { GameDetailLayout } from "@/components/game-detail-layout";
import { GamePaymentDialog } from "@/components/game-payment-dialog";
import { RentabilityAnalysis } from "@/components/rentability-analysis";
import { useRifaGame } from "./use-rifa-game";
import { RifaConfirmationView } from "./rifa-confirmation-view";
import { RifaNumberGrid } from "./rifa-number-grid";
import type { JogoRifa } from "./rifa-types";

export default function RifaPage() {
  const gamePage = useGamePage<JogoRifa>();
  const {
    jogo, loading, userRole, isAdmin,
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
    config, numerosSelecionados, setNumerosSelecionados,
    numerosDisponiveis, blocoSelecionado, setBlocoSelecionado,
    numerosOcupados, numerosJogados,
    provaModalOpen, setProvaModalOpen,
    fetchNumerosOcupados,
    toggleNumero, selectRandomNumbers,
    handleParticipar, processarPagamento,
    precoNumero, randomOptions, handlePlayAgain,
  } = useRifaGame(gamePage);

  if (loading) {
    return (
      <GameDetailLayout title="Rifa" loading>
        <></>
      </GameDetailLayout>
    );
  }

  if (participacaoConfirmada) {
    return (
      <RifaConfirmationView
        numerosSelecionados={numerosSelecionados}
        jogo={jogo}
        config={config}
        setProvaModalOpen={setProvaModalOpen}
        handlePlayAgain={handlePlayAgain}
        participacaoCriada={participacaoCriada}
        userRole={userRole}
        provaModalOpen={provaModalOpen}
      />
    );
  }

  return (
    <GameDetailLayout title="A Tua Rifa" userRole={userRole}>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container to-[#3d1f1a] p-1">
        <div className="bg-surface-container-highest/90 backdrop-blur-md rounded-[1.9rem] p-6 md:p-8">
          <div className="mb-4 inline-block bg-secondary-container/10 border border-secondary-container/20 px-3 py-1 rounded-full">
            <span className="text-secondary text-xs font-bold tracking-widest uppercase">
              {jogo?.evento?.aldeia?.nome || "ASSOCIAÇÃO CULTURAL"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-2">
            {jogo?.nome || "RIFA DE ANGARIAÇÃO"}
          </h2>
          <p className="text-primary text-lg font-medium">PARTICIPE E AJUDE A NOSSA CAUSA</p>
        </div>
      </div>

      <div className="bg-surface-container rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-1">Grande Prémio</p>
            <h3 className="text-2xl font-headline font-bold text-on-surface">
              {jogo?.premios && jogo.premios.length > 0 ? jogo.premios[0].nome : jogo?.premio?.nome || "Prémio"}
            </h3>
          </div>
          <div className="bg-primary-container text-on-primary-container px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg">
            <CreditCard className="w-5 h-5 font-bold" />
            <span className="text-2xl font-extrabold">{precoNumero}€</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Calendar, label: "Data", value: config.dataSorteio || "--/--/----" },
            { icon: Clock, label: "Hora", value: config.horaSorteio || "--:--" },
            { icon: MapPin, label: "Local", value: config.localSorteio || "A definir" },
          ].map((item) => (
            <div key={item.label} className="bg-surface-container-high rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface/50 uppercase">{item.label}</p>
                <p className="font-bold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && config.valorPremios && config.valorPremios > 0 && (
        <RentabilityAnalysis
          stockInicial={jogo?.stockInicial || 0}
          stockAtual={jogo?.stockAtual || 0}
          totalAngariado={jogo?.totalAngariado || 0}
          custoPremios={config.valorPremios}
          labels={{ total: "Total Números", vendidos: "Números Vendidos", premios: "Valor Prémios" }}
        />
      )}

      <div className="bg-surface-container rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
          <User className="w-5 h-5 text-secondary" />
          <h4 className="text-xl font-headline font-bold">Escolha os seus números</h4>
        </div>

        <RifaNumberGrid
          config={config}
          blocoSelecionado={blocoSelecionado}
          setBlocoSelecionado={setBlocoSelecionado}
          setNumerosSelecionados={setNumerosSelecionados}
          numerosSelecionados={numerosSelecionados}
          numerosDisponiveis={numerosDisponiveis}
          numerosOcupados={numerosOcupados}
          numerosJogados={numerosJogados}
          toggleNumero={toggleNumero}
          selectRandomNumbers={selectRandomNumbers}
          randomOptions={randomOptions}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo</label>
            <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
              <User className="w-5 h-5 text-primary" />
              <input type="text" value={participante.nome} onChange={(e) => setParticipante((p: any) => ({ ...p, nome: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-foreground" placeholder="O seu nome" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Telemóvel</label>
            <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
              <User className="w-5 h-5 text-primary" />
              <input type="tel" value={participante.telefone} onChange={(e) => setParticipante((p: any) => ({ ...p, telefone: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-foreground" placeholder="+351 000 000 000" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Notificação</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "whatsapp" as const, icon: MessageCircle, label: "WhatsApp", color: "#25D366" },
              { value: "email" as const, icon: MessageCircle, label: "Email", color: undefined },
              { value: "nenhum" as const, icon: MessageCircle, label: "Nenhum", color: "#666" },
            ]).map((opt) => (
              <button key={opt.value} type="button" onClick={() => setParticipante((p: any) => ({ ...p, notificacao: opt.value }))}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  participante.notificacao === opt.value
                    ? "text-foreground" : "bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest"
                }`}
                style={participante.notificacao === opt.value && opt.color ? { backgroundColor: opt.color } : participante.notificacao === opt.value ? { backgroundColor: "hsl(var(--primary))" } : undefined}>
                <opt.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleParticipar} disabled={numerosSelecionados.length === 0 || !participante.nome}
          className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-full text-lg hover:shadow-[0_0_20px_rgba(255,115,75,0.4)]">
          <Ticket className="w-5 h-5 mr-2" /> Confirmar Participação
        </Button>
      </div>

      <p className="text-center text-on-surface/40 text-xs">Apoie a cultura local. Todos os lucros revertem para a associação.</p>

      <ParticipacaoConfirmacaoModal open={confirmacaoModalOpen} onOpenChange={setConfirmacaoModalOpen} participacao={participacaoCriada} />

      <GamePaymentDialog
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        amount={numerosSelecionados.length * precoNumero}
        gameName="Rifa"
        onSelect={processarPagamento as any}
        description={`${numerosSelecionados.length} número${numerosSelecionados.length > 1 ? "s" : ""} selecionado${numerosSelecionados.length > 1 ? "s" : ""}`}
      />

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
