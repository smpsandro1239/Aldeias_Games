"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Gamepad2,
  Calendar,
  DollarSign,
  Activity,
  Target,
  Award
} from "lucide-react";

interface DashboardAnalyticsProps {
  token: string;
  aldeiaId?: string;
}

interface StatsData {
  totalAngariado: number;
  totalParticipacoes: number;
  totalEventos: number;
  eventosAtivos: number;
  totalJogos: number;
  jogosAtivos: number;
  evolucaoMensal: { mes: string; valor: number; participacoes: number }[];
  topVendedores: { id: string; nome: string; totalVendas: number; valorTotal: number }[];
  jogosPorTipo: Record<string, number>;
  vendasPorMetodo: Record<string, number>;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308"];

export function DashboardAnalytics({ token, aldeiaId }: DashboardAnalyticsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token, aldeiaId]);

  const fetchStats = async (inicio?: string, fim?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (aldeiaId) params.set('aldeiaId', aldeiaId);
      if (inicio) params.set('dataInicio', inicio);
      if (fim) params.set('dataFim', fim);
      
      const res = await fetch(`/api/dashboard/stats?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAplicarFiltros = () => {
    fetchStats(dataInicio, dataFim);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("pt-PT").format(value);

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const evolucaoData = stats.evolucaoMensal.map((item) => ({
    ...item,
    valorFormatado: formatCurrency(item.valor),
  }));

  const jogosPorTipo = Object.entries(stats.jogosPorTipo || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const vendasPorMetodo = Object.entries(stats.vendasPorMetodo || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Filtros de Data */}
      <Card className="p-4">
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleAplicarFiltros} disabled={loading}>
            Aplicar Filtros
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Angariado</p>
                  <p className="text-2xl font-black text-violet-600">{formatCurrency(stats.totalAngariado)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-violet-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>+12% este mês</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-pink-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Participações</p>
                  <p className="text-2xl font-black text-pink-600">{formatNumber(stats.totalParticipacoes)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>{stats.totalEventos} eventos</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Jogos Ativos</p>
                  <p className="text-2xl font-black text-orange-600">{stats.jogosAtivos}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <Gamepad2 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>{stats.totalJogos} total</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Eventos Ativos</p>
                  <p className="text-2xl font-black text-emerald-600">{stats.eventosAtivos}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Award className="h-3 w-3" />
                <span>{stats.totalEventos} no total</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="evolucao" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="jogos">Jogos</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
        </TabsList>

        <TabsContent value="evolucao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução Mensal de Angariações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolucaoData}>
                    <defs>
                      <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v}€`} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Valor"]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="valor"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jogos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Jogos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={jogosPorTipo}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {jogosPorTipo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Participações por Jogo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jogosPorTipo} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendasPorMetodo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${v}€`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Valor"]} />
                    <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendedores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Top Vendedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topVendedores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis tickFormatter={(v) => `${v}€`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Valor"]} />
                    <Bar dataKey="valorTotal" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}