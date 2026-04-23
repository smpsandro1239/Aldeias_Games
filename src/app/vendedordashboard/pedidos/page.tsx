"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutHeader } from "@/components/layout-header";
import { ArrowLeft, Wallet, Check, X, Clock, User, Phone, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Pedido {
  id: string;
  valor: number;
  estado: string;
  createdAt: string;
  user: {
    id: string;
    nome: string;
    telefone?: string;
  };
  vendedor?: {
    id: string;
    nome: string;
  };
}

export default function PedidosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userMenuButtonOpen, setUserMenuButtonOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setCurrentUser(userData);
      if (userData.role !== 'vendedor' && userData.role !== 'aldeia_admin') {
        router.push("/");
        return;
      }
      fetchPedidos();
    } else {
      router.push("/");
    }
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/pedidos-carregamento", {
        headers: { Authorization: `Bearer ${token}` }
      });
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

  const handleConfirmar = async (pedidoId: string) => {
    setProcessing(pedidoId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/pedidos-carregamento", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pedidoId, acao: "confirmar" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Pagamento confirmado! O saldo foi creditado.");
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
      const token = localStorage.getItem("token");
      const res = await fetch("/api/pedidos-carregamento", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
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
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'confirmado': return <Check className="w-4 h-4" />;
      case 'cancelado': return <X className="w-4 h-4" />;
      default: return null;
    }
  };

  const pedidosPendentes = pedidos.filter(p => p.estado === 'pendente');
  const pedidosHistorico = pedidos.filter(p => p.estado !== 'pendente');

  if (!currentUser) return null;

  return (
    <LayoutHeader>
      <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body">
        <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-[#2e2928] rounded-full">
              <ArrowLeft className="w-5 h-5 text-[#ff734b]" />
            </button>
            <h1 className="font-serif text-xl tracking-wide text-[#ffb5a0] font-bold italic">
              Pedidos de Carregamento
            </h1>
          </div>
        </header>

        <main className="px-4 pt-4 space-y-4">
        {/* Pending Orders */}
        <div>
          <h2 className="text-lg font-bold text-[#ffb5a0] mb-3">
            Pedidos Pendentes ({pedidosPendentes.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8 text-[#e0bfb7]">A carregar...</div>
          ) : pedidosPendentes.length === 0 ? (
            <div className="text-center py-8 text-[#e0bfb7]">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Sem pedidos pendentes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidosPendentes.map((pedido) => (
                <div key={pedido.id} className="bg-[#2e2928] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#ff734b]">{pedido.valor.toFixed(2)}€</p>
                      <p className="text-xs text-[#e0bfb7]">{new Date(pedido.createdAt).toLocaleString("pt-PT")}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getEstadoColor(pedido.estado)}`}>
                      {getEstadoIcon(pedido.estado)}
                      {pedido.estado.toUpperCase()}
                    </div>
                  </div>

                  <div className="bg-[#1a1817] rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-[#e0bfb7]">Solicitado por:</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#ff734b]" />
                      <span>{pedido.user?.nome || "Utilizador"}</span>
                    </div>
                    {pedido.user?.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#ff734b]" />
                        <span className="text-sm">{pedido.user.telefone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmar(pedido.id)}
                      disabled={processing === pedido.id}
                      className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing === pedido.id ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleRejeitar(pedido.id)}
                      disabled={processing === pedido.id}
                      className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {pedidosHistorico.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#ffb5a0] mb-3">
              Histórico ({pedidosHistorico.length})
            </h2>
            <div className="space-y-2">
              {pedidosHistorico.map((pedido) => (
                <div key={pedido.id} className="bg-[#2e2928] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{pedido.valor.toFixed(2)}€</p>
                    <p className="text-xs text-[#e0bfb7]">{pedido.user?.nome}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getEstadoColor(pedido.estado)}`}>
                    {getEstadoIcon(pedido.estado)}
                    {pedido.estado.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </main>
      </LayoutHeader>
    </div>
  );
}