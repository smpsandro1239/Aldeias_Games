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
   Plus,
   ChevronLeft,
   ChevronRight
 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

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
   const { user, isAuthenticated, isLoading } = useAuth();
   const [loading, setLoading] = useState(true);
   const [pedidos, setPedidos] = useState<PedidoCarregamento[]>([]);
   const [filter, setFilter] = useState<string>("todos");
   const [searchTerm, setSearchTerm] = useState("");
   const [page, setPage] = useState<number>(1);
   const pedidosPerPage = 10;
 
useEffect(() => {
      if (isAuthenticated && user) {
        setLoading(true);
        fetchPedidos();
      } else {
        setLoading(false);
      }
    }, [isAuthenticated, user]);
 
   useEffect(() => {
     setPage(1);
   }, [searchTerm, filter]);
 
const fetchPedidos = async () => {
      try {
        const res = await fetch(`/api/admin/pedidos-carregamento?estado=${filter}`);
        
        if (res.ok) {
          const data = await res.json();
          setPedidos(data.data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      } finally {
        setLoading(false);
      }
    };

   const handleConfirmar = async (pedidoId: string) => {
     try {
       const res = await fetch(`/api/admin/pedidos-carregamento/${pedidoId}/confirmar`, {
         method: "POST",
         headers: { 
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
        return <Badge className="bg-primary"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmado</Badge>;
      case "pendente":
        return <Badge className="bg-accent"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case "cancelado":
        return <Badge className="bg-destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
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
 
   const totalPendente = filteredPedidos.filter(p => p.estado === "pendente").reduce((acc, p) => acc + p.valor, 0);
   const totalConfirmado = filteredPedidos.filter(p => p.estado === "confirmado").reduce((acc, p) => acc + p.valor, 0);

   if (loading) {
     return <LoaderScreen message="A carregar pedidos..." />;
   }

  return (
    <RoleGuard allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="AdminPedidos">
      <LayoutHeader>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-surface-container-low">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                </div>
                <span className="text-xl font-bold text-accent">
                  {formatCurrency(totalPendente)}
                </span>
              </CardHeader>
            </Card>
            <Card className="bg-surface-container-low">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Confirmados</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalConfirmado)}
                </span>
              </CardHeader>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Pesquisar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-muted-foreground placeholder:text-muted-foreground/40 text-sm"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-muted-foreground text-sm"
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
               <Card className="bg-surface-container-low p-8 text-center">
                 <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                 <p className="text-muted-foreground">Nenhum pedido encontrado</p>
               </Card>
             ) : (
               <>
                 {filteredPedidos.slice((page - 1) * pedidosPerPage, page * pedidosPerPage).map((pedido) => (
                   <Card key={pedido.id} className="bg-surface-container-low overflow-hidden">
                     <CardContent className="p-4">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                               <User className="w-5 h-5 text-primary" />
                             </div>
                             <div>
                               <p className="font-medium text-foreground">{pedido.user?.nome || "Utilizador"}</p>
                               <p className="text-xs text-muted-foreground/60">{pedido.user?.email}</p>
                             </div>
                           </div>
                           <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/60">
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
                             <p className="text-2xl font-bold text-primary">{formatCurrency(pedido.valor)}</p>
                             {getEstadoBadge(pedido.estado)}
                           </div>
                           {pedido.estado === "pendente" && (
                             <Button 
                               size="sm" 
                               className="bg-primary hover:bg-primary"
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
                 ))}
                 
                 {/* Paginação */}
                 {filteredPedidos.length > pedidosPerPage && (
                   <div className="flex items-center justify-between pt-4 mt-4 border-t">
                     <p className="text-sm text-muted-foreground">
                       Mostrando {(page - 1) * pedidosPerPage + 1} a {Math.min(page * pedidosPerPage, filteredPedidos.length)} de {filteredPedidos.length} pedidos
                     </p>
                     <div className="flex flex-wrap gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         disabled={page === 1}
                         onClick={() => setPage(page - 1)}
                       >
                         <ChevronLeft className="w-4 h-4 mr-1" />
                         Anterior
                       </Button>
                       <Button
                         variant="outline"
                         size="sm"
                         disabled={page * pedidosPerPage >= filteredPedidos.length}
                         onClick={() => setPage(page + 1)}
                       >
                         Próxima
                         <ChevronRight className="w-4 h-4 ml-1" />
                       </Button>
                     </div>
                   </div>
                 )}
               </>
             )}
           </div>
        </div>
      </LayoutHeader>
    </RoleGuard>
  );
}