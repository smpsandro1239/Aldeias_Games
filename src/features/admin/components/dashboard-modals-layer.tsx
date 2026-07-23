"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  CreateEventoModal,
  CreateJogoModal,
  ConfirmModal,
  AldeiaModal,
  UserModal,
  ResultadosExternosModal,
  QRCodeGenerator,
  SorteioModal,
} from "@/components/modals";
import { VerificarHashModal } from "@/components/verificar-hash-modal";

import type {
  Jogo,
  Aldeia,
  Vencedor,
} from "./types";
import type { JogoData } from "@/components/modals/create-jogo-modal";
import type { AldeiaData } from "@/components/modals/aldeia-modal";
import type { UserData } from "@/components/modals/user-modal";

interface DashboardModalsLayerProps {
  userRole: string;
  aldeiaId?: string;
  aldeia?: { nome: string; id: string; slug: string; tipoOrganizacao: string; logoUrl?: string; metodosPagamentoDefault?: string };
  aldeias: Aldeia[];
  paymentMethodsDefault: string[];
  selectedEvento: Evento | null;
  selectedJogo: JogoData | null;
  selectedAldeia: AldeiaData | null;
  selectedUser: UserData | null;
  selectedPremio: Vencedor | null;
  selectedEventoIdParaJogo: string;
  deleteData: { type: string; id: string } | null;
  toggleJogoData: { jogo: Jogo; novoEstado: "aberto" | "fechado" } | null;
  qrCodeData: { jogoId?: string; eventoId?: string; aldeiaSlug?: string; type: "jogo" | "evento" | "aldeia" } | null;
  testJogo: Jogo | null;
  testJogoTotalParticipacoes: number;
  convertValor: string;
  eventoModalOpen: boolean;
  jogoModalOpen: boolean;
  aldeiaModalOpen: boolean;
  userModalOpen: boolean;
  resultadosExternosOpen: boolean;
  verificarHashOpen: boolean;
  qrCodeOpen: boolean;
  testJogoOpen: boolean;
  convertPrizeOpen: boolean;
  confirmEntregaOpen: boolean;
  setEventoModalOpen: (open: boolean) => void;
  setJogoModalOpen: (open: boolean) => void;
  setAldeiaModalOpen: (open: boolean) => void;
  setUserModalOpen: (open: boolean) => void;
  setResultadosExternosOpen: (open: boolean) => void;
  setVerificarHashOpen: (open: boolean) => void;
  setQrCodeOpen: (open: boolean) => void;
  setTestJogoOpen: (open: boolean) => void;
  setConvertPrizeOpen: (open: boolean) => void;
  setConfirmEntregaOpen: (open: boolean) => void;
  setDeleteData: (data: { type: string; id: string } | null) => void;
  setToggleJogoData: (data: { jogo: Jogo; novoEstado: "aberto" | "fechado" } | null) => void;
  setSelectedAldeia: (aldeia: AldeiaData | null) => void;
  setSelectedPremio: (premio: Vencedor | null) => void;
  setConvertValor: (valor: string) => void;
  handleSaveEvento: (data: any) => Promise<void>;
  handleSaveJogo: (data: any) => Promise<void>;
  handleSaveAldeia: (data: any) => Promise<void>;
  handleSaveUser: (data: any) => Promise<void>;
  handleConvertPrize: (participacaoId: string, valor: number) => Promise<void>;
  executeDelete: () => Promise<void>;
  executeToggleJogoEstado: () => Promise<void>;
  fetchData: () => Promise<void>;
  eventoModalAldeiaId?: string;
  setEventoModalAldeiaId?: (id: string) => void;
}

export function DashboardModalsLayer({
  userRole,
  aldeiaId,
  aldeia,
  aldeias,
  paymentMethodsDefault,
  selectedEvento,
  selectedJogo,
  selectedAldeia,
  selectedUser,
  selectedPremio,
  selectedEventoIdParaJogo,
  deleteData,
  toggleJogoData,
  qrCodeData,
  testJogo,
  testJogoTotalParticipacoes,
  convertValor,
  eventoModalOpen,
  jogoModalOpen,
  aldeiaModalOpen,
  userModalOpen,
  resultadosExternosOpen,
  verificarHashOpen,
  qrCodeOpen,
  testJogoOpen,
  convertPrizeOpen,
  confirmEntregaOpen,
  setEventoModalOpen,
  setJogoModalOpen,
  setAldeiaModalOpen,
  setUserModalOpen,
  setResultadosExternosOpen,
  setVerificarHashOpen,
  setQrCodeOpen,
  setTestJogoOpen,
  setConvertPrizeOpen,
  setConfirmEntregaOpen,
  setDeleteData,
  setToggleJogoData,
  setSelectedAldeia,
  setSelectedPremio,
  setConvertValor,
  handleSaveEvento,
  handleSaveJogo,
  handleSaveAldeia,
  handleSaveUser,
  handleConvertPrize,
  executeDelete,
  executeToggleJogoEstado,
  fetchData,
  eventoModalAldeiaId,
  setEventoModalAldeiaId,
}: DashboardModalsLayerProps) {
  return (
    <>
      <CreateEventoModal
        open={eventoModalOpen}
        onOpenChange={(open) => {
          setEventoModalOpen(open);
          if (!open) setEventoModalAldeiaId?.("");
        }}
        onSubmit={handleSaveEvento}
        aldeiaId={eventoModalAldeiaId || aldeiaId || ""}
        initialData={selectedEvento ? {
          id: selectedEvento.id,
          nome: selectedEvento.nome,
          descricao: selectedEvento.descricao,
          dataInicio: new Date(selectedEvento.dataInicio).toISOString().slice(0, 16),
          dataFim: new Date(selectedEvento.dataFim).toISOString().slice(0, 16),
          objectivoAngariacao: selectedEvento.objectivoAngariacao ?? 0,
          publico: selectedEvento.publico ?? false,
          aldeiaId: selectedEvento.aldeiaId,
          estado: selectedEvento.estado,
          jogosSelecionados: selectedEvento.jogos?.map((jogo) => jogo.tipo) || [],
          isRecurring: selectedEvento.isTemplate ?? false,
          recurrenceFrequency: selectedEvento.frequenciaRecorrencia ?? "semanal",
          recurrenceDayOfWeek: selectedEvento.diaSemanaRecorrencia ?? 1,
          recurrenceTime: selectedEvento.proximaData
            ? new Date(selectedEvento.proximaData).toTimeString().slice(0, 5)
            : "08:00",
        } : undefined}
        aldeias={userRole === "super_admin" ? aldeias : undefined}
      />

      <CreateJogoModal
        open={jogoModalOpen}
        onOpenChange={setJogoModalOpen}
        onSubmit={handleSaveJogo}
        eventoId={selectedEventoIdParaJogo}
        initialData={selectedJogo ?? undefined}
        userRole={userRole}
        aldeiaId={aldeiaId}
        metodosPagamentoDefault={paymentMethodsDefault}
      />

      <AldeiaModal
        open={aldeiaModalOpen}
        onOpenChange={setAldeiaModalOpen}
        onSubmit={handleSaveAldeia}
        initialData={selectedAldeia ?? undefined}
      />

      <UserModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        onSubmit={handleSaveUser}
        initialData={selectedUser ?? undefined}
        aldeias={aldeia ? [aldeia] : (userRole === "super_admin" ? aldeias : [])}
        currentUserRole={userRole}
      />

      <ConfirmModal
        open={!!deleteData}
        onOpenChange={() => setDeleteData(null)}
        title="Confirmar Eliminação"
        description="Esta ação não pode ser desfeita. Tem a certeza que deseja eliminar?"
        onConfirm={executeDelete}
      />

      <ConfirmModal
        open={!!toggleJogoData}
        onOpenChange={(open: boolean) => {
          if (!open) setToggleJogoData(null);
        }}
        title={toggleJogoData?.novoEstado === "fechado" ? "Desativar Jogo" : "Ativar Jogo"}
        description={
          toggleJogoData ? (
            <div className="space-y-2">
              <p>
                Tem a certeza que deseja <strong>{toggleJogoData.novoEstado === "fechado" ? "DESATIVAR" : "ATIVAR"}</strong> o jogo:
              </p>
              <p className="font-semibold">{toggleJogoData.jogo.nome}</p>
              {toggleJogoData.novoEstado === "fechado" && (
                <p className="text-sm text-muted-foreground">
                  Participações futuras serão bloqueadas. Participações existentes mantêm-se.
                </p>
              )}
              {toggleJogoData.novoEstado === "aberto" && (
                <p className="text-sm text-muted-foreground">
                  O jogo voltará a aceitar novas participações.
                </p>
              )}
            </div>
          ) : undefined
        }
        confirmText={toggleJogoData?.novoEstado === "fechado" ? "Desativar" : "Ativar"}
        variant={toggleJogoData?.novoEstado === "fechado" ? "destructive" : "default"}
        onConfirm={executeToggleJogoEstado}
      />

      <ResultadosExternosModal
        open={resultadosExternosOpen}
        onOpenChange={setResultadosExternosOpen}
      />

      <VerificarHashModal
        open={verificarHashOpen}
        onOpenChange={setVerificarHashOpen}
      />

      <QRCodeGenerator
        open={qrCodeOpen}
        onOpenChange={setQrCodeOpen}
        data={qrCodeData || { type: "jogo" }}
        title="Partilhar Jogo"
      />

      <ConfirmModal
        open={convertPrizeOpen}
        onOpenChange={setConvertPrizeOpen}
        title="Converter Prémio em Saldo"
        description={
          <div className="space-y-4">
            <p>Introduza o valor a creditar na carteira do utilizador:</p>
            <Input
              type="number"
              value={convertValor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertValor(e.target.value)}
              placeholder="Valor em euros"
            />
          </div>
        }
        confirmText="Converter"
        onConfirm={() => {
          const valor = parseFloat(convertValor);
          if (selectedPremio && !isNaN(valor) && valor > 0) {
            handleConvertPrize(selectedPremio.id, valor);
          }
        }}
      />

      <ConfirmModal
        open={confirmEntregaOpen}
        onOpenChange={setConfirmEntregaOpen}
        title="Confirmar Entrega"
        description="Tem a certeza que deseja marcar este prémio como entregue fisicamente?"
        onConfirm={async () => {
          if (selectedPremio) {
            const res = await fetch(`/api/participacoes/${selectedPremio.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ premioEntregue: true }),
            });
            if (res.ok) {
              toast.success("Marcado como entregue");
              fetchData();
            }
          }
        }}
      />

      <Dialog open={testJogoOpen} onOpenChange={setTestJogoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-secondary" />
              Testar Jogo: {testJogo?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade permite testar o jogo em modo fictício, sem afectar dados reais.
              O sorteio será executado usando as participações existentes e os vencedores serão determinados aleatoriamente.
            </p>
            {testJogoTotalParticipacoes === 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Não há participações para este jogo. Cria participações primeiro para testar.
                </AlertDescription>
              </Alert>
            )}
            {testJogo && testJogoTotalParticipacoes > 0 && (
              <SorteioModal
                open={testJogoOpen}
                onOpenChange={setTestJogoOpen}
                jogoNome={testJogo.nome}
                totalParticipacoes={testJogoTotalParticipacoes}
                onExecutarSorteio={async (observacoes?: string) => {
                  try {
                    const res = await fetch("/api/sorteios/teste", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ jogoId: testJogo.id, observacoes }),
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      return { success: false, error: json.error || "Erro ao executar teste" };
                    }
                    fetchData();
                    return {
                      success: true,
                      data: {
                        resultado: json.data.resultado,
                        vencedores: json.data.vencedores,
                        hash: json.data.hash,
                        seed: json.data.seed,
                      },
                    };
                  } catch (error) {
                    console.error("Erro no teste de sorteio:", error);
                    return { success: false, error: "Erro interno do servidor" };
                  }
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
