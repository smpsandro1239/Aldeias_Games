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
   TrendingUp,
   CheckCircle2,
   XCircle,
   Clock,
   User,
   RefreshCw,
   AlertCircle,
   History,
   Wallet,
   ChevronLeft,
   ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface EntregaSaldo {
   id: string;
   valor: number;
   estado: string;
   observacoes: string | null;
   dataSolicitacao: string;
   dataConfirmacao: string | null;
   dataConclusao: string | null;
   vendedor: {
     nome: string;
     email: string;
     telefone?: string;
   };
   admin: {
     nome: string;
   };
}

export default function AdminEntregasPage() {
   const { user, isAuthenticated, isLoading } = useAuth();
   const [loading, setLoading] = useState(true);
   const [entregas, setEntregas] = useState<EntregaSaldo[]>([]);
   const [filter, setFilter] = useState<string>("todos");
   const [processing, setProcessing] = useState<string | null>(null);
   const [page, setPage] = useState<number>(1);
   const entregasPerPage = 10;
 
   useEffect(() => {
     if (isAuthenticated && user) {
       fetchEntregas();
     } else {
       setLoading(false);
     }
   }, [isAuthenticated, user]);
 
   useEffect(() => {
     setPage(1);
   }, [filter]);

   const fetchEntregas = async () => {
     try {
       const res = await fetch("/api/admin/entregas-saldo", {
         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
       });
      if (res.ok) {
        const data = await res.json();
        setEntregas(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar entregas:", error);
    }
  };

  const handleConfirmar = async (entregaId: string) => {
    setProcessing(entregaId);
    try {
       const res = await fetch(`/api/admin/entregas-saldo/${entregaId}/confirmar`, {
         method: "POST",
         headers: {
           Authorization: `Bearer ${localStorage.getItem("token")}`,
           "Content-Type": "application/json"
         }
       });
      const data = await res.json();
      if (res.ok) {
        toast.success("Entrega confirmada! Saldo transferido.");
        fetchEntregas();
      } else {
        toast.error(data.error || "Erro ao confirmar");
      }
    } catch (error) {
      toast.error("Erro ao confirmar");
    } finally {
      setProcessing(null);
    }
  };

  const handleAcao = async (entregaId: string, acao: 'confirmar' | 'rejeitar' | 'concluir') => {
    setProcessing(entregaId);
    try {
       const res = await fetch("/api/admin/entregas-saldo", {
         method: "PATCH",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${localStorage.getItem("token")}`
         },
         body: JSON.stringify({ entregaId, acao })
       });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          acao === 'confirmar' ? 'Entrega confirmada e saldo transferido!' :
          acao === 'rejeitar' ? 'Entrega rejeitada' :
          'Entrega concluída'
        );
        fetchEntregas();
      } else {
        toast.error(data.error || "Erro ao processar");
      }
    } catch (error) {
      toast.error("Erro ao processar");
    } finally {
      setProcessing(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "solicitado":
        return <Badge className="bg-accent"><Clock className="w-3 h-3 mr-1" />Solicitado</Badge>;
      case "confirmado":
        return <Badge className="bg-secondary"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmado</Badge>;
      case "concluido":
        return <Badge className="bg-primary"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>;
      case "cancelado":
        return <Badge className="bg-destructive"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

   const filteredEntregas = entregas.filter(e => {
     if (filter === "todos") return true;
     return e.estado === filter;
   });
 
   const totalPendente = filteredEntregas
     .filter(e => e.estado === 'solicitado')
     .reduce((acc, e) => acc + e.valor, 0);

  if (loading || !token) {
    return <LoaderScreen message="A carregar entregas..." />;
  }

  return (
    <RoleGuard allowedRoles={["super_admin", "aldeia_admin"]} redirectPath="/" panelName="AdminEntregas">
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
                   <Wallet className="w-5 h-5 text-primary" />
                   <span className="text-sm text-muted-foreground">Entregues</span>
                 </div>
                 <span className="text-xl font-bold text-primary">
                   {formatCurrency(
                     filteredEntregas
                       .filter(e => e.estado === 'concluido')
                       .reduce((acc, e) => acc + e.valor, 0)
                   )}
                 </span>
               </CardHeader>
             </Card>
           </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-muted-foreground text-sm"
            >
              <option value="todos">Todos</option>
              <option value="solicitado">Solicitados</option>
              <option value="confirmado">Confirmados</option>
              <option value="concluido">Concluídos</option>
              <option value="cancelado">Cancelados</option>
            </select>
            <Button variant="outline" size="icon" onClick={fetchEntregas}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

           {/* Lista de Entregas */}
           <div className="space-y-3">
             {filteredEntregas.length === 0 ? (
               <Card className="bg-surface-container-low p-8 text-center">
                 <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                 <p className="text-muted-foreground">Nenhuma entrega encontrada</p>
               </Card>
             ) : (
               <>
                 {filteredEntregas.slice((page - 1) * entregasPerPage, page * entregasPerPage).map((entrega) => (
                   <Card key={entrega.id} className="bg-surface-container-low overflow-hidden">
                     <CardContent className="p-4">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                               <User className="w-5 h-5 text-primary" />
                             </div>
                             <div>
                               <p className="font-medium text-foreground">
                                 {entrega.vendedor?.nome || "Vendedor"}
                               </p>
                               <p className="text-xs text-muted-foreground/60">
                                 {entrega.vendedor?.email}
                               </p>
                               {entrega.vendedor?.telefone && (
                                 <p className="text-xs text-muted-foreground/60">
                                   {entrega.vendedor.telefone}
                                 </p>
                               )}
                             </div>
                           </div>
                           <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/60">
                             <span>{formatDate(entrega.dataSolicitacao)}</span>
                             {entrega.admin && (
                               <>
                                 <span>•</span>
                                 <span>Admin: {entrega.admin.nome}</span>
                               </>
                             )}
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="text-right">
                             <p className="text-2xl font-bold text-primary">
                               {formatCurrency(entrega.valor)}
                             </p>
                             {getEstadoBadge(entrega.estado)}
                           </div>
                           {entrega.estado === "solicitado" && (
                             <div className="flex gap-2">
                               <Button
                                 size="sm"
                                 className="bg-primary hover:bg-primary"
                                 onClick={() => handleAcao(entrega.id, 'confirmar')}
                                 disabled={processing === entrega.id}
                               >
                                 {processing === entrega.id ? (
                                   <RefreshCw className="w-4 h-4 animate-spin" />
                                 ) : (
                                   <CheckCircle2 className="w-4 h-4 mr-1" />
                                 )}
                                 Confirmar
                               </Button>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 className="border-red-500 text-destructive hover:bg-destructive/10"
                                 onClick={() => handleAcao(entrega.id, 'rejeitar')}
                                 disabled={processing === entrega.id}
                               >
                                 <XCircle className="w-4 h-4" />
                               </Button>
                             </div>
                           )}
                           {entrega.estado === "confirmado" && (
                             <Button
                               size="sm"
                               className="bg-secondary hover:bg-blue-600"
                               onClick={() => handleAcao(entrega.id, 'concluir')}
                               disabled={processing === entrega.id}
                             >
                               {processing === entrega.id ? (
                                 <RefreshCw className="w-4 h-4 animate-spin" />
                               ) : (
                                 <CheckCircle2 className="w-4 h-4 mr-1" />
                               )}
                               Marcar como Entregue
                             </Button>
                           )}
                         </div>
                       </div>
                       {entrega.observacoes && (
                         <div className="mt-3 p-2 bg-[#1a1817] rounded text-xs text-muted-foreground/70">
                           <strong>Nota:</strong> {entrega.observacoes}
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 ))}
                 
                 {/* Paginação */}
                 {filteredEntregas.length > entregasPerPage && (
                   <div className="flex items-center justify-between pt-4 mt-4 border-t">
                     <p className="text-sm text-muted-foreground">
                       Mostrando {(page - 1) * entregasPerPage + 1} a {Math.min(page * entregasPerPage, filteredEntregas.length)} de {filteredEntregas.length} entregas
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
                         disabled={page * entregasPerPage >= filteredEntregas.length}
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
