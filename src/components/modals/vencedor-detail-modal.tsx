"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VerificarHashModal } from "@/components/verificar-hash-modal";
import { Trophy } from "lucide-react";
import { useUserData, useAldeiaData, useHistoricoParticipacoes, parseWinningPrize, computeEstatisticas } from "./vencedor-detail-utils";
import { VencedorResumo } from "./vencedor-detail-resumo";
import { VencedorTabs } from "./vencedor-detail-tabs";
import { VencedorAcoes } from "./vencedor-detail-acoes";
import { VencedorDetailModalProps } from "./vencedor-detail-types";

export function VencedorDetailModal({
  open,
  onOpenChange,
  vencedor,
  onConvertPrize,
  onEntregaPremio,
}: VencedorDetailModalProps) {
  const [activeTab, setActiveTab] = useState("perfil");
  const [verificarHashOpen, setVerificarHashOpen] = useState(false);
  const [hashVerificado, setHashVerificado] = useState(false);

  const userId = vencedor?.user?.id || vencedor?.dadosVencedor?.userId;
  const { userData, loading: loadingUser } = useUserData(userId, open && (activeTab === "perfil" || activeTab === "estatisticas"));
  const { aldeiaData, loading: loadingAldeia } = useAldeiaData(userData?.aldeiaId);
  const { participacoes, loading: loadingHistorico } = useHistoricoParticipacoes(
    userId,
    open && (activeTab === "historico" || activeTab === "estatisticas")
  );

  const estatisticas = computeEstatisticas(participacoes);

  const handleConvertPrize = useCallback(() => {
    if (vencedor) onConvertPrize(vencedor);
  }, [vencedor, onConvertPrize]);

  const handleVerificacaoSucesso = useCallback(() => {
    setHashVerificado(true);
    setVerificarHashOpen(false);
  }, []);

  const handleEntregaPremio = useCallback(() => {
    if (!hashVerificado) {
      setVerificarHashOpen(true);
      return;
    }
    if (vencedor) onEntregaPremio(vencedor);
  }, [vencedor, onEntregaPremio, hashVerificado]);

  if (!vencedor) return null;

  const wonPrize = parseWinningPrize(vencedor);

  const nomeExibicao = vencedor.nomeCliente || vencedor.user?.nome || vencedor.dadosVencedor?.userNome || "Anónimo";
  const emailExibicao = vencedor.user?.email || vencedor.dadosVencedor?.userEmail || vencedor.emailCliente || "";
  const telefoneExibicao = vencedor.user?.telefone || vencedor.dadosVencedor?.userTelefone || vencedor.telefoneCliente || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" aria-describedby="vencedor-detail-description">
        <DialogHeader className="bg-gradient-to-r from-amber-600/10 via-yellow-600/10 to-orange-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-amber-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-amber-600/20 p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600" aria-hidden="true" />
            </div>
            Detalhes do Vencedor
          </DialogTitle>
          <DialogDescription id="vencedor-detail-description">
            Informações completas sobre o vencedor {nomeExibicao} e o seu histórico
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <VencedorResumo
            vencedor={vencedor}
            nomeExibicao={nomeExibicao}
            emailExibicao={emailExibicao}
            telefoneExibicao={telefoneExibicao}
            wonPrize={wonPrize}
          />

          <VencedorTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            vencedor={vencedor}
            nomeExibicao={nomeExibicao}
            emailExibicao={emailExibicao}
            telefoneExibicao={telefoneExibicao}
            wonPrize={wonPrize}
            aldeiaData={aldeiaData ?? undefined}
            loadingUser={loadingUser}
            loadingAldeia={loadingAldeia}
            participacoes={participacoes}
            loadingHistorico={loadingHistorico}
            estatisticas={estatisticas}
          />

          {!vencedor.premioEntregue && (
            <VencedorAcoes
              hashVerificado={hashVerificado}
              onVerificarHash={() => setVerificarHashOpen(true)}
              onConvert={handleConvertPrize}
              onEntrega={handleEntregaPremio}
            />
          )}
        </div>

        <VerificarHashModal
          open={verificarHashOpen}
          onOpenChange={setVerificarHashOpen}
        />
      </DialogContent>
    </Dialog>
  );
}