"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmModal } from "@/components/modals/confirm-modal";

export function CofreConfirmModals({
  confirmDepId,
  rejectDepId,
  confirmLevId,
  rejectLevId,
  setConfirmDepId,
  setRejectDepId,
  setConfirmLevId,
  setRejectLevId,
  onConfirmarDeposito,
  onRejeitarDeposito,
  onConfirmarLevantamento,
  onRejeitarLevantamento,
}: {
  confirmDepId: string | null;
  rejectDepId: string | null;
  confirmLevId: string | null;
  rejectLevId: string | null;
  setConfirmDepId: (id: string | null) => void;
  setRejectDepId: (id: string | null) => void;
  setConfirmLevId: (id: string | null) => void;
  setRejectLevId: (id: string | null) => void;
  onConfirmarDeposito: (id: string) => void;
  onRejeitarDeposito: (id: string, motivo: string) => void;
  onConfirmarLevantamento: (id: string) => void;
  onRejeitarLevantamento: (id: string, motivo: string) => void;
}) {
  const [rejectDepMotivo, setRejectDepMotivo] = useState("");
  const [rejectLevMotivo, setRejectLevMotivo] = useState("");

  return (
    <>
      <ConfirmModal
        open={!!confirmDepId}
        onOpenChange={(open) => { if (!open) setConfirmDepId(null); }}
        title="Confirmar Depósito"
        description="Tem a certeza de que deseja confirmar este depósito? O valor será creditado no cofre da aldeia."
        confirmText="Confirmar"
        variant="default"
        onConfirm={() => { if (confirmDepId) { onConfirmarDeposito(confirmDepId); setConfirmDepId(null); } }}
      />

      <ConfirmModal
        open={!!rejectDepId}
        onOpenChange={(open) => { if (!open) { setRejectDepId(null); setRejectDepMotivo(""); } }}
        title="Rejeitar Depósito"
        description={
          <div className="space-y-2">
            <p>Tem a certeza de que deseja rejeitar este depósito?</p>
            <Textarea
              placeholder="Motivo da rejeição (obrigatório)"
              value={rejectDepMotivo}
              onChange={(e) => setRejectDepMotivo(e.target.value)}
              rows={3}
            />
          </div>
        }
        confirmText="Rejeitar"
        variant="destructive"
        onConfirm={() => { if (rejectDepId && rejectDepMotivo.trim()) { onRejeitarDeposito(rejectDepId, rejectDepMotivo); setRejectDepId(null); setRejectDepMotivo(""); } }}
      />

      <ConfirmModal
        open={!!confirmLevId}
        onOpenChange={(open) => { if (!open) setConfirmLevId(null); }}
        title="Confirmar Levantamento"
        description="Tem a certeza de que deseja confirmar este levantamento? O valor será deduzido do cofre."
        confirmText="Confirmar"
        variant="default"
        onConfirm={() => { if (confirmLevId) { onConfirmarLevantamento(confirmLevId); setConfirmLevId(null); } }}
      />

      <ConfirmModal
        open={!!rejectLevId}
        onOpenChange={(open) => { if (!open) { setRejectLevId(null); setRejectLevMotivo(""); } }}
        title="Rejeitar Levantamento"
        description={
          <div className="space-y-2">
            <p>Tem a certeza de que deseja rejeitar este levantamento?</p>
            <Textarea
              placeholder="Motivo da rejeição (obrigatório)"
              value={rejectLevMotivo}
              onChange={(e) => setRejectLevMotivo(e.target.value)}
              rows={3}
            />
          </div>
        }
        confirmText="Rejeitar"
        variant="destructive"
        onConfirm={() => { if (rejectLevId && rejectLevMotivo.trim()) { onRejeitarLevantamento(rejectLevId, rejectLevMotivo); setRejectLevId(null); setRejectLevMotivo(""); } }}
      />
    </>
  );
}
