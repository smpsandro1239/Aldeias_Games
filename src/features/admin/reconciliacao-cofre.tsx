"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Banknote, ShieldCheck, Scale, AlertTriangle, CheckCircle2,
  RefreshCw, Search, TrendingUp, TrendingDown, Users, FileSpreadsheet, Download
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { generateCSV, downloadCSV } from "@/lib/export-utils";

interface VendedorRec {
  id: string;
  nome: string;
  email: string;
  saldoCashbox: number;
  totalRecebido: number;
  totalDepositado: number;
  saldoEsperado: number;
  discrepancia: number;
  transacoes: Array<{
    id: string;
    tipo: string;
    valor: number;
    descricao: string;
    createdAt: string;
    referencia: string | null;
  }>;
}

interface PendenteItem {
  id: string;
  valor: number;
  descricao: string | null;
  estado: string;
  createdAt: string;
  vendedor: { id: string; nome: string };
}

interface AldeiaResumo {
  id: string;
  nome: string;
  saldoCofre: number;
  totalDepositado: number;
  numVendedores: number;
}

export function ReconciliacaoCofre({ token }: { token: string }) {
  const [vendedores, setVendedores] = useState<VendedorRec[]>([]);
  const [pendentes, setPendentes] = useState<PendenteItem[]>([]);
  const [aldeias, setAldeias] = useState<AldeiaResumo[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVendedor, setSelectedVendedor] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiRequest("/api/cofre/reconciliacao", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendedores(data.data.vendedores);
        setPendentes(data.data.pendentes);
        setResumo(data.data.resumo);
        if (data.data.aldeias) setAldeias(data.data.aldeias);
      } else {
        toast.error("Erro ao carregar reconciliação");
      }
    } catch {
      toast.error("Erro ao carregar reconciliação");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredVendedores = vendedores.filter(v =>
    v.nome.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="relative bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 rounded-3xl p-6 border border-amber-500/10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
            <Scale className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold">Reconciliação</h1>
            <p className="text-muted-foreground font-medium">
              Comparação entre cashbox vendedores e cofre da aldeia
            </p>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const headers = ['Vendedor', 'Email', 'Total Recebido', 'Total Depositado', 'Saldo Cashbox', 'Saldo Esperado', 'Discrepância'];
              const rows = vendedores.map(v => [
                v.nome,
                v.email,
                v.totalRecebido.toFixed(2),
                v.totalDepositado.toFixed(2),
                v.saldoCashbox.toFixed(2),
                v.saldoEsperado.toFixed(2),
                v.discrepancia.toFixed(2),
              ]);
              downloadCSV(generateCSV(headers, rows), `reconciliacao-${new Date().toISOString().slice(0, 10)}.csv`);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {resumo && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Total Recebido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(resumo.totalRecebido)}
              </p>
              <p className="text-xs text-muted-foreground">Dos jogadores (cashbox)</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 border-blue-200/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Banknote className="w-4 h-4 text-blue-600" />
                Total Depositado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(resumo.totalDepositadoVault)}
              </p>
              <p className="text-xs text-muted-foreground">No cofre</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/20 border-purple-200/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                Saldo Cashbox
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(resumo.saldoCashboxGeral)}
              </p>
              <p className="text-xs text-muted-foreground">Em mãos dos vendedores</p>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${
            resumo.pendentesCount > 0
              ? "from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20 border-orange-200/50"
              : "from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50"
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {resumo.pendentesCount > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {formatCurrency(resumo.pendentesValor)}
              </p>
              <p className="text-xs text-muted-foreground">
                {resumo.pendentesCount} pedido{resumo.pendentesCount !== 1 ? 's' : ''} por aprovar
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Verification equation */}
      {resumo && (
        <Card className="border border-outline-variant/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Equação de verificação:</span>
              <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                Recebido ({formatCurrency(resumo.totalRecebido)})
              </code>
              <span className="text-muted-foreground"> = </span>
              <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                Depositado Cashbox ({formatCurrency(resumo.totalDepositadoCashbox)})
              </code>
              <span className="text-muted-foreground"> + </span>
              <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                Saldo Atual ({formatCurrency(resumo.saldoCashboxGeral)})
              </code>
              {Math.abs(resumo.totalRecebido - resumo.totalDepositadoCashbox - resumo.saldoCashboxGeral) < 0.01 ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 ml-2">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  OK
                </Badge>
              ) : (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Discrepância de {formatCurrency(
                    Math.abs(resumo.totalRecebido - resumo.totalDepositadoCashbox - resumo.saldoCashboxGeral)
                  )}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + Aldeia filter for super_admin */}
      <div className="flex items-center gap-3">
        {aldeias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => {
                // Already viewing all
              }}
            >
              Todas
            </Badge>
            {aldeias.map(a => (
              <Badge
                key={a.id}
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  window.location.href = `/admindashboard/cofre/reconciliacao?aldeiaId=${a.id}`;
                }}
              >
                {a.nome}
              </Badge>
            ))}
          </div>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar vendedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Vendedores Reconciliation Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Vendedores
          </CardTitle>
          <CardDescription>
            {vendedores.length} vendedor{ vendedores.length !== 1 ? 'es' : '' } — {vendedores.filter(v => Math.abs(v.discrepancia) > 0.01).length} com discrepância
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredVendedores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum vendedor encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVendedores.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-outline-variant/20 overflow-hidden"
                >
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors text-left"
                    onClick={() => setSelectedVendedor(selectedVendedor === v.id ? null : v.id)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{v.nome}</p>
                        {Math.abs(v.discrepancia) > 0.01 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Discrepância
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{v.email}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        <span className="text-green-600">{formatCurrency(v.totalRecebido)}</span>
                        {' '}recebido
                      </span>
                      <span className="text-muted-foreground">
                        <span className="text-blue-600">{formatCurrency(v.totalDepositado)}</span>
                        {' '}depositado
                      </span>
                      <span className="font-bold">
                        Saldo: {formatCurrency(v.saldoCashbox)}
                      </span>
                      {Math.abs(v.discrepancia) > 0.01 && (
                        <span className="text-destructive font-bold">
                          {v.discrepancia > 0 ? '+' : ''}{formatCurrency(v.discrepancia)}
                        </span>
                      )}
                    </div>
                  </button>

                  {selectedVendedor === v.id && (
                    <div className="border-t border-outline-variant/20 bg-surface-container-low/50 p-4">
                      <p className="text-sm font-medium mb-3">Transações recentes</p>
                      {v.transacoes.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhuma transação</p>
                      ) : (
                        <div className="space-y-1">
                          {v.transacoes.map(t => (
                            <div key={t.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-surface-container-low">
                              <div className="flex items-center gap-2">
                                {t.tipo === 'RECEBIDO_DO_JOGADOR' ? (
                                  <TrendingUp className="w-3 h-3 text-green-500" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-blue-500" />
                                )}
                                <span>{t.descricao}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={t.tipo === 'RECEBIDO_DO_JOGADOR' ? 'text-green-600' : 'text-blue-600'}>
                                  {t.tipo === 'RECEBIDO_DO_JOGADOR' ? '+' : '-'}{formatCurrency(t.valor)}
                                </span>
                                <span className="text-muted-foreground">{formatDateTime(t.createdAt)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 text-xs text-muted-foreground border-t border-outline-variant/10 pt-3">
                        <p>Saldo esperado: {formatCurrency(v.saldoEsperado)}</p>
                        <p>Saldo real: {formatCurrency(v.saldoCashbox)}</p>
                        <p className={Math.abs(v.discrepancia) > 0.01 ? 'text-destructive font-semibold' : 'text-green-600'}>
                          Discrepância: {v.discrepancia > 0 ? '+' : ''}{formatCurrency(v.discrepancia)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending deposits */}
      {pendentes.length > 0 && (
        <Card className="border border-orange-200/50 dark:border-orange-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Pendentes que afetam a reconciliação
            </CardTitle>
            <CardDescription>
              {pendentes.length} pedido{pendentes.length !== 1 ? 's' : ''} por confirmar — {formatCurrency(pendentes.reduce((s, p) => s + p.valor, 0))} não refletido no cofre
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendentes.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                  <div>
                    <p className="font-medium">{formatCurrency(p.valor)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.vendedor.nome} — {formatDateTime(p.createdAt)}
                    </p>
                  </div>
                  <Badge className="bg-accent">
                    <Clock className="w-3 h-3 mr-1" />
                    PENDENTE
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
