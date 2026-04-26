"use client";

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
      const res = await fetch("/api/vendedor/entrega-saldo", {
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
       const statsRes = await fetch("/api/dashboard/vendedor", {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (statsRes.ok) {
         const statsData = await statsRes.json();
         setStats(statsData.data);
       }

       // Fetch jogos disponíveis
       const jogosRes = await fetch("/api/jogos?ativos=true", {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (jogosRes.ok) {
         const jogosData = await jogosRes.json();
         setJogos(jogosData.data);
       }

       // Fetch pedidos pendentes count
       const pedidosRes = await fetch("/api/pedidos-carregamento?estado=pendente", {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (pedidosRes.ok) {
         const pedidosData = await pedidosRes.json();
         setPedidosPendentesCount(pedidosData.data?.length || 0);
       }

       // Fetch saldo angariado
       const saldoRes = await fetch("/api/vendedor/saldo-angariado", {
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

    const response = await fetch("/api/participacoes", {
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
      <div>
        <h1 className="text-3xl font-bold">A Minha Área</h1>
        <p className="text-muted-foreground">Regista as tuas vendas e acompanha o teu desempenho</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vendasHoje || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.valorHoje || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vendasTotal || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.valorTotal || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.comissaoTotal || 0)}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Saldo a Entregar</CardTitle>
            <Banknote className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {formatCurrency(stats?.aEntregar || 0)}
            </div>
            <p className="text-xs text-accent/80 mt-1">
              Dinheiro vivo retido menos a sua comissão
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pos">POS Mobile</TabsTrigger>
          <TabsTrigger value="vendas">Venda Desktop</TabsTrigger>
          <TabsTrigger value="pedidos" className="relative">
            Pedidos
            {pedidosPendentesCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-foreground text-xs">
                {pedidosPendentesCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="angariacao">Angariação</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <POSView jogos={jogos} onSell={async (data) => {
            const res = await fetch("/api/participacoes", {
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
          <Card>
            <CardHeader>
              <CardTitle>Nova Venda</CardTitle>
              <CardDescription>Registe uma nova participação para um cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNovaVenda} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="jogo">Jogo *</Label>
                    <Select
                      value={novaVenda.jogoId}
                      onValueChange={(value) => setNovaVenda({ ...novaVenda, jogoId: value })}
                    >
                      <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade *</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min={1}
                      value={novaVenda.quantidade}
                      onChange={(e) =>
                        setNovaVenda({ ...novaVenda, quantidade: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodo">Método de Pagamento *</Label>
                  <Select
                    value={novaVenda.metodoPagamento}
                    onValueChange={(value: "mbway" | "dinheiro" | "stripe" | "transferencia") =>
                      setNovaVenda({ ...novaVenda, metodoPagamento: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="mbway">MBWay</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="nomeCliente">Nome do Cliente *</Label>
                    <Input
                      id="nomeCliente"
                      placeholder="Nome obrigatório"
                      value={novaVenda.nomeCliente}
                      onChange={(e) =>
                        setNovaVenda({ ...novaVenda, nomeCliente: e.target.value })
                      }
                      required
                    />
                  </div>
 
                  <div className="space-y-2">
                    <Label htmlFor="telefoneCliente">Telefone do Cliente</Label>
                    <Input
                      id="telefoneCliente"
                      placeholder="Pelo menos um contacto"
                      value={novaVenda.telefoneCliente}
                      onChange={(e) =>
                        setNovaVenda({ ...novaVenda, telefoneCliente: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emailCliente">Email do Cliente</Label>
                    <Input
                      id="emailCliente"
                      type="email"
                      placeholder="Pelo menos um contacto"
                      value={novaVenda.emailCliente}
                      onChange={(e) =>
                        setNovaVenda({ ...novaVenda, emailCliente: e.target.value })
                      }
                    />
                  </div>
                </div>

                {novaVenda.jogoId && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total da Venda:</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        (jogos.find((j) => j.id === novaVenda.jogoId)?.preco || 0) *
                          novaVenda.quantidade
                      )}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={!novaVenda.jogoId}>
                  <Check className="h-4 w-4 mr-2" />
                  Registar Venda
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedidos" className="space-y-4">
          <PedidosCarregamentoInline token={token} />
        </TabsContent>

        <TabsContent value="angariacao" className="space-y-4">
          {/* Resumo Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-surface-container-low">
              <CardHeader className="py-3">
                <CardTitle className="text-xs text-muted-foreground">Total Angariado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(saldoAngariado.totalAngariado)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-surface-container-low">
              <CardHeader className="py-3">
                <CardTitle className="text-xs text-muted-foreground">Entregue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-secondary">
                  {formatCurrency(saldoAngariado.totalEntregue)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-surface-container-low">
              <CardHeader className="py-3">
                <CardTitle className="text-xs text-muted-foreground">Solicitado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-500">
                  {formatCurrency(saldoAngariado.totalSolicitado)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-surface-container-low border-primary/30">
              <CardHeader className="py-3">
                <CardTitle className="text-xs text-muted-foreground">A Entregar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(saldoAngariado.saldoAEntregar)}
                </p>
                {saldoAngariado.saldoAEntregar > 0 && (
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setEntregaModalOpen(true)}
                  >
                    <Send className="w-4 h-4 mr-1" /> Entregar
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
    </div>
  );
}
