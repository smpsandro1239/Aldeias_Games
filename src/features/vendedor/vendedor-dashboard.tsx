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
import { POSView } from "./pos-view";

import { useRouter, useSearchParams } from "next/navigation";
import { PedidosCarregamentoInline } from "./pedidos-inline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { VerificarHashModal } from "@/components/verificar-hash-modal";
import { VendedorCashbox } from "./vendedor-cashbox";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/hooks/use-auth";

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

  // Form de nova venda
  const [novaVenda, setNovaVenda] = useState<{
    jogoId: string;
    quantidade: number;
    metodoPagamento: "mbway" | "dinheiro" | "stripe" | "transferencia";
    nomeCliente: string;
    telefoneCliente: string;
    emailCliente: string;
  }>({
    jogoId: "",
    quantidade: 1,
    metodoPagamento: "dinheiro",
    nomeCliente: "",
    telefoneCliente: "",
    emailCliente: "",
  });

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

  const handleNovaVenda = async (e: React.FormEvent) => {
    e.preventDefault();

    const jogo = jogos.find((j) => j.id === novaVenda.jogoId);
    if (!jogo) return;

    const response = await apiRequest("/api/participacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jogoId: novaVenda.jogoId,
        dadosParticipacao: { quantidade: novaVenda.quantidade },
        quantidade: novaVenda.quantidade,
        metodoPagamento: novaVenda.metodoPagamento,
        dadosCliente:
          novaVenda.nomeCliente && (novaVenda.telefoneCliente || novaVenda.emailCliente)
            ? {
                nome: novaVenda.nomeCliente,
                telefone: novaVenda.telefoneCliente || undefined,
                email: novaVenda.emailCliente || undefined,
              }
            : undefined,
      }),
    });

    if (response.ok) {
      toast.success("Venda registada com sucesso!");
      setNovaVenda({
        jogoId: "",
        quantidade: 1,
        metodoPagamento: "dinheiro",
        nomeCliente: "",
        telefoneCliente: "",
        emailCliente: "",
      });
      fetchData();
    } else {
      const error = await response.json();
      toast.error(error.error || "Erro ao registar venda");
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
            <NotificationBell token={authToken || ""} />
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
          />
          <StatCard
            title="Vendas Totais"
            value={`${stats?.vendasTotal || 0}`}
            subtitle={formatCurrency(stats?.valorTotal || 0)}
            icon={<TrendingUp className="h-5 w-5" />}
            color="emerald"
          />
          <StatCard
            title="Comissão Total"
            value={formatCurrency(stats?.comissaoTotal || 0)}
            subtitle="Ganho acumulado"
            icon={<DollarSign className="h-5 w-5" />}
            color="violet"
          />
          <StatCard
            title="Saldo a Entregar"
            value={formatCurrency(stats?.aEntregar || 0)}
            subtitle="Dinheiro vivo retido"
            icon={<Banknote className="h-5 w-5" />}
            color="amber"
          />
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div>
          <h2 className="font-serif text-lg font-semibold text-accent mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction
              icon={<ShoppingCart className="h-5 w-5" />}
              label="POS Mobile"
              onClick={() => setActiveTab("pos")}
              color="blue"
            />
            <QuickAction
              icon={<Gamepad2 className="h-5 w-5" />}
              label="Nova Venda"
              onClick={() => setActiveTab("vendas")}
              color="emerald"
            />
            <QuickAction
              icon={<Wallet className="h-5 w-5" />}
              label="Caixa"
              onClick={() => setActiveTab("cofre")}
              color="amber"
              badge={undefined}
            />
            <QuickAction
              icon={<BarChart3 className="h-5 w-5" />}
              label="Angariação"
              onClick={() => setActiveTab("angariacao")}
              color="violet"
            />
            <QuickAction
              icon={<Hash className="h-5 w-5" />}
              label="Verificar"
              onClick={() => setVerificarHashOpen(true)}
              color="pink"
            />
            <QuickAction
              icon={<Send className="h-5 w-5" />}
              label="Pedidos"
              onClick={() => setActiveTab("pedidos")}
              color="orange"
              badge={pedidosPendentesCount > 0 ? pedidosPendentesCount : undefined}
            />
            <QuickAction
              icon={<TrendingUp className="h-5 w-5" />}
              label="Histórico"
              onClick={() => setActiveTab("historico")}
              color="emerald"
            />
          </div>
        </div>

        {/* ===== TABS (deep dive) — logo abaixo das quick actions ===== */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex overflow-x-auto gap-1 bg-surface-container-low p-1 rounded-xl">
              <TabsTrigger value="overview" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <TrendingUp className="h-4 w-4" /> Geral
              </TabsTrigger>
              <TabsTrigger value="pos" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <ShoppingCart className="h-4 w-4" /> POS
              </TabsTrigger>
              <TabsTrigger value="vendas" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Gamepad2 className="h-4 w-4" /> Venda
              </TabsTrigger>
              <TabsTrigger value="pedidos" className="relative flex items-center gap-1.5 text-sm px-3 py-2">
                <Wallet className="h-4 w-4" /> Pedidos
                {pedidosPendentesCount > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center bg-destructive text-white text-xs">
                    {pedidosPendentesCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="angariacao" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Banknote className="h-4 w-4" /> Angariação
              </TabsTrigger>
              <TabsTrigger value="cofre" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <Wallet className="h-4 w-4" /> Caixa
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center gap-1.5 text-sm px-3 py-2">
                <History className="h-4 w-4" /> Histórico
              </TabsTrigger>
            </TabsList>

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

            {/* ===== POS TAB ===== */}
            <TabsContent value="pos">
              <POSView jogos={jogos} onSell={async (data) => {
                const res = await apiRequest("/api/participacoes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                if (res.ok) {
                  toast.success("Venda realizada!");
                  fetchData();
                } else {
                  const err = await res.json();
                  toast.error(err.error);
                }
              }} loading={loading} />
            </TabsContent>

            {/* ===== VENDAS TAB ===== */}
            <TabsContent value="vendas" className="space-y-4">
              <Card className="bg-card border-outline-variant/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-serif">Nova Venda</CardTitle>
                      <CardDescription className="text-base">Registe uma nova participação para um cliente</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleNovaVenda} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="jogo" className="text-sm font-semibold">Jogo *</Label>
                        <Select
                          value={novaVenda.jogoId}
                          onValueChange={(value) => setNovaVenda({ ...novaVenda, jogoId: value })}
                        >
                          <SelectTrigger className="h-12 bg-surface-container-low border-outline-variant/30">
                            <SelectValue placeholder="Selecione o jogo" />
                          </SelectTrigger>
                          <SelectContent>
                            {jogos.map((jogo) => (
                              <SelectItem key={jogo.id} value={jogo.id}>
                                {jogo.nome} - {formatCurrency(jogo.preco)} (Stock: {jogo.stockAtual})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="quantidade" className="text-sm font-semibold">Quantidade *</Label>
                        <Input
                          id="quantidade"
                          type="number"
                          min={1}
                          value={novaVenda.quantidade}
                          onChange={(e) =>
                            setNovaVenda({ ...novaVenda, quantidade: parseInt(e.target.value) || 1 })
                          }
                          className="h-12 bg-surface-container-low border-outline-variant/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="metodo" className="text-sm font-semibold">Método de Pagamento *</Label>
                      <Select
                        value={novaVenda.metodoPagamento}
                        onValueChange={(value: "mbway" | "dinheiro" | "stripe" | "transferencia") =>
                          setNovaVenda({ ...novaVenda, metodoPagamento: value })
                        }
                      >
                        <SelectTrigger className="h-12 bg-surface-container-low border-outline-variant/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="mbway">MBWay</SelectItem>
                          <SelectItem value="transferencia">Transferência</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-surface-container-low/50 rounded-2xl p-4 border border-outline-variant/20">
                      <h4 className="text-sm font-semibold mb-4">Dados do Cliente</h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="nomeCliente" className="text-xs font-medium">Nome *</Label>
                          <Input
                            id="nomeCliente"
                            placeholder="Nome obrigatório"
                            value={novaVenda.nomeCliente}
                            onChange={(e) =>
                              setNovaVenda({ ...novaVenda, nomeCliente: e.target.value })
                            }
                            required
                            className="bg-background border-outline-variant/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefoneCliente" className="text-xs font-medium">Telefone</Label>
                          <Input
                            id="telefoneCliente"
                            placeholder="Pelo menos um contacto"
                            value={novaVenda.telefoneCliente}
                            onChange={(e) =>
                              setNovaVenda({ ...novaVenda, telefoneCliente: e.target.value })
                            }
                            className="bg-background border-outline-variant/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emailCliente" className="text-xs font-medium">Email</Label>
                          <Input
                            id="emailCliente"
                            type="email"
                            placeholder="Pelo menos um contacto"
                            value={novaVenda.emailCliente}
                            onChange={(e) =>
                              setNovaVenda({ ...novaVenda, emailCliente: e.target.value })
                            }
                            className="bg-background border-outline-variant/30"
                          />
                        </div>
                      </div>
                    </div>

                    {novaVenda.jogoId && (
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">Total da Venda</p>
                            <p className="text-3xl font-bold text-primary">
                              {formatCurrency(
                                (jogos.find((j) => j.id === novaVenda.jogoId)?.preco || 0) *
                                  novaVenda.quantidade
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Quantidade</p>
                            <p className="text-lg font-semibold">{novaVenda.quantidade}x</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" disabled={!novaVenda.jogoId}>
                      <Check className="h-5 w-5 mr-3" />
                      Registar Venda
                    </Button>
                  </form>
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
              <VendedorCashbox token={token} />
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
        token={token}
      />
    </div>
  );
}

/* ===== Local sub-components (same pattern as SuperAdminDashboard) ===== */

function StatCard({
  title, value, subtitle, icon, color,
}: {
  title: string; value: string; subtitle?: string; icon: React.ReactNode;
  color: "emerald" | "blue" | "violet" | "amber" | "pink" | "orange";
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };
  const borderMap = {
    emerald: "border-l-emerald-500",
    blue: "border-l-blue-500",
    violet: "border-l-violet-500",
    amber: "border-l-amber-500",
    pink: "border-l-pink-500",
    orange: "border-l-orange-500",
  };
  return (
    <Card className={`bg-card border-l-4 ${borderMap[color]} shadow-sm hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-xl md:text-2xl font-black text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  icon, label, onClick, color, badge,
}: {
  icon: React.ReactNode; label: string; onClick: () => void;
  color: "emerald" | "blue" | "violet" | "amber" | "pink" | "orange";
  badge?: number;
}) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
    violet: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
    pink: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 dark:text-pink-400",
    orange: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400",
  };
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl ${colorMap[color]} transition-all hover:scale-[1.02] active:scale-[0.98]`}
    >
      {badge !== undefined && badge > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center bg-destructive text-white text-xs">
          {badge}
        </Badge>
      )}
      {icon}
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
  );
}
