"use client";

import { useState } from "react";
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
  Evento,
  Vencedor,
} from "./types";
import type { JogoData } from "@/components/modals/create-jogo-types";
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
  setSelectedAldeia: (aldeia: Aldeia | null) => void;
  setSelectedPremio: (premio: Vencedor | null) => void;
  setConvertValor: (valor: string) => void;
  handleSaveEvento: (data: any) => Promise<{ eventoId?: string; jogosSelecionados?: string[] } | void>;
  handleSaveJogo: (data: any) => Promise<void>;
  handleSaveAldeia: (data: any) => Promise<void>;
  handleSaveUser: (data: any) => Promise<void>;
  handleConvertPrize: (participacaoId: string, valor: number, observacoes?: string) => Promise<void>;
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
  const [entregaMetodo, setEntregaMetodo] = useState("");
  const [entregaObservacoes, setEntregaObservacoes] = useState("");
  const [convertObservacoes, setConvertObservacoes] = useState("");

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
          jogosSelecionados: selectedEvento.jogos?.map((jogo: { tipo: string }) => jogo.tipo) || [],
          isRecurring: selectedEvento.isTemplate ?? false,
          recurrenceFrequency: selectedEvento.frequenciaRecorrencia ?? "semanal",
          recurrenceDayOfWeek: selectedEvento.diaSemanaRecorrencia ?? 1,
          recurrenceTime: selectedEvento.proximaData
            ? new Date(selectedEvento.proximaData).toTimeString().slice(0, 5)
            : "08:00",
          maxOccurrences: selectedEvento.maxOcorrencias ?? undefined,
        } : undefined}
        aldeias={userRole === "super_admin" ? aldeias : undefined}
        onSubmitJogo={handleSaveJogo}
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
        onOpenChange={(open) => {
          setConvertPrizeOpen(open);
          if (!open) setConvertObservacoes("");
        }}
        title="Converter Prémio em Saldo"
        description={
          <div className="space-y-4">
            <p>Introduza o valor a creditar na carteira do utilizador:</p>
            {(selectedPremio?.jogo?.premios?.filter((p) => typeof p.valorDinheiroAlternative === "number" && p.valorDinheiroAlternative > 0) ?? []).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Valores dos prémios do jogo (clique para preencher):</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPremio?.jogo?.premios
                    ?.filter((p) => typeof p.valorDinheiroAlternative === "number" && p.valorDinheiroAlternative > 0)
                    .map((p, i) => (
                      <button
                        key={p.id || i}
                        type="button"
                        onClick={() => setConvertValor(String(p.valorDinheiroAlternative))}
                        className="px-3 py-1 rounded-full border text-sm hover:bg-accent/10 transition-colors"
                      >
                        {p.nome}: {Number(p.valorDinheiroAlternative).toFixed(2)}€
                      </button>
                    ))}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="convertValor">Valor (€)</label>
              <Input
                id="convertValor"
                type="number"
                value={convertValor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertValor(e.target.value)}
                placeholder="Valor em euros"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="convertObservacoes">Observações</label>
              <Input
                id="convertObservacoes"
                value={convertObservacoes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertObservacoes(e.target.value)}
                placeholder="Motivo da conversão (mín. 3 caracteres)"
              />
            </div>
          </div>
        }
        confirmText="Converter"
        onConfirm={() => {
          const valor = parseFloat(convertValor);
          if (selectedPremio && !isNaN(valor) && valor > 0) {
            if (convertObservacoes.trim().length < 3) {
              toast.error("Indique uma observação (mínimo 3 caracteres) para registar na auditoria");
              return;
            }
            handleConvertPrize(selectedPremio.id, valor, convertObservacoes.trim());
            setConvertObservacoes("");
          }
        }}
      />

      <ConfirmModal
        open={confirmEntregaOpen}
        onOpenChange={(open) => {
          setConfirmEntregaOpen(open);
          if (!open) {
            setEntregaMetodo("");
            setEntregaObservacoes("");
          }
        }}
        title="Confirmar Entrega"
        confirmText="Registar Entrega"
        description={
          <div className="space-y-4">
            <p>Confirme a entrega física do prémio. Esta ação é registada na auditoria da participação.</p>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="entregaMetodo">Método de entrega</label>
              <Input
                id="entregaMetodo"
                value={entregaMetodo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntregaMetodo(e.target.value)}
                placeholder="Ex.: presencial, correio..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="entregaObservacoes">Observações</label>
              <Input
                id="entregaObservacoes"
                value={entregaObservacoes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEntregaObservacoes(e.target.value)}
                placeholder="Detalhes da entrega (mín. 3 caracteres)"
              />
            </div>
          </div>
        }
        onConfirm={async () => {
          if (selectedPremio) {
            const metodo = entregaMetodo.trim();
            const obs = entregaObservacoes.trim();
            if (!metodo) {
              toast.error("Indique o método de entrega (ex.: presencial, correio)");
              return;
            }
            if (obs.length < 3) {
              toast.error("Indique uma observação (mínimo 3 caracteres)");
              return;
            }
            const res = await fetch(`/api/participacoes/${selectedPremio.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ premioEntregue: true, metodoEntrega: metodo, observacoes: obs }),
            });
            if (res.ok) {
              toast.success("Marcado como entregue");
              setEntregaMetodo("");
              setEntregaObservacoes("");
              fetchData();
            } else {
              const err = await res.json().catch(() => null);
              toast.error(err?.error || "Erro ao registar a entrega");
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
