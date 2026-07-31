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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket, Globe, Loader2, AlertCircle, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

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
        <DialogHeader className="bg-gradient-to-r from-purple-600/10 via-violet-500/10 to-indigo-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-purple-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-purple-600/20 p-2 rounded-lg">
              <Globe className="h-5 w-5 text-purple-600" aria-hidden="true" />
            </div>
            Resultados de Lotarias Externas
          </DialogTitle>
          <DialogDescription id="resultados-externos-description" className="text-base">
            Introduza os resultados de lotarias oficiais (EuroMilhões, Totoloto, etc.)
            para liquidar os jogos associados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {!loading && jogos.length === 0 && (
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Não há jogos externos configurados. Crie um jogo com modo de sorteio &quot;Externo&quot; primeiro.
              </AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          )}

          {!loading && jogosNaoSorteados.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <Label className="text-sm font-semibold text-amber-800 dark:text-amber-200">Jogos Pendentes</Label>
                <Badge variant="outline" className="ml-auto bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">
                  {jogosNaoSorteados.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {jogosNaoSorteados.map((j) => (
                  <Badge key={j.id} variant="outline" className="text-xs bg-white dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300" aria-label={`Jogo pendente: ${j.nome} (${j.detalhesSorteioExterno})`}>
                    {j.nome} ({j.detalhesSorteioExterno})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Inserir Resultados</span>
            </div>

            <div>
              <Label htmlFor="tipoLoteria" className="text-sm font-medium">Lotaria</Label>
              <Select value={tipoLoteria} onValueChange={handleTipoLoteriaChange}>
                <SelectTrigger id="tipoLoteria" className="w-full mt-1" aria-describedby="tipoLoteria-description">
                  <SelectValue placeholder="Selecione a lotaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LOTTERY_TYPES.EUROMILHOES}>EuroMilhões</SelectItem>
                  <SelectItem value={LOTTERY_TYPES.TOTOLOTO}>Totoloto</SelectItem>
                  <SelectItem value={LOTTERY_TYPES.LOTARIA}>Lotaria Nacional</SelectItem>
                  <SelectItem value={LOTTERY_TYPES.M1LHAO}>M1lhão</SelectItem>
                </SelectContent>
              </Select>
              <p id="tipoLoteria-description" className="sr-only">Selecione o tipo de lotaria para processar os resultados</p>
            </div>

            <div>
              <Label htmlFor="resultados" className="text-sm font-medium">
                Números Sorteados
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
            <Alert variant={resultadoSubmit.success ? "default" : "destructive"} className={resultadoSubmit.success ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : ""}>
              {resultadoSubmit.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription aria-live="polite">
                {resultadoSubmit.message}
                {resultadoSubmit.jogosProcessados && ` (${resultadoSubmit.jogosProcessados} jogos processados)`}
              </AlertDescription>
            </Alert>
          )}

          {!loading && jogosSorteados.length > 0 && (
            <div className="rounded-xl p-4 border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <Label className="text-sm font-semibold text-green-800 dark:text-green-200">Já Sorteados</Label>
                <Badge variant="outline" className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                  {jogosSorteados.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {jogosSorteados.map((j) => (
                  <Badge key={j.id} variant="secondary" className="text-xs bg-white dark:bg-green-950/40 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300" aria-label={`Jogo já sorteado: ${j.nome}`}>
                    {j.nome}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !resultados.trim() || jogosNaoSorteados.length === 0}
            aria-label={`Processar resultados da lotaria ${tipoLoteria}`}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Processar Resultados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
