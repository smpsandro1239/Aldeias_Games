"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutHeader } from "@/components/layout-header";
import { LoaderScreen } from "@/components/loader-screen";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Banknote,
  Plus
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface PedidoCarregamento {
  id: string;
  valor: number;
  estado: string;
  metodoPagamento: string;
  createdAt: string;
  userId: string;
  user?: {
    nome: string;
    email: string;
    telefone: string;
  };
  vendedorId: string;
  vendedor?: {
    nome: string;
  };
  confirmadosPorId?: string;
  confirmadosPor?: {
    nome: string;
  };
}

export default function AdminPedidosPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<PedidoCarregamento[]>([]);
  const [filter, setFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUserRole(user.role || "");
      } catch (e) {
        console.error("Erro ao parsear user:", e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      fetchPedidos();
    }
  }, [token]);

  const fetchPedidos = async () => {
    try {
      const res = await fetch("/api/admin/pedidos-carregamento", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setPedidos(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    }
  };

  const handleConfirmar = async (pedidoId: string) => {
    try {
      const res = await fetch(`/api/admin/pedidos-carregamento/${pedidoId}/confirmar`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      if (res.ok) {
        toast.success("Pedido confirmado com sucesso!");
        fetchPedidos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao confirmar pedido");
      }
    } catch (error) {
      toast.error("Erro ao confirmar pedido");
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "confirmado":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmado</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "cancelado":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  const filteredPedidos = pedidos.filter(p => {
    if (filter !== "todos" && p.estado !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.user?.nome?.toLowerCase().includes(term) ||
        p.user?.email?.toLowerCase().includes(term) ||
        p.user?.telefone?.includes(term)
      );
    }
    return true;
  });

  const totalPendente = pedidos.filter(p => p.estado === "pendente").reduce((acc, p) => acc + p.valor, 0);
  const totalConfirmado = pedidos.filter(p => p.estado === "confirmado").reduce((acc, p) => acc + p.valor, 0);

  if (loading || !token) {
    return <LoaderScreen message="A carregar pedidos..." />;
  }

  return (
    <RoleGuard allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="AdminPedidos">
      <LayoutHeader>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-[#2e2928]">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm text-[#e0bfb7]">Pendentes</span>
                </div>
                <span className="text-xl font-bold text-yellow-500">
                  {formatCurrency(totalPendente)}
                </span>
              </CardHeader>
            </Card>
            <Card className="bg-[#2e2928]">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-[#e0bfb7]">Confirmados</span>
                </div>
                <span className="text-xl font-bold text-green-500">
                  {formatCurrency(totalConfirmado)}
                </span>
              </CardHeader>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#e0bfb7]/40" />
              <input
                type="text"
                placeholder="Pesquisar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#2e2928] border border-[#58413b]/20 rounded-xl text-[#e0bfb7] placeholder:text-[#e0bfb7]/40 text-sm"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-[#2e2928] border border-[#58413b]/20 rounded-xl text-[#e0bfb7] text-sm"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="confirmado">Confirmados</option>
              <option value="cancelado">Cancelados</option>
            </select>
            <Button variant="outline" size="icon" onClick={fetchPedidos}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Lista de Pedidos */}
          <div className="space-y-3">
            {filteredPedidos.length === 0 ? (
              <Card className="bg-[#2e2928] p-8 text-center">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-[#e0bfb7]/30" />
                <p className="text-[#e0bfb7]">Nenhum pedido encontrado</p>
              </Card>
            ) : (
              filteredPedidos.map((pedido) => (
                <Card key={pedido.id} className="bg-[#2e2928] overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#ff734b]/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-[#ff734b]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#eae0de]">{pedido.user?.nome || "Utilizador"}</p>
                            <p className="text-xs text-[#e0bfb7]/60">{pedido.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#e0bfb7]/60">
                          <span className="flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            {pedido.metodoPagamento || "dinheiro"}
                          </span>
                          <span>•</span>
                          <span>{formatDate(pedido.createdAt)}</span>
                          {pedido.vendedor && (
                            <>
                              <span>•</span>
                              <span>Vendido por: {pedido.vendedor.nome}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#ff734b]">{formatCurrency(pedido.valor)}</p>
                          {getEstadoBadge(pedido.estado)}
                        </div>
                        {pedido.estado === "pendente" && (
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleConfirmar(pedido.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </LayoutHeader>
    </RoleGuard>
  );
}