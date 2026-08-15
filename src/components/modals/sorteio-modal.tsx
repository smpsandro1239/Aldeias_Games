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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, Dice5, Lock, Unlock } from "lucide-react";
import { LotteryAnimation } from "@/components/games/lottery-animation";
import { apiRequest } from "@/lib/api-client";
import { motion } from "framer-motion";

interface RevealResult {
  vencedorId: string;
  vencedorNome: string;
  resultado: string | number | null;
  dryRun?: boolean;
  notificados?: number;
}

interface SorteioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jogoNome: string;
  jogoId: string;
  jogoTipo: string;
  totalParticipacoes: number;
  onSorteado: () => void;
}

function gerarSeedCliente(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashClientSeed(clientSeed: string): Promise<string> {
  const data = new TextEncoder().encode(`clientSeed:${clientSeed}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function SorteioModal({
  open,
  onOpenChange,
  jogoNome,
  jogoId,
  jogoTipo,
  totalParticipacoes,
  onSorteado,
}: SorteioModalProps) {
  const [fase, setFase] = useState<"commit" | "reveal" | "done">("commit");
  const [loading, setLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [clientSeed, setClientSeed] = useState("");
  const [commitHash, setCommitHash] = useState("");
  const [resultado, setResultado] = useState<RevealResult | null>(null);

  const handleCommit = useCallback(async () => {
    setLoading(true);
    try {
      const seed = gerarSeedCliente();
      const commit = await hashClientSeed(seed);
      const res = await apiRequest("/api/sorteios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jogoId, action: "commit", clientSeedCommit: commit }),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = json?.error || "Erro ao comprometer o sorteio";
        alert(err);
        return;
      }
      setClientSeed(seed);
      setCommitHash(json.hash || commit);
      setFase("reveal");
    } finally {
      setLoading(false);
    }
  }, [jogoId]);

  const handleReveal = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/sorteios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jogoId, clientSeed, dryRun }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error || "Erro ao revelar o sorteio");
        return;
      }
      setResultado({
        vencedorId: json.vencedorId,
        vencedorNome: json.vencedorNome || "Desconhecido",
        resultado: json.resultado ?? null,
        dryRun: json.dryRun === true,
        notificados: json.notificados,
      });
      setFase("done");
      if (dryRun !== true) onSorteado();
    } finally {
      setLoading(false);
    }
  }, [jogoId, clientSeed, dryRun, onSorteado]);

  const handleClose = useCallback(() => {
    setFase("commit");
    setResultado(null);
    setCommitHash("");
    setClientSeed("");
    setDryRun(true);
    onOpenChange(false);
  }, [onOpenChange]);

  const eEuromilhoes = jogoTipo === "euromilhoes";

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
            {jogoNome} — fluxo provably-fair (commit + reveal)
          </DialogDescription>
        </DialogHeader>

        {fase === "commit" && (
          <>
            <div className="py-4 space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  Total de participações: <strong>{totalParticipacoes}</strong>
                  <br />
                  Passo 1: o sistema compromete a seed do servidor (hash SHA-256 público).
                  Passo 2: revela a seed e determina o vencedor.
                </AlertDescription>
              </Alert>

              {eEuromilhoes && (
                <Alert className="bg-primary/10 border-primary/20">
                  <AlertDescription className="text-primary">
                    Para o Euromilhões poderás usar a grelha (sorteio dedicado) ou este fluxo
                    genérico com um número 1-50.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between rounded-xl border border-outline-variant/20 p-3">
                <div>
                  <Label htmlFor="dryRun">Modo simulação (dry run)</Label>
                  <p className="text-xs text-muted-foreground">Não altera dados reais — não persiste vencedores.</p>
                </div>
                <Switch id="dryRun" checked={dryRun} onCheckedChange={setDryRun} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCommit}
                disabled={loading || totalParticipacoes === 0}
              >
                <Lock className="h-4 w-4 mr-2" />
                {loading ? "A comprometer..." : "1. Comprometer sorteio"}
              </Button>
            </DialogFooter>
          </>
        )}

        {fase === "reveal" && (
          <>
            <div className="py-4 space-y-4">
              <Alert className="border-green-500/40">
                <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                <AlertDescription className="text-green-700">
                  Compromisso registado. Hash:{" "}
                  <code className="text-[10px] break-all opacity-80">{commitHash.substring(0, 32)}...</code>
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                A seed do cliente está guardada apenas neste browser. Revelar agora utiliza
                {dryRun ? " modo simulação (nada é gravado)." : " o sorteio real (gravado e irreversível)."}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleReveal} disabled={loading}>
                <Unlock className="h-4 w-4 mr-2" />
                {loading ? "A revelar..." : "2. Revelar resultado"}
              </Button>
            </DialogFooter>
          </>
        )}

        {fase === "done" && resultado && (
          <>
            <div className="py-4 space-y-4">
              <LotteryAnimation
                finalResult={String(resultado.resultado ?? "-")}
                isSpinning={loading}
                type={jogoTipo === "poio_da_vaca" ? "coordinate" : "number"}
              />

              {!loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {resultado.dryRun ? (
                    <Alert className="border-amber-500/60">
                      <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
                      <AlertDescription className="text-amber-700">
                        Simulação (dry run) — nenhum vencedor foi persistido.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-green-500">
                      <CheckCircle className="h-4 w-4 text-primary" aria-hidden="true" />
                      <AlertDescription className="text-green-700">
                        Sorteio executado com sucesso!{" "}
                        {resultado.notificados !== undefined && `${resultado.notificados} participante(s) notificado(s).`}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Vencedor:</h4>
                      <p className="font-bold" aria-label={`Vencedor: ${resultado.vencedorNome}`}>
                        {resultado.vencedorNome}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-muted-foreground">Resultado:</h4>
                      <p className="text-2xl font-headline font-bold text-primary" aria-label={`Resultado: ${resultado.resultado}`}>
                        {resultado.resultado ?? "-"}
                      </p>
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