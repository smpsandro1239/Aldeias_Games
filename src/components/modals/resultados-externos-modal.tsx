"use client";

import { useState, useEffect } from "react";
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

interface JogoExterno {
  id: string;
  nome: string;
  detalhesSorteioExterno: string;
  tipo: string;
  estado: string;
  sorteado: boolean;
  evento: { nome: string };
}

interface ResultadosExternosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
}

export function ResultadosExternosModal({
  open,
  onOpenChange,
  token,
}: ResultadosExternosModalProps) {
  const [jogos, setJogos] = useState<JogoExterno[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tipoLoteria, setTipoLoteria] = useState("euromilhoes");
  const [resultados, setResultados] = useState("");
  const [resultadoSubmit, setResultadoSubmit] = useState<{
    success: boolean;
    message: string;
    jogosProcessados?: number;
  } | null>(null);

  useEffect(() => {
    if (open && token) {
      fetchJogos();
    }
  }, [open, token]);

  const fetchJogos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sorteios/externo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setJogos(json.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar jogos externos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!resultados.trim()) return;
    
    setSubmitting(true);
    setResultadoSubmit(null);

    const numeros = resultados.split(/[\s,\n]+/).filter(Boolean);

    try {
      const res = await fetch("/api/sorteios/externo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        fetchJogos();
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
  };

  const jogosNaoSorteados = jogos.filter((j) => !j.sorteado);
  const jogosSorteados = jogos.filter((j) => j.sorteado);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Resultados de Lotarias Externas
          </DialogTitle>
          <DialogDescription>
            Introduza os resultados de lotarias oficiais (EuroMilhões, Totoloto, etc.) 
            para liquidar os jogos associados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!loading && jogos.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
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
                  <Badge key={j.id} variant="outline" className="text-xs">
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
                onChange={(e) => setTipoLoteria(e.target.value)}
              >
                <option value="euromilhoes">EuroMilhões</option>
                <option value="totoloto">Totoloto</option>
                <option value="lotaria">Lotaria Nacional</option>
                <option value="m1lhao">M1lhão</option>
              </select>
            </div>

            <div>
              <Label htmlFor="resultados">
                Números Sorteados (separados por vírgula ou espaço)
              </Label>
              <Input
                id="resultados"
                placeholder="Ex: 12 23 34 45 50"
                value={resultados}
                onChange={(e) => setResultados(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Para EuroMilhões: 5 números principais + 2 estrelas (se aplicável)
              </p>
            </div>
          </div>

          {resultadoSubmit && (
            <Alert variant={resultadoSubmit.success ? "default" : "destructive"}>
              <AlertDescription>
                {resultadoSubmit.message}
              </AlertDescription>
            </Alert>
          )}

          {jogosSorteados.length > 0 && (
            <div className="pt-2">
              <Label className="text-sm font-medium">Já Sorteados</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {jogosSorteados.map((j) => (
                  <Badge key={j.id} variant="secondary" className="text-xs">
                    {j.nome}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !resultados.trim() || jogosNaoSorteados.length === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Processar Resultados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}