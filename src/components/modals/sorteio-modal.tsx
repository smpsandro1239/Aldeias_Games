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
import { AlertTriangle, CheckCircle, ShieldCheck, Hash, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";

interface SorteioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jogo: { id: string, nome: string, hashSorteio?: string | null } | null;
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
  const [fase, setFase] = useState<'idle' | 'committed' | 'revealed'>('idle');
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    if (open && jogo) {
      setFase(jogo.hashSorteio ? 'committed' : 'idle');
      setResultado(null);
    }
  }, [open, jogo]);

  const handleCommit = async () => {
    if (!jogo) return;
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
    if (!jogo) return;
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
    onOpenChange(false);
  };

  if (!jogo) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent">
            <ShieldCheck className="text-primary" />
            Sorteio Transparente
          </DialogTitle>
          <DialogDescription>
            {jogo.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {fase === 'idle' && (
            <div className="space-y-4">
              <Alert className="bg-primary/5 border-primary/20">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  <strong>Fase 1: Compromisso.</strong> O sistema irá gerar uma seed secreta interna e publicar o seu <strong>Hash SHA-256</strong>.
                  Este hash prova que o sistema não pode alterar o "baralho" após o início do sorteio.
                </AlertDescription>
              </Alert>
              <Button onClick={handleCommit} className="w-full h-12 bg-primary font-bold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Gerar Hash de Compromisso"}
              </Button>
            </div>
          )}

          {fase === 'committed' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-xl border border-primary/20 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hash de Segurança Ativo:</p>
                <p className="text-xs font-mono break-all text-primary bg-primary/5 p-2 rounded border border-primary/10">{jogo.hashSorteio}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSeed" className="font-bold">Seed do Cliente (Transparência Extra)</Label>
                <Input
                  id="clientSeed"
                  placeholder="Ex: Resultado da lotaria local ou palavra aleatória..."
                  value={clientSeed}
                  onChange={(e) => setClientSeed(e.target.value)}
                  className="h-11"
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Esta seed será combinada com a seed secreta para garantir que ninguém pode prever o resultado.
                </p>
              </div>

              <div className="bg-accent/5 p-3 rounded-lg border border-accent/20">
                <p className="text-xs">
                  Participações elegíveis: <strong className="text-accent">{totalParticipacoes}</strong>
                </p>
              </div>

              <Button onClick={handleReveal} className="w-full h-12 bg-accent font-bold" disabled={loading || totalParticipacoes === 0}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "🚀 Revelar Seed e Sortear"}
              </Button>
            </div>
          )}

          {fase === 'revealed' && resultado && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold font-serif italic text-accent">Vencedor Determinado!</h3>
              <div className="p-6 bg-accent/5 rounded-2xl border-2 border-accent/30 shadow-inner">
                <p className="text-xs text-muted-foreground mb-2 uppercase font-bold tracking-tighter">Resultado do Sorteio</p>
                <p className="text-4xl font-serif text-accent font-black tracking-widest">{resultado.resultado}</p>
              </div>

              <div className="text-left space-y-2 p-3 bg-muted rounded-xl text-[9px] font-mono opacity-80">
                <p><span className="text-muted-foreground font-bold">SERVER SEED (REVELADA):</span> {resultado.seedRevelada}</p>
                <p><span className="text-muted-foreground font-bold">CLIENT SEED:</span> {clientSeed || 'nenhuma'}</p>
              </div>

              <Button onClick={handleClose} className="w-full h-11" variant="outline">Fechar e Voltar ao Dashboard</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
