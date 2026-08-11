"use client";

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Clock, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";
import { ELIMINACAO_LABELS } from "@/lib/eliminacao-types";
import type { PedidoEliminacao } from "@/features/admin/components/types";

interface EliminacoesListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: string;
  onSuccess: () => void;
}

const estadoBadge: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  aprovado: { label: "Aprovado", className: "bg-green-500/15 text-green-600 dark:text-green-400" },
  rejeitado: { label: "Rejeitado", className: "bg-destructive/15 text-destructive" },
};

export function EliminacoesListModal({ open, onOpenChange, userRole, onSuccess }: EliminacoesListModalProps) {
  const [pedidos, setPedidos] = useState<PedidoEliminacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [acaoPedidoId, setAcaoPedidoId] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const isSuperAdmin = userRole === "super_admin";

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/eliminacoes?estado=all", {});
      if (res.ok) {
        const data = await res.json();
        setPedidos(data.pedidos || []);
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos de eliminação:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchPedidos();
  }, [open, fetchPedidos]);

  const handleDecidir = async (pedido: PedidoEliminacao, acao: "aprovar" | "rejeitar") => {
    setAcaoPedidoId(pedido.id);
    try {
      const res = await apiRequest(`/api/eliminacoes/${pedido.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, observacoes: observacoes.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao processar decisão");
        return;
      }
      toast.success(acao === "aprovar" ? "Eliminação aprovada — recurso arquivado" : "Pedido rejeitado");
      setObservacoes("");
      fetchPedidos();
      onSuccess();
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setAcaoPedidoId(null);
    }
  };

  const pendentes = pedidos.filter((p) => p.estado === "pendente");
  const historico = pedidos.filter((p) => p.estado !== "pendente");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Pedidos de Eliminação
            <Button variant="ghost" size="icon" className="ml-auto" onClick={fetchPedidos} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {loading && pedidos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">A carregar pedidos...</p>
          ) : pedidos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sem pedidos de eliminação.</p>
          ) : (
            <>
              {pendentes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" /> Pendentes ({pendentes.length})
                  </h3>
                  {pendentes.map((p) => (
                    <div key={p.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-medium">
                            {ELIMINACAO_LABELS[p.tipo] || p.tipo}: {p.recursoNome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pedido por {p.requestedBy?.nome || "desconhecido"} · {p.aldeia?.nome || "—"} ·{" "}
                            {new Date(p.createdAt).toLocaleString("pt-PT")}
                          </p>
                        </div>
                        <Badge className={estadoBadge[p.estado].className}>{estadoBadge[p.estado].label}</Badge>
                      </div>
                      <p className="text-sm bg-muted/50 rounded p-2">Motivo: {p.motivo}</p>
                      <div className="flex flex-wrap items-end gap-2">
                        <Textarea
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                          placeholder="Observações (obrigatórias para rejeitar)"
                          rows={1}
                          className="max-w-md"
                        />
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={!!acaoPedidoId}
                          onClick={() => handleDecidir(p, "aprovar")}
                        >
                          <Check className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!!acaoPedidoId}
                          onClick={() => {
                            if (observacoes.trim().length < 3) {
                              toast.error("Indique observações (mínimo 3 caracteres) para rejeitar");
                              return;
                            }
                            handleDecidir(p, "rejeitar");
                          }}
                        >
                          <X className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {historico.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Histórico</h3>
                  {historico.map((p) => (
                    <div key={p.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-medium">
                            {ELIMINACAO_LABELS[p.tipo] || p.tipo}: {p.recursoNome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pedido por {p.requestedBy?.nome || "desconhecido"} · Decidido por {p.decidedBy?.nome || "—"} ·{" "}
                            {new Date(p.createdAt).toLocaleString("pt-PT")}
                          </p>
                        </div>
                        <Badge className={estadoBadge[p.estado].className}>{estadoBadge[p.estado].label}</Badge>
                      </div>
                      {p.observacoes && <p className="text-sm text-muted-foreground mt-1">Observações: {p.observacoes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
