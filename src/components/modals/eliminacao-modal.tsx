"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";
import { ELIMINACAO_LABELS } from "@/lib/eliminacao-types";

interface EliminacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: "jogo" | "evento" | "aldeia" | null;
  recursoId: string | null;
  recursoNome: string | null;
  userRole: string;
  onSuccess: () => void;
}

export function EliminacaoModal({
  open,
  onOpenChange,
  tipo,
  recursoId,
  recursoNome,
  userRole,
  onSuccess,
}: EliminacaoModalProps) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = userRole === "super_admin";

  const handleSubmit = async () => {
    if (!tipo || !recursoId) return;
    if (motivo.trim().length < 5) {
      toast.error("Indique o motivo da eliminação (mínimo 5 caracteres)");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("/api/eliminacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, recursoId, motivo: motivo.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar pedido de eliminação");
        return;
      }
      if (data.autoAprovado) {
        toast.success(`${ELIMINACAO_LABELS[tipo] || tipo} eliminado com sucesso (super administrador)`);
      } else {
        toast.success("Pedido de eliminação criado. Aguarda aprovação de um outro administrador.");
      }
      setMotivo("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Erro de conexão ao criar pedido");
    } finally {
      setLoading(false);
    }
  };

  const label = tipo ? (ELIMINACAO_LABELS[tipo] || tipo) : "recurso";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Eliminar {label}: {recursoNome}
          </DialogTitle>
          <DialogDescription>
            {isSuperAdmin
              ? "Como super administrador, pode eliminar diretamente. A eliminação será imediata."
              : "A eliminação requer a aprovação de um outro administrador (da aldeia ou super administrador)."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert variant={isSuperAdmin ? "default" : "destructive"}>
            <ShieldAlert className="h-4 w-4" />
            <AlertDescription>
              {isSuperAdmin ? (
                <>
                  A eliminação é imediata. Se o {label} tiver histórico (participações), é <strong>arquivado</strong> (oculto das
                  listas públicas, histórico preservado). Sem histórico, é apagado definitivamente.
                </>
              ) : (
                <>
                  Será criado um pedido pendente e os administradores da aldeia + super administradores serão <strong>notificados por
                  email e no dashboard</strong>. Só após a 2ª aprovação o {label} é eliminado.
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="eliminacaoMotivo">Motivo da eliminação *</Label>
            <Textarea
              id="eliminacaoMotivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explique o motivo (visível na auditoria e nas notificações)"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading ? "A processar..." : isSuperAdmin ? "Eliminar agora" : "Enviar pedido de eliminação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
