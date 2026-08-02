"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Hash,
  Calendar,
  User,
  Store,
  Trophy,
  Check,
  Loader2,
  Hash as HashIcon,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface NumeroParticipacao {
  id: string;
  nomeCliente: string;
  telefoneCliente: string | null;
  vendedor: string | null;
  data: string;
  valorPago: number;
  metodoPagamento: string;
  estadoPagamento: string;
  ganhador: boolean;
  premioEntregue: boolean;
  hash: string | null;
}

interface NumeroInfoData {
  numero: number;
  jogoNome: string;
  participacoes: NumeroParticipacao[];
  totalParticipacoes: number;
}

interface NumeroInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: NumeroInfoData | null;
  loading?: boolean;
}

function metodoLabel(metodo: string) {
  switch (metodo) {
    case "saldo": return "Saldo";
    case "dinheiro": return "Dinheiro";
    case "mbway": return "MBWay";
    case "stripe": return "Stripe";
    case "transferencia": return "Transferência";
    default: return metodo;
  }
}

function estadoLabel(estado: string) {
  switch (estado) {
    case "concluido": return "Concluído";
    case "pendente": return "Pendente";
    case "cancelado": return "Cancelado";
    default: return estado;
  }
}

export function NumeroInfoModal({
  open,
  onOpenChange,
  data,
  loading = false,
}: NumeroInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface-container border-primary/20 max-h-[90vh] overflow-y-auto z-[60]">
        <DialogHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-primary/20">
          <DialogTitle className="flex items-center gap-2 text-center justify-center text-xl">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            Número {data ? data.numero.toString().padStart(3, "0") : ""}
          </DialogTitle>
        </DialogHeader>

        {loading && !data && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {data && (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold">{data.jogoNome}</h3>
              <Badge variant="secondary" className="text-xs">
                {data.totalParticipacoes === 1
                  ? "1 participação com este número"
                  : `${data.totalParticipacoes} participações com este número`}
              </Badge>
            </div>

            {data.participacoes.map((p) => (
              <div
                key={p.id}
                className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary" />
                    {p.nomeCliente}
                  </span>
                  {p.ganhador ? (
                    <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-xs">
                      <Trophy className="h-3 w-3 mr-1" /> GANHADOR
                    </Badge>
                  ) : p.premioEntregue ? (
                    <Badge className="bg-green-500/20 text-green-700 text-xs">
                      <Check className="h-3 w-3 mr-1" /> Prémio Entregue
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {estadoLabel(p.estadoPagamento)}
                    </Badge>
                  )}
                </div>

                {p.telefoneCliente && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Telefone</span>
                    <span className="font-medium">{p.telefoneCliente}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Data
                  </span>
                  <span>{formatDateTime(p.data)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Valor Pago</span>
                  <span className="font-bold text-primary">{formatCurrency(p.valorPago)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Método</span>
                  <span className="font-medium">{metodoLabel(p.metodoPagamento)}</span>
                </div>

                {p.vendedor && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Store className="h-3 w-3" /> Vendedor
                    </span>
                    <span className="font-medium">{p.vendedor}</span>
                  </div>
                )}

                {p.hash && (
                  <div className="bg-primary/5 border border-primary/10 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <HashIcon className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-semibold text-primary">Hash</span>
                    </div>
                    <p className="font-mono text-[10px] break-all select-all">
                      {p.hash.slice(0, 32)}…
                    </p>
                  </div>
                )}
              </div>
            ))}

            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
