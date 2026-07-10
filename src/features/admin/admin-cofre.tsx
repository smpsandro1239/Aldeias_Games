"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Banknote, Send, Check, X, Clock, RefreshCw, History, ShieldCheck } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface DepositoData {
  id: string;
  valor: number;
  descricao: string | null;
  estado: string;
  createdAt: string;
  confirmadoAt: string | null;
  vendedor: { id: string; nome: string };
  criadoPor: { id: string; nome: string };
  confirmadoPor: { id: string; nome: string } | null;
}

interface VaultData {
  saldo: number;
  transacoes: Array<{
    id: string;
    tipo: string;
    valor: number;
    descricao: string;
    estado: string;
    dataCriacao: string;
    criadoPor: { nome: string };
    aprovadoPor: { nome: string } | null;
  }>;
}

export function AdminCofre({ token }: { token: string }) {
  const [depositos, setDepositos] = useState<DepositoData[]>([]);
  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pendentes");

  const fetchData = useCallback(async () => {
    try {
      const [depRes, vaultRes] = await Promise.all([
        apiRequest("/api/cofre/pedido-deposito", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest("/api/cofre/historico", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (depRes.ok) {
        const data = await depRes.json();
        setDepositos(data.data);
      }
      if (vaultRes.ok) {
        const data = await vaultRes.json();
        setVault(data.data);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados do cofre");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirmar = async (id: string) => {
    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ acao: "confirmar" })
      });

      if (res.ok) {
        toast.success("Depósito confirmado com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao confirmar depósito");
      }
    } catch (error) {
      toast.error("Erro ao confirmar depósito");
    }
  };

  const handleRejeitar = async (id: string) => {
    const motivo = window.prompt("Motivo da rejeição:");
    if (!motivo) return;

    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ acao: "rejeitar", observacoes: motivo })
      });

      if (res.ok) {
        toast.success("Depósito rejeitado");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao rejeitar depósito");
      }
    } catch (error) {
      toast.error("Erro ao rejeitar depósito");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const pendentes = depositos.filter(d => d.estado === 'pendente');
  const confirmados = depositos.filter(d => d.estado === 'confirmado');
  const rejeitados = depositos.filter(d => d.estado === 'rejeitado');

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-green-500/10 via-green-500/5 to-emerald-500/10 rounded-3xl p-6 border border-green-500/10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold">Gestão do Cofre</h1>
            <p className="text-muted-foreground font-medium">
              Transparência total na movimentação de fundos da aldeia
            </p>
          </div>
        </div>
      </div>

      {/* Saldo do Cofre */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Saldo do Cofre da Aldeia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(vault?.saldo || 0)}
          </p>
          <p className="text-sm text-green-700/80 dark:text-green-300/80 mt-1">
            Dinheiro físico guardado no cofre
          </p>
        </CardContent>
      </Card>

      {/* Pendentes e Histórico */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pendentes" className="relative">
              Pendentes
              {pendentes.length > 0 && (
                <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs">
                  {pendentes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmados">Confirmados</TabsTrigger>
            <TabsTrigger value="rejeitados">Rejeitados</TabsTrigger>
            <TabsTrigger value="historico">Movimentos</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <TabsContent value="pendentes" className="space-y-3 mt-4">
          {pendentes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Send className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum pedido de depósito pendente</p>
              </CardContent>
            </Card>
          ) : (
            pendentes.map((dep) => (
              <Card key={dep.id} className="border-accent/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{formatCurrency(dep.valor)}</p>
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                          <Clock className="w-3 h-3 mr-1" />
                          PENDENTE
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dep.descricao || "Depósito"}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Vendedor: <strong>{dep.vendedor.nome}</strong></span>
                        <span>Criado: {formatDateTime(dep.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleConfirmar(dep.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => handleRejeitar(dep.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="confirmados" className="space-y-3 mt-4">
          {confirmados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum depósito confirmado</p>
              </CardContent>
            </Card>
          ) : (
            confirmados.map((dep) => (
              <Card key={dep.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{formatCurrency(dep.valor)}</p>
                        <Badge className="bg-primary">
                          <Check className="w-3 h-3 mr-1" />
                          CONFIRMADO
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dep.descricao || "Depósito"}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Vendedor: <strong>{dep.vendedor.nome}</strong></span>
                        <span>Confirmado por: <strong>{dep.confirmadoPor?.nome || "—"}</strong></span>
                        <span>Data: {dep.confirmadoAt ? formatDateTime(dep.confirmadoAt) : "—"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejeitados" className="space-y-3 mt-4">
          {rejeitados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <X className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum depósito rejeitado</p>
              </CardContent>
            </Card>
          ) : (
            rejeitados.map((dep) => (
              <Card key={dep.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{formatCurrency(dep.valor)}</p>
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                          <X className="w-3 h-3 mr-1" />
                          REJEITADO
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dep.descricao || "Depósito"}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Vendedor: <strong>{dep.vendedor.nome}</strong></span>
                        <span>Criado: {formatDateTime(dep.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="historico" className="space-y-3 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Movimentos do Cofre
              </CardTitle>
              <CardDescription>
                Todas as entradas e saídas registadas no cofre
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!vault || vault.transacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum movimento registado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vault.transacoes.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.tipo === 'deposito'
                            ? 'bg-green-500/20'
                            : 'bg-red-500/20'
                        }`}>
                          {tx.tipo === 'deposito'
                            ? <Check className="w-4 h-4 text-green-600" />
                            : <Banknote className="w-4 h-4 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.descricao}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>Criado por: {tx.criadoPor.nome}</span>
                            {tx.aprovadoPor && (
                              <span>Aprovado por: {tx.aprovadoPor.nome}</span>
                            )}
                            <span>{formatDateTime(tx.dataCriacao)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-green-600">
                        +{formatCurrency(tx.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
