"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  Plus,
  Check,
  Banknote,
  Send,
  History,
  Wallet,
  ArrowRight,
  Gamepad2,
  Hash,
  BarChart3,
} from "lucide-react";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import { toast } from "sonner";


import { useRouter, useSearchParams } from "next/navigation";
import { PedidosCarregamentoInline } from "./pedidos-inline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { VerificarHashModal } from "@/components/verificar-hash-modal";
import { VendedorCashbox } from "./vendedor-cashbox";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/hooks/use-auth";
import { ProvaJogoModal } from "@/components/modals/prova-jogo-modal";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickAction } from "@/components/dashboard/quick-action";

interface VendedorDashboardProps {
  token: string;
}

interface Stats {
  vendasHoje: number;
  valorHoje: number;
  vendasTotal: number;
  valorTotal: number;
  comissaoTotal: number;
  aEntregar: number;
  ultimasVendas: {
    id: string;
    valor: number;
    metodoPagamento: string;
    createdAt: string;
    jogo?: { nome: string };
    tipo?: 'aposta' | 'participacao';
  }[];
}

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockAtual: number;
  estado: string;
}

export function VendedorDashboard({ token }: VendedorDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token: authToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "overview");
  const [pedidosPendentesCount, setPedidosPendentesCount] = useState(0);
  const [saldoAngariado, setSaldoAngariado] = useState<{
    totalAngariado: number;
    totalEntregue: number;
    totalSolicitado: number;
    saldoAEntregar: number;
    historicoPedidos: any[];
    historicoEntregas: any[];
  }>({
    totalAngariado: 0,
    totalEntregue: 0,
    totalSolicitado: 0,
    saldoAEntregar: 0,
    historicoPedidos: [],
    historicoEntregas: []
  });
  const [entregaModalOpen, setEntregaModalOpen] = useState(false);
  const [verificarHashOpen, setVerificarHashOpen] = useState(false);
  const [valorEntrega, setValorEntrega] = useState("");
  const [depositoExternoOpen, setDepositoExternoOpen] = useState(false);
  const [provaModalOpen, setProvaModalOpen] = useState(false);
  const [provaParticipacaoId, setProvaParticipacaoId] = useState<string | null>(null);

  // Handler para solicitar entrega
  const handleSolicitarEntrega = async () => {
    const valor = parseFloat(valorEntrega);
    if (!valor || valor <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    if (valor > saldoAngariado.saldoAEntregar) {
      toast.error(`Valor máximo: €${saldoAngariado.saldoAEntregar.toFixed(2)}`);
      return;
    }

    try {
      const res = await apiRequest("/api/vendedor/entrega-saldo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor,
          observacoes: "Solicitação via dashboard"
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Solicitação de entrega enviada ao administrador!");
        setEntregaModalOpen(false);
        setValorEntrega("");
        fetchData();
      } else {
        toast.error(data.error || "Erro ao solicitar entrega");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao solicitar entrega");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      // Fetch stats
      const statsRes = await apiRequest("/api/dashboard/vendedor");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      // Fetch jogos disponíveis
      const jogosRes = await apiRequest("/api/jogos?ativos=true");
      if (jogosRes.ok) {
        const jogosData = await jogosRes.json();
        setJogos(jogosData.data);
      }

      // Fetch pedidos pendentes count
      const pedidosRes = await apiRequest("/api/pedidos-carregamento?estado=pendente");
      if (pedidosRes.ok) {
        const pedidosData = await pedidosRes.json();
        setPedidosPendentesCount(pedidosData.data?.length || 0);
      }

      // Fetch saldo angariado
      const saldoRes = await apiRequest("/api/vendedor/saldo-angariado");
      if (saldoRes.ok) {
        const saldoData = await saldoRes.json();
        setSaldoAngariado(saldoData.data || {
          totalAngariado: 0,
          totalEntregue: 0,
          totalSolicitado: 0,
          saldoAEntregar: 0
        });
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-surface-container rounded animate-pulse" />
              <div className="h-4 w-64 bg-surface-container-low rounded animate-pulse" />
            </div>
            <div className="h-9 w-9 bg-surface-container rounded-full animate-pulse" />
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
          {/* Quick actions skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-surface-container rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-accent">Área do Vendedor</h1>
            <p className="text-sm text-muted-foreground">Regista vendas e acompanha o teu desempenho</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* ===== STATS GRID ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Vendas Hoje"
            value={`${stats?.vendasHoje || 0}`}
            subtitle={formatCurrency(stats?.valorHoje || 0)}
            icon={<ShoppingCart className="h-5 w-5" />}
            color="blue"
            onClick={() => setActiveTab("vendas")}
          />
          <StatCard
            title="Vendas Totais"
            value={`${stats?.vendasTotal || 0}`}
            subtitle={formatCurrency(stats?.valorTotal || 0)}
            icon={<TrendingUp className="h-5 w-5" />}
            color="emerald"
            onClick={() => setActiveTab("historico")}
          />
          <StatCard
            title="Comissão Total"
            value={formatCurrency(stats?.comissaoTotal || 0)}
            subtitle="Ganho acumulado"
            icon={<DollarSign className="h-5 w-5" />}
            color="violet"
            onClick={() => setActiveTab("historico")}
          />
          <StatCard
            title="Saldo a Entregar"
            value={formatCurrency(stats?.aEntregar || 0)}
            subtitle="Dinheiro vivo retido"
            icon={<Banknote className="h-5 w-5" />}
            color="amber"
            onClick={() => setActiveTab("cofre")}
          />
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div>
          <h2 className="font-serif text-lg font-semibold text-accent mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
            <QuickAction
              icon={<TrendingUp className="h-5 w-5" />}
              label="Geral"
              onClick={() => setActiveTab("overview")}
              color="emerald"
            />
            <QuickAction
              icon={<ShoppingCart className="h-5 w-5" />}
              label="Jogos"
              onClick={() => router.push("/jogos")}
              color="blue"
            />
            <QuickAction
              icon={<Send className="h-5 w-5" />}
              label="Pedidos"
              onClick={() => setActiveTab("pedidos")}
              color="orange"
              badge={pedidosPendentesCount > 0 ? pedidosPendentesCount : undefined}
            />
            <QuickAction
              icon={<BarChart3 className="h-5 w-5" />}
              label="Angariação"
              onClick={() => setActiveTab("angariacao")}
              color="violet"
            />
            <QuickAction
              icon={<Wallet className="h-5 w-5" />}
              label="Caixa"
              onClick={() => setActiveTab("cofre")}
              color="amber"
            />
            <QuickAction
              icon={<TrendingUp className="h-5 w-5" />}
              label="Histórico"
              onClick={() => setActiveTab("historico")}
              color="green"
            />
            <QuickAction
              icon={<Hash className="h-5 w-5" />}
              label="Verificar"
              onClick={() => setVerificarHashOpen(true)}
              color="pink"
            />
            <QuickAction
              icon={<Banknote className="h-5 w-5" />}
              label="Depositar"
              onClick={() => {
                setActiveTab("cofre");
                setTimeout(() => setDepositoExternoOpen(true), 100);
              }}
              color="cyan"
            />
            <QuickAction
              icon={<Send className="h-5 w-5" />}
              label="Pedir Saldo"
              onClick={() => setActiveTab("pedidos")}
              color="orange"
            />
          </div>
        </div>

        {/* ===== TABS (deep dive) — menu no fundo do conteúdo ===== */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>

            {/* ===== OVERVIEW TAB ===== */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats inline cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="bg-card border-outline-variant/10">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Angariado</p>
                    <p className="text-2xl font-black text-foreground">{formatCurrency(saldoAngariado.totalAngariado)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-outline-variant/10">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Entregue</p>
                    <p className="text-2xl font-black text-foreground">{formatCurrency(saldoAngariado.totalEntregue)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card border-outline-variant/10">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Solicitado</p>
                    <p className="text-2xl font-black text-foreground">{formatCurrency(saldoAngariado.totalSolicitado)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Histórico de Entregas */}
              <Card className="bg-card border-outline-variant/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Histórico de Entregas</h3>
                  </div>
                  {saldoAngariado.historicoEntregas?.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma entrega registada</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(saldoAngariado.historicoEntregas || []).slice(0, 5).map((entrega: any) => (
                        <div
                          key={entrega.id}
                          className="flex items-center justify-between py-1.5 border-b border-outline-variant/5 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-accent">{formatCurrency(entrega.valor)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(entrega.dataSolicitacao)}
                              {entrega.admin && ` — ${entrega.admin.nome}`}
                            </p>
                          </div>
                          <Badge
                            className={
                              entrega.estado === 'concluido' ? 'bg-emerald-500/20 text-emerald-700' :
                              entrega.estado === 'confirmado' ? 'bg-blue-500/20 text-blue-700' :
                              entrega.estado === 'cancelado' ? 'bg-red-500/20 text-red-700' :
                              'bg-amber-500/20 text-amber-700'
                            }
                          >
                            {entrega.estado}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== PEDIDOS TAB ===== */}
            <TabsContent value="pedidos" className="space-y-4">
              <PedidosCarregamentoInline token={token} />
            </TabsContent>

            {/* ===== ANGARIACAO TAB ===== */}
            <TabsContent value="angariacao" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Total Angariado"
                  value={formatCurrency(saldoAngariado.totalAngariado)}
                  icon={<DollarSign className="h-5 w-5" />}
                  color="emerald"
                />
                <StatCard
                  title="Entregue"
                  value={formatCurrency(saldoAngariado.totalEntregue)}
                  icon={<Check className="h-5 w-5" />}
                  color="blue"
                />
                <StatCard
                  title="Solicitado"
                  value={formatCurrency(saldoAngariado.totalSolicitado)}
                  icon={<Send className="h-5 w-5" />}
                  color="amber"
                />
                <Card className="bg-card border-l-4 border-l-orange-500 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">A Entregar</p>
                        <p className="text-xl md:text-2xl font-black text-foreground">{formatCurrency(saldoAngariado.saldoAEntregar)}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Banknote className="h-5 w-5" />
                      </div>
                    </div>
                    {saldoAngariado.saldoAEntregar > 0 && (
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => setEntregaModalOpen(true)}
                      >
                        <Send className="w-4 h-4 mr-2" /> Solicitar Entrega
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Histórico de Entregas */}
              <Card className="bg-card border-outline-variant/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Histórico de Entregas</h3>
                  </div>
                  {saldoAngariado.historicoEntregas?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma entrega registada</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(saldoAngariado.historicoEntregas || []).map((entrega: any) => (
                        <div
                          key={entrega.id}
                          className="flex items-center justify-between py-1.5 border-b border-outline-variant/5 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-accent">{formatCurrency(entrega.valor)}</p>
                            <p className="text-xs text-muted-foreground">
                              Solicitado: {formatDate(entrega.dataSolicitacao)}
                              {entrega.admin && ` — Admin: ${entrega.admin.nome}`}
                            </p>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <Badge
                              className={
                                entrega.estado === 'concluido' ? 'bg-emerald-500/20 text-emerald-700' :
                                entrega.estado === 'confirmado' ? 'bg-blue-500/20 text-blue-700' :
                                entrega.estado === 'cancelado' ? 'bg-red-500/20 text-red-700' :
                                'bg-amber-500/20 text-amber-700'
                              }
                            >
                              {entrega.estado}
                            </Badge>
                            {entrega.dataConclusao && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Entregue: {formatDate(entrega.dataConclusao)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== COFRE TAB ===== */}
            <TabsContent value="cofre" className="space-y-4">
              <VendedorCashbox
                token={token}
                externalDepositOpen={depositoExternoOpen}
                onExternalDepositOpenChange={setDepositoExternoOpen}
              />
            </TabsContent>

            {/* ===== HISTORICO TAB ===== */}
            <TabsContent value="historico" className="space-y-4">
              <Card className="bg-card border-outline-variant/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Histórico de Vendas</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Jogo</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats?.ultimasVendas?.length ? (
                          stats.ultimasVendas.map((venda) => (
                            <TableRow key={venda.id}>
                              <TableCell>{formatDateTime(venda.createdAt)}</TableCell>
                              <TableCell>{venda.jogo?.nome || "-"}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {venda.metodoPagamento}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(venda.valor)}
                              </TableCell>
                              <TableCell className="text-right">
                                {venda.tipo === 'participacao' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-primary"
                                    title="Ver Prova"
                                    onClick={() => {
                                      setProvaParticipacaoId(venda.id);
                                      setProvaModalOpen(true);
                                    }}
                                  >
                                    <Hash className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                              Sem vendas registadas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ===== TAB MENU — no fundo do conteúdo ===== */}
            <div className="pt-2">
              <TabsList className="flex overflow-x-auto gap-1 bg-surface-container-low p-1 rounded-xl">
                <TabsTrigger value="overview" className="flex items-center gap-1.5 text-sm px-3 py-2">
                  <TrendingUp className="h-4 w-4" /> Geral
                </TabsTrigger>
                <button onClick={() => router.push("/jogos")} className="flex items-center gap-1.5 text-sm px-3 py-2 hover:bg-surface-container-high rounded-md transition-colors">
                  <ShoppingCart className="h-4 w-4" /> Jogos
                </button>
                <TabsTrigger value="pedidos" className="relative flex items-center gap-1.5 text-sm px-3 py-2">
                  <Send className="h-4 w-4" /> Pedidos
                  {pedidosPendentesCount > 0 && (
                    <Badge className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center bg-destructive text-white text-xs">
                      {pedidosPendentesCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="angariacao" className="flex items-center gap-1.5 text-sm px-3 py-2">
                  <BarChart3 className="h-4 w-4" /> Angariação
                </TabsTrigger>
                <TabsTrigger value="cofre" className="flex items-center gap-1.5 text-sm px-3 py-2">
                  <Wallet className="h-4 w-4" /> Caixa
                </TabsTrigger>
                <TabsTrigger value="historico" className="flex items-center gap-1.5 text-sm px-3 py-2">
                  <History className="h-4 w-4" /> Histórico
                </TabsTrigger>
                <button onClick={() => setVerificarHashOpen(true)} className="flex items-center gap-1.5 text-sm px-3 py-2 hover:bg-surface-container-high rounded-md transition-colors">
                  <Hash className="h-4 w-4" /> Verificar
                </button>
                <button onClick={() => { setActiveTab("cofre"); setTimeout(() => setDepositoExternoOpen(true), 100); }} className="flex items-center gap-1.5 text-sm px-3 py-2 hover:bg-surface-container-high rounded-md transition-colors">
                  <Banknote className="h-4 w-4" /> Depositar
                </button>
                <button onClick={() => setActiveTab("pedidos")} className="flex items-center gap-1.5 text-sm px-3 py-2 hover:bg-surface-container-high rounded-md transition-colors">
                  <Send className="h-4 w-4" /> Pedir Saldo
                </button>
              </TabsList>
            </div>
          </Tabs>
        </div>

        {/* ===== ATIVIDADE RECENTE — no fundo ===== */}
        {stats?.ultimasVendas && stats.ultimasVendas.length > 0 && (
          <div>
            <h2 className="font-serif text-lg font-semibold text-accent mb-3">Atividade Recente</h2>
            <Card className="bg-card border-outline-variant/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Últimas Vendas</h3>
                  <button onClick={() => setActiveTab("historico")} className="text-xs text-primary hover:underline flex items-center gap-1">
                    Ver tudo <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {stats.ultimasVendas.slice(0, 5).map((venda) => (
                    <div key={venda.id} className="flex items-center justify-between py-1.5 border-b border-outline-variant/5 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-accent truncate">{venda.jogo?.nome || "Jogo"}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(venda.createdAt)}</p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-sm font-bold text-emerald-500">
                          +{formatCurrency(venda.valor)}
                        </p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {venda.metodoPagamento}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal Solicitar Entrega */}
      <Dialog open={entregaModalOpen} onOpenChange={setEntregaModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Solicitar Entrega de Saldo</DialogTitle>
            <DialogDescription>
              O valor solicitado será transferido para o administrador da aldeia após confirmação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo Disponível para Entrega</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(saldoAngariado.saldoAEntregar)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorEntrega">Valor a Entregar (€)</Label>
              <Input
                id="valorEntrega"
                type="number"
                step="0.01"
                min="0.01"
                max={saldoAngariado.saldoAEntregar}
                value={valorEntrega}
                onChange={(e) => setValorEntrega(e.target.value)}
                placeholder="0.00"
              />
              {valorEntrega && parseFloat(valorEntrega) > saldoAngariado.saldoAEntregar && (
                <p className="text-xs text-destructive">
                  Valor excede o saldo disponível
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground bg-accent/10 p-3 rounded-lg border border-accent/20">
              <p className="font-medium text-accent mb-1">Importante:</p>
              <p>Ao solicitar a entrega, o administrador será notificado. Após a confirmação, o valor será transferido para o saldo do administrador e o seu saldo a entregar será zerado.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntregaModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitarEntrega}>
              Solicitar Entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Verificação de Hash */}
      <VerificarHashModal
        open={verificarHashOpen}
        onOpenChange={setVerificarHashOpen}
      />

      {/* Modal de Prova de Jogo */}
      <ProvaJogoModal
        open={provaModalOpen}
        onOpenChange={setProvaModalOpen}
        participacaoId={provaParticipacaoId || undefined}
      />
    </div>
  );
}

/* ===== Local sub-components (same pattern as SuperAdminDashboard) ===== */
