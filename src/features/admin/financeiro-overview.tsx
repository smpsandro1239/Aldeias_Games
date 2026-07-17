"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Banknote, ArrowLeft, RefreshCw, TrendingUp, TrendingDown,
  Wallet, ArrowUpFromLine, ArrowDownToLine, Users, Download, PieChart as PieChartIcon
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { generateCSV, downloadCSV } from "@/lib/export-utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";

interface ResumoData {
  resumo: {
    saldoCofre: number;
    totalCashbox: number;
    totalGeral: number;
    totalDepositosConfirmados: number;
    totalDepositosPendentes: number;
    totalLevantamentosConfirmados: number;
    totalLevantamentosPendentes: number;
  };
  distribuicaoDinheiro: {
    cofre: number;
    cashboxes: number;
    porRole: {
      vendedores: number;
      adminsAldeia: number;
      superAdmins: number;
    };
    total: number;
  };
  historicoMensal: Array<{
    month: string;
    depositos: number;
    levantamentos: number;
    saldo: number;
  }>;
  topCashboxes: Array<{
    userId: string;
    nome: string;
    role: string;
    saldo: number;
    totalRecebido: number;
    totalDepositado: number;
    totalLevantado: number;
  }>;
  ultimasTransacoes: Array<{
    tipo: string;
    valor: number;
    descricao: string;
    estado: string;
    data: string;
  }>;
}

const COLORS = ['#22c55e', '#a855f7', '#3b82f6', '#f59e0b', '#ef4444'];

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'super_admin': return 'bg-red-500/10 text-red-700 border-red-500/20';
    case 'aldeia_admin': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'vendedor': return 'bg-green-500/10 text-green-700 border-green-500/20';
    default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'aldeia_admin': return 'Admin Aldeia';
    case 'vendedor': return 'Vendedor';
    default: return role;
  }
}

export function FinanceiroOverview() {
  const [data, setData] = useState<ResumoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("visao-geral");

  const getToken = useCallback(() => "", []);
  const getAldeiaId = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}").aldeiaId || undefined;
    } catch {
      return undefined;
    }
  }, []);

  const fetchData = useCallback(async () => {
    const token = getToken();
    const aldeiaId = getAldeiaId();
    try {
      const res = await apiRequest(`/api/cofre/resumo${aldeiaId ? `?aldeiaId=${aldeiaId}` : ''}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      } else {
        toast.error("Erro ao carregar dados financeiros");
      }
    } catch {
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Dados financeiros não disponíveis</p>
      </div>
    );
  }

  const pieData = [
    { name: 'Cofre', value: data.distribuicaoDinheiro.cofre },
    { name: 'Vendedores', value: data.distribuicaoDinheiro.porRole.vendedores },
    { name: 'Admins Aldeia', value: data.distribuicaoDinheiro.porRole.adminsAldeia },
    { name: 'Super Admins', value: data.distribuicaoDinheiro.porRole.superAdmins },
  ].filter(d => d.value > 0);

  const chartData = data.historicoMensal.map(m => ({
    name: m.month,
    Entradas: m.depositos,
    Saidas: m.levantamentos,
    Saldo: m.saldo,
  }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="relative bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 rounded-3xl p-6 border border-blue-500/10">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => window.location.href = "/admindashboard"} className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center hover:bg-blue-500/30 transition-colors">
            <ArrowLeft className="w-6 h-6 text-blue-600" />
          </button>
          <div>
            <h1 className="text-3xl font-serif font-bold">Visão Financeira</h1>
            <p className="text-muted-foreground font-medium">
              Rastreio completo de todo o dinheiro na plataforma
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              Total Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(data.resumo.totalGeral)}
            </p>
            <p className="text-xs text-green-700/80 mt-1">Cofre + Cashboxes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-green-600" />
              Total Depositado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(data.resumo.totalDepositosConfirmados)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.resumo.totalDepositosPendentes > 0 && `${formatCurrency(data.resumo.totalDepositosPendentes)} pendente`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowUpFromLine className="w-4 h-4 text-purple-600" />
              Total Levantado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(data.resumo.totalLevantamentosConfirmados)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.resumo.totalLevantamentosPendentes > 0 && `${formatCurrency(data.resumo.totalLevantamentosPendentes)} pendente`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              Em Cashboxes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(data.resumo.totalCashbox)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Não depositado no cofre</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="historico">Histórico Mensal</TabsTrigger>
            <TabsTrigger value="cashboxes">Cashboxes</TabsTrigger>
            <TabsTrigger value="movimentos">Últimas Movimentações</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={() => {
            const headers = ['Mês', 'Entradas', 'Saídas', 'Saldo'];
            const rows = chartData.map(c => [c.name, c.Entradas.toFixed(2), c.Saidas.toFixed(2), c.Saldo.toFixed(2)]);
            downloadCSV(generateCSV(headers, rows), `financeiro-${new Date().toISOString().slice(0, 10)}.csv`);
          }}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>

        <TabsContent value="visao-geral" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Distribuição do Dinheiro
                </CardTitle>
                <CardDescription>Como o dinheiro está distribuído na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Sem dados</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Fluxo Mensal (Últimos 12 meses)
                </CardTitle>
                <CardDescription>Entradas vs Saídas do cofre</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Saidas" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Fluxo Acumulado</CardTitle>
              <CardDescription>Saldo acumulado mês a mês</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="Saldo" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Mensal Detalhado</CardTitle>
              <CardDescription>Movimentações do cofre nos últimos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.historicoMensal.map((m) => (
                  <div key={m.month} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                    <div>
                      <p className="font-medium">{m.month}</p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-green-600">+{formatCurrency(m.depositos)}</span>
                      <span className="text-purple-600">-{formatCurrency(m.levantamentos)}</span>
                      <span className={`font-bold ${m.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {m.saldo >= 0 ? '+' : ''}{formatCurrency(m.saldo)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashboxes" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Cashboxes por Utilizador
              </CardTitle>
              <CardDescription>Saldo e movimentações de cada utilizador com permissões</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topCashboxes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma cashbox com saldo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.topCashboxes.map((cb) => (
                    <div key={cb.userId} className="p-4 bg-surface-container-low rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-semibold">{cb.nome}</p>
                            <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(cb.role)}`}>
                              {getRoleLabel(cb.role)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(cb.saldo)}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t">
                        <div>
                          <p>Recebido de jogadores</p>
                          <p className="font-medium text-green-600">{formatCurrency(cb.totalRecebido)}</p>
                        </div>
                        <div>
                          <p>Depositado no cofre</p>
                          <p className="font-medium text-blue-600">{formatCurrency(cb.totalDepositado)}</p>
                        </div>
                        <div>
                          <p>Levantado do cofre</p>
                          <p className="font-medium text-purple-600">{formatCurrency(cb.totalLevantado)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentos" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Movimentações do Cofre</CardTitle>
              <CardDescription>Últimos 20 movimentos registados</CardDescription>
            </CardHeader>
            <CardContent>
              {data.ultimasTransacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Banknote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma movimentação</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.ultimasTransacoes.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.tipo === 'deposito' ? 'bg-green-500/20' : 'bg-purple-500/20'
                        }`}>
                          {tx.tipo === 'deposito'
                            ? <ArrowDownToLine className="w-4 h-4 text-green-600" />
                            : <ArrowUpFromLine className="w-4 h-4 text-purple-600" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.descricao}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(tx.data)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.tipo === 'deposito' ? 'text-green-600' : 'text-purple-600'}`}>
                          {tx.tipo === 'deposito' ? '+' : '-'}{formatCurrency(tx.valor)}
                        </p>
                        <Badge variant={tx.estado === 'confirmado' ? 'default' : 'secondary'} className="text-xs">
                          {tx.estado.toUpperCase()}
                        </Badge>
                      </div>
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
