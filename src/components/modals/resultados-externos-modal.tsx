"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Ticket, Globe, Loader2, AlertCircle } from "lucide-react";

// Constants for lottery types
const LOTTERY_TYPES = {
  EUROMILHOES: 'euromilhoes',
  TOTOLOTO: 'totoloto',
  LOTARIA: 'lotaria',
  M1LHAO: 'm1lhao'
} as const;

type LotteryType = typeof LOTTERY_TYPES[keyof typeof LOTTERY_TYPES];

interface JogoExterno {
  id: string;
  nome: string;
  detalhesSorteioExterno: string;
  tipo: string;
  estado: string;
  sorteado: boolean;
  evento: { nome: string };
}

interface SubmitResult {
  success: boolean;
  message: string;
  jogosProcessados?: number;
}

interface ResultadosExternosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useJogosExternos(open: boolean) {
  const [jogos, setJogos] = useState<JogoExterno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    const fetchJogos = async () => {
      setLoading(true);
      try {
        const res = await apiRequest("/api/sorteios/externo");
        if (res.ok) {
          const json = await res.json();
          setJogos(json.data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar jogos externos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJogos();
  }, [open]);

  const refetch = useCallback(async () => {
    try {
      const res = await apiRequest("/api/sorteios/externo");
      if (res.ok) {
        const json = await res.json();
        setJogos(json.data || []);
      }
    } catch (error) {
      console.error("Erro ao recarregar jogos externos:", error);
    }
  }, []);

  return { jogos, loading, refetch };
}

export function ResultadosExternosModal({
  open,
  onOpenChange,
}: ResultadosExternosModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [tipoLoteria, setTipoLoteria] = useState<LotteryType>(LOTTERY_TYPES.EUROMILHOES);
  const [resultados, setResultados] = useState("");
  const [resultadoSubmit, setResultadoSubmit] = useState<SubmitResult | null>(null);

  const { jogos, loading, refetch } = useJogosExternos(open);

  const jogosNaoSorteados = useMemo(() => jogos.filter((j) => !j.sorteado), [jogos]);
  const jogosSorteados = useMemo(() => jogos.filter((j) => j.sorteado), [jogos]);

  const handleSubmit = useCallback(async () => {
    if (!resultados.trim()) return;

    setSubmitting(true);
    setResultadoSubmit(null);

    const numeros = resultados.split(/[\s,\n]+/).filter(Boolean);

    try {
      const res = await apiRequest("/api/sorteios/externo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipoLoteria,
          resultados: numeros,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setResultadoSubmit({
          success: true,
          message: json.message,
          jogosProcessados: json.data?.length || 0,
        });
        setResultados("");
        refetch();
      } else {
        setResultadoSubmit({
          success: false,
          message: json.error || "Erro ao processar resultados",
        });
      }
    } catch (error) {
      setResultadoSubmit({
        success: false,
        message: "Erro ao processar resultados",
      });
    } finally {
      setSubmitting(false);
    }
  }, [resultados, tipoLoteria, refetch]);

  const handleTipoLoteriaChange = useCallback((value: string) => {
    setTipoLoteria(value as LotteryType);
  }, []);

  const handleResultadosChange = useCallback((value: string) => {
    setResultados(value);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" aria-describedby="resultados-externos-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" aria-hidden="true" />
            Resultados de Lotarias Externas
          </DialogTitle>
          <DialogDescription id="resultados-externos-description">
            Introduza os resultados de lotarias oficiais (EuroMilhões, Totoloto, etc.)
            para liquidar os jogos associados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!loading && jogos.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Não há jogos externos configurados. Crie um jogo com modo de sorteio "Externo" primeiro.
              </AlertDescription>
            </Alert>
          )}

          {jogosNaoSorteados.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Jogos Pendentes</Label>
              <div className="flex flex-wrap gap-2">
                {jogosNaoSorteados.map((j) => (
                  <Badge key={j.id} variant="outline" className="text-xs" aria-label={`Jogo pendente: ${j.nome} (${j.detalhesSorteioExterno})`}>
                    {j.nome} ({j.detalhesSorteioExterno})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2 border-t">
            <div>
              <Label htmlFor="tipoLoteria">Lotaria</Label>
              <select
                id="tipoLoteria"
                className="w-full mt-1 p-2 border rounded-md"
                value={tipoLoteria}
                onChange={(e) => handleTipoLoteriaChange(e.target.value)}
                aria-describedby="tipoLoteria-description"
              >
                <option value={LOTTERY_TYPES.EUROMILHOES}>EuroMilhões</option>
                <option value={LOTTERY_TYPES.TOTOLOTO}>Totoloto</option>
                <option value={LOTTERY_TYPES.LOTARIA}>Lotaria Nacional</option>
                <option value={LOTTERY_TYPES.M1LHAO}>M1lhão</option>
              </select>
              <p id="tipoLoteria-description" className="sr-only">Selecione o tipo de lotaria para processar os resultados</p>
            </div>

            <div>
              <Label htmlFor="resultados">
                Números Sorteados (separados por vírgula ou espaço)
              </Label>
              <Input
                id="resultados"
                placeholder="Ex: 12 23 34 45 50"
                value={resultados}
                onChange={(e) => handleResultadosChange(e.target.value)}
                className="mt-1"
                aria-describedby="resultados-description"
              />
              <p id="resultados-description" className="text-xs text-muted-foreground mt-1">
                Para EuroMilhões: 5 números principais + 2 estrelas (se aplicável)
              </p>
            </div>
          </div>

          {resultadoSubmit && (
            <Alert variant={resultadoSubmit.success ? "default" : "destructive"}>
              <AlertDescription aria-live="polite">
                {resultadoSubmit.message}
                {resultadoSubmit.jogosProcessados && ` (${resultadoSubmit.jogosProcessados} jogos processados)`}
              </AlertDescription>
            </Alert>
          )}

          {jogosSorteados.length > 0 && (
            <div className="pt-2">
              <Label className="text-sm font-medium">Já Sorteados</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {jogosSorteados.map((j) => (
                  <Badge key={j.id} variant="secondary" className="text-xs" aria-label={`Jogo já sorteado: ${j.nome}`}>
                    {j.nome}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !resultados.trim() || jogosNaoSorteados.length === 0}
            aria-label={`Processar resultados da lotaria ${tipoLoteria}`}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Processar Resultados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}