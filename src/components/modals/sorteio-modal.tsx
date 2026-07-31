"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Dice5 } from "lucide-react";
import { LotteryAnimation } from "@/components/games/lottery-animation";
import { motion } from "framer-motion";

interface ResultadoPoio {
  letraVencedora: string;
  numeroVencedor: number;
}

interface ResultadoNumero {
  numeroVencedor: number;
}

type ResultadoSorteio = ResultadoPoio | ResultadoNumero;

interface SorteioData {
  resultado: ResultadoSorteio;
  vencedores: number;
  hash: string;
  seed: string;
}

interface SorteioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jogoNome: string;
  totalParticipacoes: number;
  onExecutarSorteio: (observacoes?: string) => Promise<{
    success: boolean;
    data?: SorteioData;
    error?: string;
  }>;
}

// Type guard for Poio result
function isResultadoPoio(resultado: ResultadoSorteio): resultado is ResultadoPoio {
  return 'letraVencedora' in resultado && 'numeroVencedor' in resultado;
}

export function SorteioModal({
  open,
  onOpenChange,
  jogoNome,
  totalParticipacoes,
  onExecutarSorteio,
}: SorteioModalProps) {
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<SorteioData | null>(null);

  const handleExecutar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await onExecutarSorteio(observacoes);
      if (response.success && response.data) {
        setResultado(response.data);
      }
    } finally {
      setLoading(false);
    }
  }, [observacoes, onExecutarSorteio]);

  const handleClose = useCallback(() => {
    setResultado(null);
    setObservacoes("");
    onOpenChange(false);
  }, [onOpenChange]);

  const handleObservacoesChange = useCallback((value: string) => {
    setObservacoes(value);
  }, []);

  // Helper to compute final result string and animation type
  const getResultDisplay = useCallback((res: ResultadoSorteio) => {
    if (isResultadoPoio(res)) {
      return {
        finalResult: `${res.letraVencedora}${res.numeroVencedor}`,
        type: "coordinate" as const,
      };
    }
    return {
      finalResult: `${res.numeroVencedor}`,
      type: "number" as const,
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="sorteio-modal-description">
        <DialogHeader className="bg-gradient-to-r from-orange-600/10 via-amber-600/10 to-yellow-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-orange-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-orange-600/20 p-2 rounded-lg">
              <Dice5 className="h-5 w-5 text-orange-600" />
            </div>
            Executar Sorteio
          </DialogTitle>
          <DialogDescription id="sorteio-modal-description">
            {jogoNome}
          </DialogDescription>
        </DialogHeader>

        {!resultado ? (
          <>
            <div className="py-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  Total de participações: <strong>{totalParticipacoes}</strong>
                  <br />
                  O sorteio é irreversível e utiliza um algoritmo auditável SHA-256.
                </AlertDescription>
              </Alert>

              <div className="mt-4">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Input
                  id="observacoes"
                  placeholder="Notas sobre o sorteio..."
                  value={observacoes}
                  onChange={(e) => handleObservacoesChange(e.target.value)}
                  aria-describedby="observacoes-description"
                />
                <p id="observacoes-description" className="sr-only">Adicione observações opcionais sobre o sorteio</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleExecutar}
                disabled={loading || totalParticipacoes === 0}
                aria-label={`Executar sorteio com ${totalParticipacoes} participações`}
              >
                {loading ? "A sortear..." : "Executar Sorteio"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-4 space-y-4">
              {(() => {
                const display = getResultDisplay(resultado.resultado);
                return (
                  <LotteryAnimation
                    finalResult={display.finalResult}
                    isSpinning={loading}
                    type={display.type}
                  />
                );
              })()}

              {/* Detalhes aparecem só depois da animação (simulado pelo loading aqui) */}
              {!loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <Alert className="border-green-500">
                    <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                    <AlertDescription className="text-green-700">
                      Sorteio executado com sucesso!
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Vencedores:</h4>
                      <p className="font-bold" aria-label={`${resultado.vencedores} vencedor(es)`}>
                        {resultado.vencedores} vencedor(es)
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <h4 className="text-sm font-medium text-muted-foreground">Audit Hash:</h4>
                      <code
                        className="text-[10px] break-all opacity-70"
                        aria-label={`Hash de auditoria: ${resultado.hash}`}
                      >
                        {resultado.hash.substring(0, 16)}...
                      </code>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
