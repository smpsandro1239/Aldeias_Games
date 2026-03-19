"use client";

import { useState } from "react";
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
import { AlertTriangle, CheckCircle } from "lucide-react";

interface SorteioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jogoNome: string;
  totalParticipacoes: number;
  onExecutarSorteio: (observacoes?: string) => Promise<{
    success: boolean;
    data?: {
      resultado: Record<string, unknown>;
      vencedores: number;
      hash: string;
      seed: string;
    };
    error?: string;
  }>;
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
  const [resultado, setResultado] = useState<{
    resultado: Record<string, unknown>;
    vencedores: number;
    hash: string;
    seed: string;
  } | null>(null);

  const handleExecutar = async () => {
    setLoading(true);
    const response = await onExecutarSorteio(observacoes);
    setLoading(false);

    if (response.success && response.data) {
      setResultado(response.data);
    }
  };

  const handleClose = () => {
    setResultado(null);
    setObservacoes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Executar Sorteio</DialogTitle>
          <DialogDescription>
            {jogoNome}
          </DialogDescription>
        </DialogHeader>

        {!resultado ? (
          <>
            <div className="py-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
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
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleExecutar} disabled={loading || totalParticipacoes === 0}>
                {loading ? "A sortear..." : "Executar Sorteio"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-4 space-y-4">
              <Alert className="border-green-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  Sorteio executado com sucesso!
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">Resultado:</h4>
                <div className="bg-muted p-3 rounded-lg">
                  {resultado.resultado.numeroVencedor && (
                    <p className="text-2xl font-bold text-center">
                      Número {resultado.resultado.numeroVencedor}
                    </p>
                  )}
                  {resultado.resultado.letraVencedora && (
                    <p className="text-2xl font-bold text-center">
                      {resultado.resultado.letraVencedora}{resultado.resultado.numeroVencedor}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Vencedores:</h4>
                <p>{resultado.vencedores} vencedor(es)</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Hash de Auditoria:</h4>
                <code className="block bg-muted p-2 rounded text-xs break-all">
                  {resultado.hash}
                </code>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Seed:</h4>
                <code className="block bg-muted p-2 rounded text-xs break-all">
                  {resultado.seed}
                </code>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
