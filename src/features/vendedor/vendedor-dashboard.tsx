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
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface VendedorDashboardProps {
  token: string;
}

interface Stats {
  vendasHoje: number;
  valorHoje: number;
  vendasTotal: number;
  valorTotal: number;
  comissaoTotal: number;
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vendas");

  // Form de nova venda
  const [novaVenda, setNovaVenda] = useState({
    jogoId: "",
    quantidade: 1,
    metodoPagamento: "dinheiro" as const,
    nomeCliente: "",
    telefoneCliente: "",
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
          novaVenda.nomeCliente && novaVenda.telefoneCliente
            ? {
                nome: novaVenda.nomeCliente,
                telefone: novaVenda.telefoneCliente,
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
        <h1 className="text-3xl font-bold">Área do Vendedor</h1>
        <p className="text-muted-foreground">Registe vendas e acompanhe o seu desempenho</p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média/Venda</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.vendasTotal
                ? formatCurrency(stats.valorTotal / stats.vendasTotal)
                : formatCurrency(0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="vendas">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </TabsTrigger>
          <TabsTrigger value="historico">
            <TrendingUp className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nomeCliente">Nome do Cliente</Label>
                    <Input
                      id="nomeCliente"
                      placeholder="Opcional"
                      value={novaVenda.nomeCliente}
                      onChange={(e) =>
                        setNovaVenda({ ...novaVenda, nomeCliente: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefoneCliente">Telefone do Cliente</Label>
                    <Input
                      id="telefoneCliente"
                      placeholder="Opcional"
                      value={novaVenda.telefoneCliente}
                      onChange={(e) =>
                        setNovaVenda({ ...novaVenda, telefoneCliente: e.target.value })
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
    </div>
  );
}
