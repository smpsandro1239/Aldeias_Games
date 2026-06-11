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
import { AlertTriangle, CheckCircle, ShieldCheck, Hash } from "lucide-react";
import { LotteryAnimation } from "@/components/games/lottery-animation";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";

interface SorteioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jogo: { id: string, nome: string, hashSorteio?: string | null };
  totalParticipacoes: number;
  onSuccess: () => void;
}

export function SorteioModal({
  open,
  onOpenChange,
  jogo,
  totalParticipacoes,
  onSuccess,
}: SorteioModalProps) {
  const [clientSeed, setClientSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [fase, setFase] = useState<'idle' | 'committed' | 'revealed'>(jogo.hashSorteio ? 'committed' : 'idle');
  const [resultado, setResultado] = useState<any>(null);

  const handleCommit = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/sorteios', {
        method: 'PATCH',
        body: JSON.stringify({ jogoId: jogo.id, action: 'commit' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Seed comprometida com sucesso!");
        setFase('committed');
        onSuccess();
      } else {
        toast.error(data.error || "Erro ao comprometer sorteio");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/api/sorteios', {
        method: 'POST',
        body: JSON.stringify({ jogoId: jogo.id, clientSeed })
      });
      const data = await res.json();
      if (res.ok) {
        setResultado(data);
        setFase('revealed');
        toast.success("Sorteio realizado com sucesso!");
        onSuccess();
      } else {
        toast.error(data.error || "Erro ao realizar sorteio");
      }
    } catch (e) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (fase !== 'revealed') {
      setFase(jogo.hashSorteio ? 'committed' : 'idle');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            Sorteio Provavelmente Justo
          </DialogTitle>
          <DialogDescription>
            {jogo.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {fase === 'idle' && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Fase 1: Compromisso. O sistema irá gerar uma seed secreta e publicar o seu Hash.
                  Isto garante que o resultado não pode ser alterado após o início.
                </AlertDescription>
              </Alert>
              <Button onClick={handleCommit} className="w-full" disabled={loading}>
                {loading ? "A processar..." : "Gerar Hash de Compromisso"}
              </Button>
            </div>
          )}

          {fase === 'committed' && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg border border-primary/20">
                <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Hash Público de Compromisso:</p>
                <p className="text-xs font-mono break-all font-bold text-primary">{jogo.hashSorteio}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSeed">Seed do Cliente (Opcional)</Label>
                <Input
                  id="clientSeed"
                  placeholder="Ex: Palavra aleatória ou timestamp..."
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Esta seed será combinada com a seed do servidor para garantir que o resultado é imprevisível.
                </p>
              </div>

              <Alert className="bg-primary/5 border-primary/20">
                <AlertDescription className="text-xs">
                  Participações confirmadas: <strong>{totalParticipacoes}</strong>.
                  Ao clicar em "Executar", a seed secreta será revelada e o vencedor determinado.
                </AlertDescription>
              </Alert>

              <Button onClick={handleReveal} className="w-full" disabled={loading || totalParticipacoes === 0}>
                {loading ? "A sortear..." : "🚀 Revelar e Sortear"}
              </Button>
            </div>
          )}

          {fase === 'revealed' && resultado && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold">Sorteio Concluído!</h3>
              <div className="p-4 bg-accent/5 rounded-xl border-2 border-accent/20">
                <p className="text-sm text-muted-foreground mb-1 uppercase font-bold tracking-widest">Resultado</p>
                <p className="text-3xl font-serif text-accent font-bold">{resultado.resultado}</p>
              </div>

              <div className="text-left space-y-2 p-3 bg-muted rounded-lg text-[10px] font-mono">
                <p><span className="text-muted-foreground">Server Seed:</span> {resultado.seedRevelada}</p>
                <p><span className="text-muted-foreground">Final Hash:</span> {resultado.hashFinal}</p>
              </div>

              <Button onClick={handleClose} className="w-full" variant="outline">Fechar</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
