"use client";

import { apiRequest } from "@/lib/api-client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LayoutHeader } from "@/components/layout-header";
import { LoaderScreen } from "@/components/loader-screen";
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
import {
  Trophy,
  Plus,
  RefreshCw,
  Lock,
  Dices,
  Grid3x3,
  Star,
  Crown,
  Users,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  estado: string;
}

interface Grelha {
  id: string;
  jogoId: string;
  numero: number;
  estado: "aberta" | "preenchida" | "sorteada";
  numerosOcupados: string;
  premioDescricao: string | null;
  premioValor: number | null;
  dataFecho: string | null;
  dataSorteio: string | null;
  sorteioData: string | null;
  bloqueioData: string | null;
  numeroSorteado: number | null;
  vencedorId: string | null;
  createdAt: string;
}

interface GrelhaWithVencedor extends Grelha {
  vencedor?: { id: string; nome: string } | null;
}

const POLL_INTERVAL = 10000;

function estadoBadge(estado: string) {
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

function MiniNumberGrid({
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

const AdminEuromilhoesPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setReady(true);
    } catch {
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready || isLoading) {
    return <LoaderScreen message="A carregar" />;
  }

  return (
    <RoleGuard
      allowedRoles={["super_admin", "aldeia_admin"]}
      redirectPath="/"
      panelName="Euromilhões"
    >
      <LayoutHeader>
        <AdminEuromilhoes token="" />
      </LayoutHeader>
    </RoleGuard>
  );
};

function AdminEuromilhoes({ token }: { token: string }) {
  const [grelhas, setGrelhas] = useState<GrelhaWithVencedor[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaGrelhaOpen, setNovaGrelhaOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formJogoId, setFormJogoId] = useState("");
  const [formPremioDescricao, setFormPremioDescricao] = useState("");
  const [formPremioValor, setFormPremioValor] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [grelhasRes, jogosRes] = await Promise.all([
        apiRequest("/api/euromilhoes/grelhas", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest("/api/jogos?tipo=euromilhoes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (grelhasRes.ok) {
        const data = await grelhasRes.json();
        setGrelhas(data.data ?? data);
      }
      if (jogosRes.ok) {
        const data = await jogosRes.json();
        setJogos(data.data ?? data);
      }
    } catch {
      toast.error("Erro ao carregar dados de Euromilhões");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (jogos.length === 1 && !formJogoId) {
      setFormJogoId(jogos[0].id);
    }
  }, [jogos, formJogoId]);

  useEffect(() => {
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleFechar = async (grelhaId: string) => {
    try {
      const res = await apiRequest(
        `/api/euromilhoes/grelhas/${grelhaId}/fechar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        toast.success("Grelha fechada com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao fechar grelha");
      }
    } catch {
      toast.error("Erro ao fechar grelha");
    }
  };

  const handleSortear = async (grelhaId: string) => {
    try {
      const res = await apiRequest(
        `/api/euromilhoes/grelhas/${grelhaId}/sortear`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        toast.success("Sorteio realizado com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao sortear grelha");
      }
    } catch {
      toast.error("Erro ao sortear grelha");
    }
  };

  const handleCriarGrelha = async () => {
    if (!formJogoId) {
      toast.error("Selecione um jogo");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest("/api/euromilhoes/grelhas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jogoId: formJogoId,
          premioDescricao: formPremioDescricao || undefined,
          premioValor: formPremioValor ? parseFloat(formPremioValor) : undefined,
        }),
      });
      if (res.ok) {
        toast.success("Grelha criada com sucesso!");
        setNovaGrelhaOpen(false);
        setFormJogoId("");
        setFormPremioDescricao("");
        setFormPremioValor("");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar grelha");
      }
    } catch {
      toast.error("Erro ao criar grelha");
    } finally {
      setSubmitting(false);
    }
  };

  const parseOcupados = (raw: string): number[] => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(Number);
      return [];
    } catch {
      return [];
    }
  };

  const abertas = grelhas.filter((g) => g.estado === "aberta");
  const preenchidas = grelhas.filter((g) => g.estado === "preenchida");
  const sorteadas = grelhas.filter((g) => g.estado === "sorteada");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-indigo-500/10 rounded-3xl p-6 border border-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold">
                Gestão de Euromilhões
              </h1>
              <p className="text-muted-foreground font-medium">
                Criar e gerir grelhas de apostas do Euromilhões
              </p>
            </div>
          </div>
          <Button
            onClick={() => setNovaGrelhaOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Grelha
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/15 rounded-xl flex items-center justify-center">
                <Grid3x3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{abertas.length}</p>
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
                <p className="text-2xl font-bold">{preenchidas.length}</p>
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
                <p className="text-2xl font-bold">{sorteadas.length}</p>
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
                <p className="text-2xl font-bold">{grelhas.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Grid list */}
      {grelhas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-lg">
              Nenhuma grelha de Euromilhões encontrada
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Crie uma nova grelha para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grelhas.map((grelha) => {
            const ocupados = parseOcupados(grelha.numerosOcupados);
            const soldCount = ocupados.length;
            const totalSlots = 50;
            const percentFilled = Math.round((soldCount / totalSlots) * 100);

            return (
              <Card
                key={grelha.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
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
                        onClick={() => handleFechar(grelha.id)}
                      >
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        Fechar Grelha
                      </Button>
                    )}
                    {grelha.estado === "preenchida" && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleSortear(grelha.id)}
                      >
                        <Dices className="w-3.5 h-3.5 mr-1.5" />
                        Sortear
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Nova Grelha Dialog */}
      <Dialog open={novaGrelhaOpen} onOpenChange={setNovaGrelhaOpen}>
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
                <Select value={formJogoId} onValueChange={setFormJogoId}>
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
                onChange={(e) => setFormPremioDescricao(e.target.value)}
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
                onChange={(e) => setFormPremioValor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNovaGrelhaOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCriarGrelha}
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? "A criar..." : "Criar Grelha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminEuromilhoesPage;
