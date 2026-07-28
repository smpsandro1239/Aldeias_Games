"use client";

import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApostaConfirmada } from "./poio-types";

interface PoioConfirmationDialogProps {
  apostaConfirmada: ApostaConfirmada | null;
  onClose: () => void;
}

export function PoioConfirmationDialog({ apostaConfirmada, onClose }: PoioConfirmationDialogProps) {
  return (
    <Dialog open={!!apostaConfirmada} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-surface-container border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Aposta Registada!
          </DialogTitle>
        </DialogHeader>
        {apostaConfirmada && (
          <div className="space-y-4 py-2">
            <div className="text-center space-y-2">
              <div className="text-4xl">🐄</div>
              <h3 className="text-lg font-bold">Poio da Vaca</h3>
              <p className="text-sm text-muted-foreground">Jogador: {apostaConfirmada.nome}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Coordenadas Escolhidas</p>
              <div className="flex flex-wrap gap-1.5">
                {apostaConfirmada.labels.split(", ").map((label, i) => (
                  <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20">
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
              <span className="text-xs text-muted-foreground">Estado do Pagamento</span>
              <Badge className={apostaConfirmada.pago ? "bg-green-500/20 text-green-700" : "bg-amber-500/20 text-amber-700"}>
                {apostaConfirmada.pago ? "Pago" : "Pendente"}
              </Badge>
            </div>
            <Button onClick={onClose} className="w-full">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
