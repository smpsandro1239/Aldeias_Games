"use client";

import { Check, Calendar, MapPin, QrCode, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProvaJogoModal } from "@/components/modals/prova-jogo-modal";
import { GameDetailLayout } from "@/components/game-detail-layout";
import type { JogoRifa, RifaConfig } from "./rifa-types";

interface RifaConfirmationViewProps {
  numerosSelecionados: number[];
  jogo: JogoRifa | null;
  config: RifaConfig;
  setProvaModalOpen: (open: boolean) => void;
  handlePlayAgain: () => void;
  participacaoCriada: unknown;
  userRole?: string;
  provaModalOpen: boolean;
}

export function RifaConfirmationView({
  numerosSelecionados,
  jogo,
  config,
  setProvaModalOpen,
  handlePlayAgain,
  participacaoCriada,
  userRole,
  provaModalOpen,
}: RifaConfirmationViewProps) {
  const numerosVendidos = (jogo?.stockInicial || 0) - (jogo?.stockAtual || 0);
  const totalGasto = numerosSelecionados.length * (jogo?.preco || 5);

  return (
    <GameDetailLayout title="Confirmação" userRole={userRole}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-serif text-2xl text-accent font-bold">Participação Confirmada!</h2>
        <p className="text-muted-foreground mt-2">Obrigado pela sua participação</p>
      </div>
      <div className="bg-surface-container rounded-3xl overflow-hidden mb-6">
        <div className="p-6 md:p-8 space-y-6">
          <div className="text-center border-b border-outline-variant/15 pb-6">
            <p className="text-sm text-secondary font-semibold tracking-widest uppercase mb-2">Seus Números</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {numerosSelecionados.map((num) => (
                <span key={num} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xl font-bold">
                  {num.toString().padStart(3, "0")}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-[10px] text-on-surface/50 uppercase">Total Gasto</p>
              <p className="text-xl font-bold text-green-400">{totalGasto.toFixed(2)}€</p>
            </div>
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-[10px] text-on-surface/50 uppercase">Números Jogados</p>
              <p className="text-xl font-bold text-primary">{numerosSelecionados.length}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-container-high rounded-xl p-3 text-center">
              <p className="text-[10px] text-on-surface/50 uppercase">Total</p>
              <p className="text-lg font-bold">{jogo?.stockInicial || 0}</p>
            </div>
            <div className="bg-surface-container-high rounded-xl p-3 text-center">
              <p className="text-[10px] text-on-surface/50 uppercase">Vendidos</p>
              <p className="text-lg font-bold text-primary">{numerosVendidos}</p>
            </div>
            <div className="bg-surface-container-high rounded-xl p-3 text-center">
              <p className="text-[10px] text-on-surface/50 uppercase">Disponíveis</p>
              <p className="text-lg font-bold text-green-400">{jogo?.stockAtual || 0}</p>
            </div>
          </div>
          <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface/60">Angariado:</span>
              <span className="text-lg font-bold text-green-400">{jogo?.totalAngariado?.toFixed(2) || 0}€</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface/60">Participações:</span>
              <span className="text-lg font-bold text-primary">{jogo?.totalParticipacoes || 0}</span>
            </div>
          </div>
          <div className="space-y-3 text-center border-t border-outline-variant/15 pt-6">
            <p className="text-on-surface/60 text-sm flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              Sorteio: {config.dataSorteio ? `${config.dataSorteio}${config.horaSorteio ? ` às ${config.horaSorteio}` : ""}` : "A definir"}
            </p>
            <p className="text-on-surface/60 text-sm flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />{config.localSorteio || "A definir"}
            </p>
          </div>
          <div className="bg-surface-container-highest/50 rounded-2xl p-4">
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 bg-foreground rounded-xl p-2">
                <div className="w-full h-full bg-[#111] rounded-lg flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-foreground" />
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-on-surface/40">Guarde este código para o sorteio</p>
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
        <Button
          onClick={handlePlayAgain}
          className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-xl"
        >
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
