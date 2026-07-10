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
} from "lucide-react";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { POSView } from "./pos-view";

import { useRouter } from "next/navigation";
import { PedidosCarregamentoInline } from "./pedidos-inline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { VerificarHashModal } from "@/components/verificar-hash-modal";
import { VendedorCashbox } from "./vendedor-cashbox";

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
  const [stats, setStats] = useState<Stats | null>(null);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vendas");
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

  // Handler para redirecionar para página de pedidos
  const handlePedidosClick = () => {
    router.push("/vendedordashboard/pedidos");
  };

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
      const token = localStorage.getItem("token");
      const res = await apiRequest("/api/vendedor/entrega-saldo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
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
  }, [token]);

   const fetchData = async () => {
     if (!token) return;
     setLoading(true);

     try {
       // Fetch stats
       const statsRes = await apiRequest("/api/dashboard/vendedor", {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (statsRes.ok) {
         const statsData = await statsRes.json();
         setStats(statsData.data);
       }

       // Fetch jogos disponíveis
       const jogosRes = await apiRequest("/api/jogos?ativos=true", {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (jogosRes.ok) {
         const jogosData = await jogosRes.json();
         setJogos(jogosData.data);
       }

       // Fetch pedidos pendentes count
       const pedidosRes = await apiRequest("/api/pedidos-carregamento?estado=pendente", {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (pedidosRes.ok) {
         const pedidosData = await pedidosRes.json();
         setPedidosPendentesCount(pedidosData.data?.length || 0);
       }

       // Fetch saldo angariado
       const saldoRes = await apiRequest("/api/vendedor/saldo-angariado", {
         headers: { Authorization: `Bearer ${token}` },
       });
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 rounded-3xl p-6 border border-primary/10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-accent">A Minha Área</h1>
            <p className="text-muted-foreground font-medium">Regista as tuas vendas e acompanha o teu desempenho</p>
          </div>
        </div>
        <div className="absolute top-4 right-4 opacity-10">
          <TrendingUp className="w-16 h-16 text-primary" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/20 rounded-full -translate-y-8 translate-x-8"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">Vendas Hoje</CardTitle>
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats?.vendasHoje || 0}</div>
            <p className="text-sm text-blue-700/80 dark:text-blue-300/80 font-medium">
              {formatCurrency(stats?.valorHoje || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-200/20 rounded-full -translate-y-8 translate-x-8"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100">Vendas Totais</CardTitle>
            <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats?.vendasTotal || 0}</div>
            <p className="text-sm text-green-700/80 dark:text-green-300/80 font-medium">
              {formatCurrency(stats?.valorTotal || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/50">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200/20 rounded-full -translate-y-8 translate-x-8"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100">Comissão</CardTitle>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(stats?.comissaoTotal || 0)}</div>
            <p className="text-sm text-purple-700/80 dark:text-purple-300/80 font-medium">
              Ganho total
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/50">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-200/20 rounded-full -translate-y-8 translate-x-8"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100">Saldo a Entregar</CardTitle>
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Banknote className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              {formatCurrency(stats?.aEntregar || 0)}
            </div>
            <p className="text-sm text-orange-700/80 dark:text-orange-300/80 font-medium">
              Dinheiro vivo retido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-surface-container-low rounded-2xl">
          <TabsTrigger value="pos" className="flex-col gap-1 py-3 px-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <div className="w-5 h-5 mb-1">
              📱
            </div>
            <span className="text-xs font-medium">POS Mobile</span>
          </TabsTrigger>
          <TabsTrigger value="vendas" className="flex-col gap-1 py-3 px-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <div className="w-5 h-5 mb-1">
              💻
            </div>
            <span className="text-xs font-medium">Venda Desktop</span>
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="relative flex-col gap-1 py-3 px-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            {pedidosPendentesCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-foreground text-xs z-10">
                {pedidosPendentesCount}
              </Badge>
            )}
            <div className="w-5 h-5 mb-1">
              📋
            </div>
            <span className="text-xs font-medium">Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="verificar" className="flex-col gap-1 py-3 px-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <div className="w-5 h-5 mb-1">
              🔍
            </div>
            <span className="text-xs font-medium">Verificar</span>
          </TabsTrigger>
          <TabsTrigger value="angariacao" className="flex-col gap-1 py-3 px-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <div className="w-5 h-5 mb-1">
              💰
            </div>
            <span className="text-xs font-medium">Angariação</span>
          </TabsTrigger>
          <TabsTrigger value="cofre" className="flex-col gap-1 py-3 px-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <div className="w-5 h-5 mb-1">
              🏦
            </div>
            <span className="text-xs font-medium">Caixa</span>
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex-col gap-1 py-3 px-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <div className="w-5 h-5 mb-1">
              📊
            </div>
            <span className="text-xs font-medium">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <POSView jogos={jogos} onSell={async (data) => {
            const res = await apiRequest("/api/participacoes", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

        <TabsContent value="vendas" className="space-y-4">
          <Card className="bg-gradient-to-br from-surface-container to-surface-container-low border-primary/10">
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
                    <Label htmlFor="jogo" className="text-sm font-semibold flex items-center gap-2">
                      🎮 Jogo *
                    </Label>
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
                    <Label htmlFor="quantidade" className="text-sm font-semibold flex items-center gap-2">
                      🔢 Quantidade *
                    </Label>
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
                  <Label htmlFor="metodo" className="text-sm font-semibold flex items-center gap-2">
                    💳 Método de Pagamento *
                  </Label>
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
                      <SelectItem value="dinheiro">💵 Dinheiro</SelectItem>
                      <SelectItem value="mbway">📱 MBWay</SelectItem>
                      <SelectItem value="transferencia">🏦 Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-surface-container-low/50 rounded-2xl p-4 border border-outline-variant/20">
                  <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    👤 Dados do Cliente
                  </h4>
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

        <TabsContent value="pedidos" className="space-y-4">
          <PedidosCarregamentoInline token={token} />
        </TabsContent>

        <TabsContent value="verificar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                Verificar Participação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Verifique a autenticidade de bilhetes apresentando o hash de verificação.
                Esta validação é obrigatória antes de entregar qualquer prêmio.
              </p>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">⚠️ Importante para Vendedores</h4>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Sempre verifique o hash antes de entregar prêmios</li>
                  <li>• Compare os dados do cliente com as informações mostradas</li>
                  <li>• Em caso de dúvidas, consulte um administrador</li>
                  <li>• Registre todas as verificações realizadas</li>
                </ul>
              </div>

              <Button onClick={() => setVerificarHashOpen(true)} className="w-full">
                <span className="text-lg mr-2">🔍</span>
                Verificar Hash
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="angariacao" className="space-y-4">
          {/* Resumo Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                  💰 Total Angariado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(saldoAngariado.totalAngariado)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  ✅ Entregue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(saldoAngariado.totalEntregue)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/50">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                  ⏳ Solicitado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {formatCurrency(saldoAngariado.totalSolicitado)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/5 dark:to-primary/10 border-primary/30">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                  🎯 A Entregar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(saldoAngariado.saldoAEntregar)}
                </p>
                {saldoAngariado.saldoAEntregar > 0 && (
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    onClick={() => setEntregaModalOpen(true)}
                  >
                    <Send className="w-4 h-4 mr-2" /> Solicitar Entrega
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Entregas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Entregas
              </CardTitle>
              <CardDescription>
                Registos de todas as entregas solicitadas e confirmadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {saldoAngariado.historicoEntregas?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma entrega registada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(saldoAngariado.historicoEntregas || []).map((entrega: any) => (
                    <div
                      key={entrega.id}
                      className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl"
                    >
                      <div>
                        <p className="font-bold text-lg">{entrega.valor.toFixed(2)}€</p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado: {formatDate(entrega.dataSolicitacao)}
                        </p>
                        {entrega.admin && (
                          <p className="text-xs text-muted-foreground">
                            Admin: {entrega.admin.nome}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            entrega.estado === 'concluido' ? 'bg-primary' :
                            entrega.estado === 'confirmado' ? 'bg-secondary' :
                            entrega.estado === 'cancelado' ? 'bg-destructive' :
                            'bg-accent'
                          }
                        >
                          {entrega.estado.toUpperCase()}
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

        <TabsContent value="cofre" className="space-y-4">
          <VendedorCashbox token={token} />
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
