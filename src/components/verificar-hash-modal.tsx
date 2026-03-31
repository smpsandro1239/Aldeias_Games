"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Copy, Search, Award, User, Calendar, Hash } from "lucide-react";
import { toast } from "sonner";

interface VerificarHashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
}

interface VerificacaoResult {
  valido: boolean;
  participacao?: {
    id: string;
    jogo: string;
    tipoJogo: string;
    valorPago: number;
    createdAt: string;
    resultado: string;
    cliente: string;
    telefone: string;
    premioEntregue: boolean;
    aldeia: string;
  };
  mensagem: string;
}

export function VerificarHashModal({ open, onOpenChange, token }: VerificarHashModalProps) {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<VerificacaoResult | null>(null);

  const verificarHash = async () => {
    if (!hash.trim()) {
      toast.error("Introduza um hash para verificar");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/participacoes/verificar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hash: hash.trim() }),
      });

      const data = await res.json();
      setResultado(data);
    } catch (error) {
      toast.error("Erro ao verificar hash");
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = () => {
    if (resultado?.participacao?.id) {
      navigator.clipboard.writeText(resultado.participacao.id);
      toast.success("ID copiado!");
    }
  };

  const limpar = () => {
    setHash("");
    setResultado(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      limpar();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Verificar Participação
          </DialogTitle>
          <DialogDescription>
            Introduza o hash de uma participação para verificar a sua autenticidade antes de entregar o prémio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Introduza o hash SHA-256..."
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verificarHash()}
              className="flex-1"
            />
            <Button onClick={verificarHash} disabled={loading || !hash.trim()}>
              {loading ? (
                <span className="animate-spin">⟳</span>
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {resultado && (
            <div className={`rounded-xl border-2 p-4 space-y-3 ${
              resultado.valido 
                ? "border-green-500/30 bg-green-500/10" 
                : "border-red-500/30 bg-red-500/10"
            }`}>
              <div className="flex items-center gap-2">
                {resultado.valido ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                <span className={`font-bold ${resultado.valido ? "text-green-500" : "text-red-500"}`}>
                  {resultado.mensagem}
                </span>
              </div>

              {resultado.participacao && (
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jogo:</span>
                    <span className="font-medium">{resultado.participacao.jogo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium">{resultado.participacao.tipoJogo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-medium">{resultado.participacao.valorPago.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium">
                      {new Date(resultado.participacao.createdAt).toLocaleString("pt-PT")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente:</span>
                    <span className="font-medium">{resultado.participacao.cliente || "Anónimo"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="font-medium">{resultado.participacao.telefone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aldeia:</span>
                    <span className="font-medium">{resultado.participacao.aldeia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prémio Entregue:</span>
                    <span className={`font-medium ${resultado.participacao.premioEntregue ? "text-green-500" : "text-yellow-500"}`}>
                      {resultado.participacao.premioEntregue ? "Sim" : "Não"}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-current/20">
                    <div className="text-muted-foreground text-xs mb-1">Resultado/Jogada:</div>
                    <div className="font-mono text-xs bg-black/20 p-2 rounded break-all">
                      {typeof resultado.participacao.resultado === 'object' 
                        ? JSON.stringify(resultado.participacao.resultado)
                        : resultado.participacao.resultado
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
