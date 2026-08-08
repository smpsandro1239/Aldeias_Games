import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Lock, Dices, Grid3x3, Star, Crown, Users, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { GrelhaWithVencedor, Jogo } from "./euromilhoes-types";

export function estadoBadge(estado: string) {
  switch (estado) {
    case "aberta":
      return (
        <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
          Aberta
        </Badge>
      );
    case "preenchida":
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
          Preenchida
        </Badge>
      );
    case "sorteada":
      return (
        <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30">
          Sorteada
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
}

export function MiniNumberGrid({
  ocupados,
  sorteado,
}: {
  ocupados: number[];
  sorteado?: number | null;
}) {
  const soldSet = new Set(ocupados);
  return (
    <div className="grid grid-cols-10 gap-[3px]">
      {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => {
        const isSold = soldSet.has(num);
        const isDrawn = sorteado === num;
        return (
          <div
            key={num}
            className={`w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-medium transition-colors
              ${
                isDrawn
                  ? "bg-purple-500 text-white ring-2 ring-purple-300"
                  : isSold
                  ? "bg-primary/80 text-primary-foreground"
                  : "bg-muted text-muted-foreground/60"
              }`}
          >
            {num}
          </div>
        );
      })}
    </div>
  );
}

interface StatsProps {
  abertas: number;
  preenchidas: number;
  sorteadas: number;
  total: number;
}

export function EuromilhoesStats({ abertas, preenchidas, sorteadas, total }: StatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center">
              <Grid3x3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{abertas}</p>
              <p className="text-xs text-muted-foreground">Abertas</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{preenchidas}</p>
              <p className="text-xs text-muted-foreground">Preenchidas</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center">
              <Dices className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sorteadas}</p>
              <p className="text-xs text-muted-foreground">Sorteadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface GrelhaCardProps {
  grelha: GrelhaWithVencedor;
  ocupados: number[];
  onFechar: (id: string) => void;
  onSortear: (id: string) => void;
}

export function GrelhaCard({ grelha, ocupados, onFechar, onSortear }: GrelhaCardProps) {
  const soldCount = ocupados.length;
  const totalSlots = 50;
  const percentFilled = Math.round((soldCount / totalSlots) * 100);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              Grelha #{grelha.numero}
            </CardTitle>
            {estadoBadge(grelha.estado)}
          </div>
          <span className="text-xs text-muted-foreground">
            {soldCount}/{totalSlots} números
          </span>
        </div>
        {grelha.premioDescricao && (
          <CardDescription className="flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" />
            {grelha.premioDescricao}
            {grelha.premioValor != null && (
              <span className="font-semibold text-foreground">
                ({formatCurrency(grelha.premioValor)})
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Ocupação</span>
            <span className="font-medium">{percentFilled}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${percentFilled}%` }}
            />
          </div>
        </div>

        {/* Scheduled draw info */}
        {(grelha.sorteioData || grelha.bloqueioData) && (
          <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
            {grelha.sorteioData && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sorteio marcado:</span>
                <span className="font-medium">{new Date(grelha.sorteioData).toLocaleString("pt-PT")}</span>
              </div>
            )}
            {grelha.bloqueioData && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bloqueio:</span>
                <span className="font-medium">{new Date(grelha.bloqueioData).toLocaleString("pt-PT")}</span>
              </div>
            )}
          </div>
        )}

        {/* Mini number grid */}
        <MiniNumberGrid
          ocupados={ocupados}
          sorteado={grelha.numeroSorteado}
        />

        {/* Winner info for sorteada */}
        {grelha.estado === "sorteada" && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                Número sorteado: {grelha.numeroSorteado}
              </span>
            </div>
            {grelha.vencedor && (
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Vencedor:{" "}
                  <strong className="text-foreground">
                    {grelha.vencedor.nome}
                  </strong>
                </span>
              </div>
            )}
            {!grelha.vencedor && (
              <p className="text-sm text-muted-foreground">
                Sem vencedor identificado
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {grelha.estado === "aberta" && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10"
              onClick={() => onFechar(grelha.id)}
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Fechar Grelha
            </Button>
          )}
          {grelha.estado === "preenchida" && (
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => onSortear(grelha.id)}
            >
              <Dices className="w-3.5 h-3.5 mr-1.5" />
              Sortear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface NovaGrelhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jogos: Jogo[];
  formJogoId: string;
  formPremioDescricao: string;
  formPremioValor: string;
  submitting: boolean;
  onJogoId: (id: string) => void;
  onPremioDescricao: (v: string) => void;
  onPremioValor: (v: string) => void;
  onCreate: () => void;
}

export function NovaGrelhaDialog(props: NovaGrelhaDialogProps) {
  const { open, onOpenChange, jogos, formJogoId, formPremioDescricao, formPremioValor, submitting, onJogoId, onPremioDescricao, onPremioValor, onCreate } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-600" />
            Nova Grelha de Euromilhões
          </DialogTitle>
          <DialogDescription>
            Crie uma nova grelha para os jogadores escolherem os seus
            números.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Jogo</Label>
            {jogos.length === 0 ? (
              <Input
                value="Nenhum jogo euromilhoes disponível"
                disabled
              />
            ) : jogos.length === 1 ? (
              <Input value={jogos[0].nome} disabled />
            ) : (
              <Select value={formJogoId} onValueChange={onJogoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar jogo" />
                </SelectTrigger>
                <SelectContent>
                  {jogos.map((jogo) => (
                    <SelectItem key={jogo.id} value={jogo.id}>
                      {jogo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="premio-descricao">Descrição do Prémio</Label>
            <Input
              id="premio-descricao"
              placeholder="Ex: Carro, Viagem, etc."
              value={formPremioDescricao}
              onChange={(e) => onPremioDescricao(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="premio-valor">Valor do Prémio (€)</Label>
            <Input
              id="premio-valor"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={formPremioValor}
              onChange={(e) => onPremioValor(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={onCreate}
            disabled={submitting}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {submitting ? "A criar..." : "Criar Grelha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}