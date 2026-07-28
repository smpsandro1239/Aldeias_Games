"use client";

import { Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProvaJogoModal } from "@/components/modals/prova-jogo-modal";
import { GameDetailLayout } from "@/components/game-detail-layout";
import type { JogoEuromilhoes, Grelha } from "./euromilhoes-types";

interface EuromilhoesConfirmationViewProps {
  numerosSelecionados: number[];
  jogo: JogoEuromilhoes | null;
  grelha: Grelha | null;
  totalPago: number;
  setProvaModalOpen: (open: boolean) => void;
  handlePlayAgain: () => void;
  participacaoCriada: unknown;
  userRole?: string;
  provaModalOpen: boolean;
}

export function EuromilhoesConfirmationView({
  numerosSelecionados,
  jogo,
  grelha,
  totalPago,
  setProvaModalOpen,
  handlePlayAgain,
  participacaoCriada,
  userRole,
  provaModalOpen,
}: EuromilhoesConfirmationViewProps) {
  return (
    <GameDetailLayout title="Confirmação" userRole={userRole}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-serif text-2xl text-accent font-bold">Participação Confirmada!</h2>
        <p className="text-muted-foreground mt-2">Obrigado pela sua participação no Euromilhões</p>
      </div>
      <div className="bg-surface-container rounded-3xl overflow-hidden mb-6">
        <div className="p-6 md:p-8 space-y-6">
          <div className="text-center border-b border-outline-variant/15 pb-6">
            <p className="text-sm text-secondary font-semibold tracking-widest uppercase mb-2">Os Teus Números</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {numerosSelecionados.map((num) => (
                <span key={num} className="bg-primary text-primary-foreground w-12 h-12 rounded-xl text-xl font-bold flex items-center justify-center">{num}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-[10px] text-on-surface/50 uppercase">Total Pago</p>
              <p className="text-xl font-bold text-green-400">{totalPago.toFixed(2)}€</p>
            </div>
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-[10px] text-on-surface/50 uppercase">Números</p>
              <p className="text-xl font-bold text-primary">{numerosSelecionados.length}</p>
            </div>
          </div>
          {grelha && (
            <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface/60">Grelha nº:</span>
                <span className="text-lg font-bold text-primary">{grelha.numero}</span>
              </div>
              {grelha.premioDescricao && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface/60">Prémio:</span>
                  <span className="text-sm font-bold text-green-400">{grelha.premioDescricao}</span>
                </div>
              )}
            </div>
          )}
          <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface/60">Participações:</span>
              <span className="text-lg font-bold text-primary">{jogo?.totalParticipacoes || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface/60">Total angariado:</span>
              <span className="text-lg font-bold text-green-400">{jogo?.totalAngariado?.toFixed(2) || "0.00"}€</span>
            </div>
          </div>
          <div className="bg-surface-container-highest/50 rounded-2xl p-4 text-center">
            <p className="text-xs text-on-surface/40">Guarde os seus números. O sorteio será realizado na data indicada.</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <Button
          onClick={() => setProvaModalOpen(true)}
          variant="outline"
          className="w-full py-4 border-primary/30 text-primary font-semibold rounded-xl"
        >
          <Eye className="w-4 h-4 mr-2" /> Ver Prova de Jogo
        </Button>
        <Button onClick={handlePlayAgain}
          className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-xl">
          Participar Novamente
        </Button>
      </div>

      <ProvaJogoModal
        open={provaModalOpen}
        onOpenChange={setProvaModalOpen}
        participacaoId={(participacaoCriada as { id?: string })?.id}
      />
    </GameDetailLayout>
  );
}
