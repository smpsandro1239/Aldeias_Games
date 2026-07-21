"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  History,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PedidoCarregamento {
  id: string;
  valor: number;
  estado: string;
  metodoPagamento: string;
  createdAt: string;
  user: {
    nome: string;
    email: string;
    telefone?: string;
  };
}

interface Props {
  token: string;
}

export function PedidosCarregamentoInline({ token }: Props) {
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoCarregamento[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/pedidos-carregamento");
      const data = await res.json();
      if (data.success) {
        setPedidos(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const handleConfirmar = async (pedidoId: string) => {
    setProcessing(pedidoId);
    try {
      const res = await apiRequest("/api/pedidos-carregamento", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pedidoId, acao: "confirmar" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pagamento confirmado! O saldo foi creditado ao jogador.");
        fetchPedidos();
      } else {
        toast.error(data.error || "Erro ao confirmar");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao confirmar");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejeitar = async (pedidoId: string) => {
    setProcessing(pedidoId);
    try {
      const res = await apiRequest("/api/pedidos-carregamento", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pedidoId, acao: "rejeitar" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pedido rejeitado.");
        fetchPedidos();
      } else {
        toast.error(data.error || "Erro ao rejeitar");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao rejeitar");
    } finally {
      setProcessing(null);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendente': return 'text-orange-400 bg-orange-400/10';
      case 'confirmado': return 'text-green-400 bg-green-400/10';
      case 'cancelado': return 'text-red-400 bg-red-400/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const pedidosPendentes = pedidos.filter(p => p.estado === 'pendente');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pedidos de Carregamento</h2>
          <p className="text-sm text-muted-foreground">
            Jogadores solicitaram carregamento. Confirme ao receber o pagamento.
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchPedidos}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Pedidos Pendentes */}
      {pedidosPendentes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-orange-400">
            Pendentes ({pedidosPendentes.length})
          </h3>
          {pedidosPendentes.map((pedido) => (
            <Card key={pedido.id} className="bg-surface-container-low">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{pedido.user?.nome || "Utilizador"}</p>
                      <p className="text-xs text-muted-foreground">{pedido.user?.email}</p>
                      {pedido.user?.telefone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> {pedido.user.telefone}
                        </p>
                      )}
                      <p className="text-xs text-orange-400 mt-1 capitalize">
                        {pedido.metodoPagamento === 'vendedor' ? 'Presencial' :
                         pedido.metodoPagamento === 'dinheiro' ? 'Dinheiro' :
                         pedido.metodoPagamento === 'mbway' ? 'MBWay' :
                         pedido.metodoPagamento === 'transferencia' ? 'Transferência' :
                         pedido.metodoPagamento}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{pedido.valor.toFixed(2)}€</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(pedido.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    className="flex-1 bg-primary hover:bg-green-700"
                    onClick={() => handleConfirmar(pedido.id)}
                    disabled={processing === pedido.id}
                  >
                    {processing === pedido.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                    )}
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-500 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRejeitar(pedido.id)}
                    disabled={processing === pedido.id}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Histórico</h3>
        {pedidos.length === 0 ? (
          <Card className="bg-surface-container-low p-8 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum pedido encontrado</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {pedidos.map((pedido) => (
              <Card key={pedido.id} className="bg-surface-container-low">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{pedido.valor.toFixed(2)}€</p>
                      <p className="text-xs text-muted-foreground">
                        {pedido.user?.nome} • {formatDate(pedido.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {pedido.metodoPagamento === 'vendedor' ? 'Presencial' :
                         pedido.metodoPagamento === 'dinheiro' ? 'Dinheiro' :
                         pedido.metodoPagamento === 'mbway' ? 'MBWay' :
                         pedido.metodoPagamento === 'transferencia' ? 'Transferência' :
                         pedido.metodoPagamento}
                      </p>
                    </div>
                    <Badge className={`${getEstadoColor(pedido.estado)}`}>
                      {pedido.estado.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
