"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import {
  Banknote, ShieldCheck, Building2, Users, Clock,
  RefreshCw, History, Search, AlertTriangle,
  ArrowUpRight, TrendingUp, Download, ArrowUpFromLine, BarChart3
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { generateCSV, downloadCSV } from "@/lib/export-utils";
import { toast } from "sonner";

interface AldeiaResumo {
  id: string;
  nome: string;
  slug: string;
  saldoCofre: number;
  numVendedores: number;
  totalAngariado: number;
  movimentosRecentes: Array<{
    id: string;
    tipo: string;
    valor: number;
    descricao: string;
    dataCriacao: string;
    criadoPor: { nome: string };
  }>;
}

interface PendenteItem {
  id: string;
  valor: number;
  descricao: string | null;
  estado: string;
  createdAt: string;
  vendedor: { id: string; nome: string };
  aldeia: { id: string; nome: string };
}

export function SuperAdminCofre() {
  const [aldeias, setAldeias] = useState<AldeiaResumo[]>([]);
  const [pendentes, setPendentes] = useState<PendenteItem[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDepId, setConfirmDepId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiRequest("/api/superadmin/cofre");
      if (res.ok) {
        const data = await res.json();
        setAldeias(data.data.aldeias);
        setPendentes(data.data.pendentes);
        setTotalGeral(data.data.totalGeral);
        setTotalPendentes(data.data.totalPendentes);
      }
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirmar = async (id: string) => {
    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ acao: "confirmar" })
      });
      if (res.ok) {
        toast.success("Depósito confirmado!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao confirmar");
      }
    } catch {
      toast.error("Erro ao confirmar depósito");
    }
  };

  const filteredAldeias = aldeias.filter(a =>
    a.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-indigo-500/10 rounded-3xl p-6 border border-blue-500/10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold">Cofre — Visão Global</h1>
            <p className="text-muted-foreground font-medium">
              Todas as aldeias, todos os cofres, total transparência
            </p>
          </div>
        </div>
      </div>

      {/* Cards Resumo Global */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              Total nos Cofres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(totalGeral)}
            </p>
            <p className="text-xs text-green-700/80 dark:text-green-300/80 mt-1">
              {aldeias.length} aldeias ativas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              {formatCurrency(totalPendentes)}
            </p>
            <p className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-1">
              {pendentes.length} pedidos por aprovar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Média por Aldeia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(aldeias.length > 0 ? totalGeral / aldeias.length : 0)}
            </p>
            <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
              Saldo médio nos cofres
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar aldeia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/superadmindashboard/financeiro'}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Visão Financeira
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const headers = ['Aldeia', 'Saldo Cofre', 'Vendedores', 'Total Angariado'];
            const rows = aldeias.map(a => [
              a.nome,
              a.saldoCofre.toFixed(2),
              String(a.numVendedores),
              a.totalAngariado.toFixed(2),
            ]);
            downloadCSV(generateCSV(headers, rows), `cofre-global-${new Date().toISOString().slice(0, 10)}.csv`);
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          CSV
        </Button>
        <Button variant="outline" size="icon" onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="aldeias">
        <TabsList>
          <TabsTrigger value="aldeias">Aldeias</TabsTrigger>
          <TabsTrigger value="pendentes" className="relative">
            Pendentes
            {pendentes.length > 0 && (
              <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs">
                {pendentes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="movimentos">Movimentos Globais</TabsTrigger>
        </TabsList>

        <TabsContent value="aldeias" className="space-y-3 mt-4">
          {filteredAldeias.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma aldeia encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredAldeias.map((aldeia) => (
              <Card key={aldeia.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{aldeia.nome}</p>
                        <Badge variant="outline" className="text-xs">
                          {aldeia.numVendedores} vend.
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Banknote className="w-3 h-3" />
                          <strong className="text-green-600">{formatCurrency(aldeia.saldoCofre)}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          {formatCurrency(aldeia.totalAngariado)} total angariado
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/admindashboard/cofre?aldeiaId=${aldeia.id}`, '_blank')}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Detalhes
                    </Button>
                  </div>

                  {aldeia.movimentosRecentes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-outline-variant/20">
                      <p className="text-xs text-muted-foreground mb-2">Últimos movimentos:</p>
                      {aldeia.movimentosRecentes.slice(0, 3).map((mov) => (
                        <div key={mov.id} className="flex items-center justify-between text-xs py-1">
                          <span>{mov.descricao}</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(mov.valor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pendentes" className="space-y-3 mt-4">
          {pendentes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum pedido pendente</p>
              </CardContent>
            </Card>
          ) : (
            pendentes.map((p) => (
              <Card key={p.id} className="border-accent/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{formatCurrency(p.valor)}</p>
                        <Badge className="bg-accent">
                          <Clock className="w-3 h-3 mr-1" />
                          PENDENTE
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {p.descricao || "Depósito"} — {p.vendedor.nome}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Vendedor: <strong>{p.vendedor.nome}</strong></span>
                        <span>Aldeia: <strong>{p.aldeia.nome}</strong></span>
                        <span>{formatDateTime(p.createdAt)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setConfirmDepId(p.id)}
                    >
                      <ShieldCheck className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="movimentos" className="space-y-3 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Movimentos Globais
              </CardTitle>
              <CardDescription>
                Últimos depósitos em todas as aldeias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aldeias.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum movimento registado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {aldeias.flatMap(a =>
                    a.movimentosRecentes.map(mov => ({
                      ...mov,
                      aldeiaNome: a.nome,
                    }))
                  ).sort((a, b) =>
                    new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
                  ).slice(0, 50).map((mov) => (
                    <div
                      key={mov.id}
                      className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{mov.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {(mov as any).aldeiaNome} — {formatDateTime(mov.dataCriacao)}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-green-600">
                        +{formatCurrency(mov.valor)}
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

    <ConfirmModal
      open={!!confirmDepId}
      onOpenChange={(open) => { if (!open) setConfirmDepId(null); }}
      title="Confirmar Depósito"
      description="Tem a certeza de que deseja confirmar este depósito? O valor será creditado no cofre da aldeia."
      confirmText="Confirmar"
      variant="default"
      onConfirm={() => { if (confirmDepId) { handleConfirmar(confirmDepId); setConfirmDepId(null); } }}
    />
    </>
  );
}
