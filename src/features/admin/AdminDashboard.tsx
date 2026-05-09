"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";

import { StatCard } from "@/components/ui/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

import {
   LayoutDashboard, Calendar, Gamepad2, Users, DollarSign, Plus, Globe,
   BarChart3, Hash, Wallet, TrendingUp, Building2, CreditCard, Shield,
   Eye, Trophy
} from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { logJogoToggle } from "@/lib/audit";

import {
   CreateEventoModal,
   CreateJogoModal,
   ConfirmModal,
   AldeiaModal,
   UserModal,
   ResultadosExternosModal,
   QRCodeGenerator,
   SorteioModal,
} from "@/components/modals";
import { VerificarHashModal } from "@/components/verificar-hash-modal";

import { DashboardAnalytics } from "./analytics-dashboard";

import {
   OverviewTab,
   EventosTab,
   JogosTab,
   VencedoresTab,
   UsersTab,
   ComissoesTab,
   VerificarTab,
 } from "./components";

// Lazy load heavy tabs (they are in the components index)
const AldeiasTab = lazy(() => import("./components").then(mod => ({ default: mod.AldeiasTab })));
const TransacoesTab = lazy(() => import("./components").then(mod => ({ default: mod.TransacoesTab })));
const AuditoriaTab = lazy(() => import("./components").then(mod => ({ default: mod.AuditoriaTab })));

import type {
  Stats,
  Evento,
  Jogo,
  User,
  Vencedor,
  Aldeia,
  Transacao,
  Log,
  VendedorStats,
} from "./components";
import type { JogoData } from "@/components/modals/create-jogo-modal";
import type { AldeiaData } from "@/components/modals/aldeia-modal";
import type { UserData } from "@/components/modals/user-modal";

interface AdminDashboardProps {
  token: string;
  aldeiaId?: string;
  userRole?: string;
  aldeia?: {
    id: string;
    nome: string;
    slug: string;
    tipoOrganizacao: string;
    logoUrl?: string;
    metodosPagamentoDefault?: string;
  };
}

export default function AdminDashboard({
  token,
  aldeiaId,
  userRole = "aldeia_admin",
  aldeia,
}: AdminDashboardProps) {
   const router = useRouter();
   const queryClient = useQueryClient();

   // Estados principais
   const [activeTab, setActiveTab] = useState("overview");
   const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<Stats | null>({
    totalEventos: 0,
    eventosAtivos: 0,
    totalJogos: 0,
    jogosAtivos: 0,
    totalParticipacoes: 0,
    totalAngariado: 0
  });
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [vencedores, setVencedores] = useState<Vencedor[]>([]);
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [vendedoresStats, setVendedoresStats] = useState<VendedorStats[]>([]);

  const [pedidosPendentesCount, setPedidosPendentesCount] = useState(0);
  const [entregasPendentesCount, setEntregasPendentesCount] = useState(0);

  // Estados dos modals
  const [eventoModalOpen, setEventoModalOpen] = useState(false);
  const [jogoModalOpen, setJogoModalOpen] = useState(false);
  const [aldeiaModalOpen, setAldeiaModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [convertPrizeOpen, setConvertPrizeOpen] = useState(false);
  const [confirmEntregaOpen, setConfirmEntregaOpen] = useState(false);
  const [verificarHashOpen, setVerificarHashOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [resultadosExternosOpen, setResultadosExternosOpen] = useState(false);
  const [testJogoOpen, setTestJogoOpen] = useState(false);

  // Seleções
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [selectedJogo, setSelectedJogo] = useState<JogoData | null>(null);
  const [selectedAldeia, setSelectedAldeia] = useState<AldeiaData | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedPremio, setSelectedPremio] = useState<Vencedor | null>(null);
  const [convertValor, setConvertValor] = useState("25");
  const [qrCodeData, setQrCodeData] = useState<{ jogoId?: string; eventoId?: string; aldeiaSlug?: string; type: "jogo" | "evento" | "aldeia" } | null>(null);
  const [testJogo, setTestJogo] = useState<Jogo | null>(null);
  const [testJogoTotalParticipacoes, setTestJogoTotalParticipacoes] = useState(0);
  const [deleteData, setDeleteData] = useState<{ type: string; id: string } | null>(null);
  const [toggleJogoData, setToggleJogoData] = useState<{ jogo: Jogo; novoEstado: 'aberto' | 'fechado' } | null>(null);

  const [paymentMethodsDefault, setPaymentMethodsDefault] = useState<string[]>(["saldo", "dinheiro"]);
  const [selectedEventoIdParaJogo, setSelectedEventoIdParaJogo] = useState("");
  const [filtroEventoId, setFiltroEventoId] = useState<string | null>(null);

  // ==================== FETCH DATA OTIMIZADO ====================
  const getApi = useCallback(async (url: string, revalidate: number = 30) => {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data ?? json;
      }
      return null;
    } catch (error) {
      console.error("Erro na requisição:", url, error);
      return null;
    }
  }, [token]);

  const fetchPedidosPendentes = useCallback(async () => {
    try {
      const q = aldeiaId ? `?aldeiaId=${aldeiaId}&estado=pendente` : "?estado=pendente";
      const res = await fetch(`/api/admin/pedidos-carregamento${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPedidosPendentesCount(data.data?.length || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos pendentes:", error);
    }
  }, [token, aldeiaId]);

  const fetchEntregasPendentes = useCallback(async () => {
    try {
      const q = aldeiaId ? `?aldeiaId=${aldeiaId}&estado=solicitado` : "?estado=solicitado";
      const res = await fetch(`/api/admin/entregas-saldo${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEntregasPendentesCount(data.data?.length || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar entregas pendentes:", error);
    }
  }, [token, aldeiaId]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);

    try {
      const q = aldeiaId ? `?aldeiaId=${aldeiaId}` : "";

      // Dados ESSENCIAIS (carregados sempre, revalidate curto)
      const [st, ev, jg, us, vencedoresData] = await Promise.all([
        getApi(`/api/dashboard/stats${q}`, 20),
        getApi(`/api/eventos${q}`, 30),
        getApi(`/api/jogos${q}`, 30),
        getApi(`/api/users${q}`, 40),
        getApi(`/api/participacoes${q}${q ? '&' : '?'}ganhador=true`, 30),
      ]);

      setStats(st || null);
      setEventos(ev || []);
      setJogos(jg || []);
      setUsers(us || []);
      setVencedores(vencedoresData || []);

      // Dados SECUNDÁRIOS (apenas para super_admin, revalidate longo)
      if (userRole === "super_admin") {
        const [al, tr, lg] = await Promise.all([
          getApi(`/api/aldeias`, 60),
          getApi(`/api/admin/transacoes`, 40),
          getApi(`/api/admin/logs`, 60),
        ]);
        setAldeias(al || []);
        setTransacoes(tr || []);
        setLogs(lg || []);
      }

      // Dados específicos para aldeia_admin
      if (userRole === "aldeia_admin") {
        const vs = await getApi(`/api/admin/vendedores-stats`, 60);
        setVendedoresStats(vs || []);
      }

      // Contadores pendentes
      await Promise.all([fetchPedidosPendentes(), fetchEntregasPendentes()]);

    } catch (error) {
      toast.error("Erro ao carregar dados do dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token, aldeiaId, userRole, getApi, fetchPedidosPendentes, fetchEntregasPendentes]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Carregar payment methods defaults
  useEffect(() => {
    if (aldeia?.metodosPagamentoDefault) {
      try {
        const defaults = JSON.parse(aldeia.metodosPagamentoDefault);
        setPaymentMethodsDefault(defaults);
      } catch {
        setPaymentMethodsDefault(["saldo", "dinheiro"]);
      }
    }
  }, [aldeia]);

  // ==================== HANDLERS ====================

  const handleSaveEvento = useCallback(async (data: any) => {
    console.log('handleSaveEvento called with data:', data);
    const isEditing = !!data.id;
    const jogosSelecionados = data.jogosSelecionados || [];
    const eventoData = { ...data };
    delete eventoData.jogosSelecionados;

    const url = isEditing ? `/api/eventos/${data.id}` : `/api/eventos`;
    const method = isEditing ? "PUT" : "POST";

    console.log('Making request to:', url, 'with method:', method, 'data:', eventoData);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventoData),
      });

      console.log('Response status:', res.status, 'ok:', res.ok);

      if (res.ok) {
        const evento = await res.json();
        const eventoId = evento.data?.id || evento.id;

        // Criar jogos automaticamente se selecionados
        if (!isEditing && jogosSelecionados.length > 0 && eventoId) {
          for (const tipoJogo of jogosSelecionados) {
            const jogoData = {
              nome: `${data.nome} - ${tipoJogo}`,
              tipo: tipoJogo,
              configuracao: "{}",
              preco: tipoJogo === 'tombola' ? 5 : tipoJogo === 'rifa' ? 2 : 3,
              precoBase: tipoJogo === 'tombola' ? 5 : tipoJogo === 'rifa' ? 2 : 3,
              stockInicial: 100,
              eventoId,
              aldeiaId: data.aldeiaId,
              estado: "aberto",
            };

            await fetch("/api/jogos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(jogoData),
            });
          }
          toast.success(`${jogosSelecionados.length} jogo(s) criado(s) para o evento!`);
        }

        toast.success(`Evento ${isEditing ? "atualizado" : "criado"} com sucesso!`);
        fetchData();
        setEventoModalOpen(false);
      } else {
        const err = await res.json();
        console.error('API error response:', err);
        throw new Error(err.error || "Erro ao salvar evento");
      }
    } catch (error: any) {
      console.error('handleSaveEvento error:', error);
      toast.error(error.message || "Erro ao salvar evento");
    }
  }, [token, fetchData, setEventoModalOpen]);

  const handleSaveJogo = useCallback(async (data: any) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/jogos/${data.id}` : `/api/jogos`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Jogo ${isEditing ? "atualizado" : "criado"} com sucesso!`);
        fetchData();
        setJogoModalOpen(false);
      } else {
        const errorMsg = result.error || result.details?.map((d: any) => d.message).join(', ') || "Erro ao salvar jogo";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      if (!error.message) {
        toast.error("Erro ao salvar jogo");
      }
      throw error;
    }
  }, [token, fetchData, setJogoModalOpen]);

   const handleToggleJogoEstado = useCallback((jogo: Jogo) => {
     const novoEstado = jogo.estado === 'aberto' ? 'fechado' : 'aberto';
     setToggleJogoData({ jogo, novoEstado });
   }, []);

   const handleTestarJogo = useCallback(async (jogo: Jogo) => {
     setTestJogo(jogo);
     // Buscar total de participações concluídas do jogo (apenas pagamentos confirmados)
     try {
       const res = await fetch(`/api/participacoes?jogoId=${jogo.id}&estadoPagamento=concluido&page=1&limit=1`, {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (res.ok) {
         const data = await res.json();
         const total = data.pagination?.total || 0;
         setTestJogoTotalParticipacoes(total);
       } else {
         console.error("Erro ao buscar participações:", res.status);
         setTestJogoTotalParticipacoes(0);
       }
     } catch (error) {
       console.error("Erro ao buscar participações:", error);
       setTestJogoTotalParticipacoes(0);
     }
      setTestJogoOpen(true);
    }, [token]);

   const executeToggleJogoEstado = useCallback(async () => {
     if (!toggleJogoData) return;
     const { jogo, novoEstado } = toggleJogoData;
     try {
       const res = await fetch(`/api/jogos/${jogo.id}`, {
         method: "PUT",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ estado: novoEstado }),
       });
       const data = await res.json();
       if (res.ok) {
         toast.success(`Jogo ${novoEstado === 'aberto' ? 'ativado' : 'desativado'} com sucesso!`);
         fetchData();

         // Log de auditoria (TODO: obter userId real)
         logJogoToggle(
           userRole, // usando role como identifier temporário
           jogo.id,
           jogo.nome,
           jogo.estado,
           novoEstado
         );
       } else {
         toast.error(data.error || "Erro ao alterar estado do jogo");
       }
     } catch (error) {
       toast.error("Erro de conexão ao alterar estado do jogo");
     } finally {
       setToggleJogoData(null);
     }
   }, [toggleJogoData, token, fetchData, userRole]);

  const handleSaveAldeia = useCallback(async (data: any) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/aldeias/${data.id}` : `/api/aldeias`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(`Organização ${isEditing ? "atualizada" : "criada"} com sucesso!`);
        fetchData();
        setAldeiaModalOpen(false);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar organização");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar organização");
    }
  }, [token, fetchData, setAldeiaModalOpen]);

  const handleSaveUser = useCallback(async (data: any) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/users/${data.id}` : `/api/users`;
    const method = isEditing ? "PUT" : "POST";

    let userData = { ...data };

    if (userRole === "aldeia_admin" && aldeiaId) {
      userData.aldeiaId = aldeiaId;
      if (data.role === "aldeia_admin") {
        throw new Error("Não tem permissão para criar administradores de aldeia");
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (res.ok) {
        toast.success(`Utilizador ${isEditing ? "atualizado" : "criado"} com sucesso!`);
        fetchData();
        setUserModalOpen(false);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar utilizador");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar utilizador");
    }
  }, [token, fetchData, setUserModalOpen, userRole, aldeiaId]);

  const handleConvertPrize = useCallback(async (participacaoId: string, valor: number) => {
    try {
      const res = await fetch("/api/admin/convert-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ participacaoId, valor }),
      });

      if (res.ok) {
        toast.success("Prémio convertido em saldo com sucesso!");
        fetchData();
        setConvertPrizeOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao converter prémio");
      }
    } catch (error) {
      toast.error("Erro ao converter prémio");
    }
  }, [token, fetchData, setConvertPrizeOpen]);

  const requestDelete = useCallback((type: string, id: string) => {
    setDeleteData({ type, id });
    // Abrir modal de confirmação - o estado confirmDeleteOpen não existe, usaremos deleteData não nulo
    // Vamos usar um modal ConfirmModal que observa deleteData
  }, [setDeleteData]);

  const executeDelete = useCallback(async () => {
    if (!deleteData) return;

    const urls: Record<string, string> = {
      evento: `/api/eventos/${deleteData.id}`,
      jogo: `/api/jogos/${deleteData.id}`,
      aldeia: `/api/aldeias/${deleteData.id}`,
      user: `/api/users/${deleteData.id}`,
    };

    try {
      const res = await fetch(urls[deleteData.type], {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Eliminado com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao eliminar");
      }
    } catch (error) {
      toast.error("Erro ao eliminar");
    } finally {
      setDeleteData(null);
    }
  }, [deleteData, token, fetchData]);

  const getEstadoBadge = useCallback((estado: string) => {
    const variants: Record<string, any> = {
      rascunho: "secondary",
      ativo: "default",
      aberto: "default",
      pausado: "warning",
      fechado: "destructive",
      finalizado: "outline",
    };
    return <Badge variant={variants[estado] || "default"}>{estado}</Badge>;
  }, []);

  const handleVerJogos = useCallback((eventoId: string) => {
    setSelectedEventoIdParaJogo(eventoId);
    setFiltroEventoId(eventoId);
    setActiveTab("jogos");
  }, []);

  const handleLimparFiltroJogos = useCallback(() => {
    setFiltroEventoId(null);
    setSelectedEventoIdParaJogo("");
  }, []);

  // ==================== CONVERSIONS ====================
  // Convert API types to modal data types for editing

  const convertJogoToJogoData = useCallback((jogo: Jogo): JogoData => {
    let config: Record<string, unknown> = {};
    if (jogo.configuracao) {
      try {
        config = JSON.parse(jogo.configuracao);
      } catch {
        config = {};
      }
    }
    const jogoData: JogoData = {
      id: jogo.id,
      nome: jogo.nome,
      tipo: jogo.tipo as "poio_da_vaca" | "rifa" | "tombola" | "raspadinha",
      descricao: (jogo as any).descricao,
      preco: jogo.preco,
      stockInicial: jogo.stockInicial ?? 100,
      limitePorUsuario: (config.limitePorUsuario as number) ?? 10,
      eventoId: jogo.eventoId,
      configuracao: config,
    };
    // Optional fields from config
    if (config.modoSorteio === "app" || config.modoSorteio === "externo") {
      jogoData.modoSorteio = config.modoSorteio;
    }
    if (typeof config.detalhesSorteioExterno === "string") {
      jogoData.detalhesSorteioExterno = config.detalhesSorteioExterno;
    }
    if (Array.isArray(config.premios)) {
      jogoData.premios = config.premios;
    }
    if (typeof config.custoQuadrado === "number") {
      jogoData.custoQuadrado = config.custoQuadrado;
    }
    if (typeof config.valorMercadoVaca === "number") {
      jogoData.valorMercadoVaca = config.valorMercadoVaca;
    }
    if (typeof config.valorCompraVaca === "number") {
      jogoData.valorCompraVaca = config.valorCompraVaca;
    }
    if (typeof config.dimensoesCampo === "string") {
      jogoData.dimensoesCampo = config.dimensoesCampo;
    }
    if (typeof config.permitirStripe === "boolean") {
      jogoData.permitirStripe = config.permitirStripe;
    }
    return jogoData;
  }, []);

  const convertAldeiaToAldeiaData = useCallback((aldeia: Aldeia): AldeiaData => {
    return {
      id: aldeia.id,
      nome: aldeia.nome,
      tipoOrganizacao: aldeia.tipoOrganizacao as "aldeia" | "escola" | "associacao_pais" | "clube",
      descricao: (aldeia as any).descricao,
      telefone: (aldeia as any).telefone,
      email: aldeia.email,
    };
  }, []);

  const convertUserToUserData = useCallback((user: User): UserData => {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      password: undefined,
      role: user.role as "super_admin" | "aldeia_admin" | "vendedor" | "user",
      telefone: user.telefone,
      aldeiaId: user.aldeiaId,
    };
  }, []);

  // Wrapped setters for tabs to convert API types to modal types
  const handleSetSelectedJogo = useCallback((jogo: Jogo | null) => {
    setSelectedJogo(jogo ? convertJogoToJogoData(jogo) : null);
  }, [convertJogoToJogoData]);

  const handleSetSelectedAldeia = useCallback((aldeia: Aldeia | null) => {
    setSelectedAldeia(aldeia ? convertAldeiaToAldeiaData(aldeia) : null);
  }, [convertAldeiaToAldeiaData]);

  const handleSetSelectedUser = useCallback((user: User | null) => {
    setSelectedUser(user ? convertUserToUserData(user) : null);
  }, [convertUserToUserData]);

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 bg-muted animate-pulse rounded" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-32">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-4" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {userRole === "super_admin"
              ? "Painel Global"
              : userRole === "aldeia_admin"
              ? "O Meu Painel"
              : "Dashboard"}
          </h1>
          {userRole === "aldeia_admin" && aldeia && (
            <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
              {aldeia.nome}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
          {userRole === "super_admin" && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAldeia(null);
                setAldeiaModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Nova Aldeia
            </Button>
          )}
          <Button
            onClick={() => {
              setSelectedEvento(null);
              setEventoModalOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Evento
          </Button>
          <Button
            variant="outline"
            onClick={() => setResultadosExternosOpen(true)}
            className="w-full sm:w-auto"
          >
            <Globe className="h-4 w-4 mr-2" /> Lotaria Externa
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Angariado"
          value={stats?.totalAngariado ? formatCurrency(stats.totalAngariado) : "0,00 €"}
          variant="emerald"
          icon={DollarSign}
        />
        <StatCard
          title="Participações"
          value={stats?.totalParticipacoes?.toLocaleString('pt-PT') || "0"}
          variant="blue"
          icon={Users}
        />
        <StatCard
          title="Eventos Ativos"
          value={stats?.eventosAtivos?.toString() || "0"}
          variant="violet"
          icon={Calendar}
        />
        <StatCard
          title="Jogos Ativos"
          value={stats?.jogosAtivos?.toString() || "0"}
          variant="amber"
          icon={Gamepad2}
        />
      </div>

      {/* Tabs - Divididas em 2 grupos para melhor responsividade */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-5">

        {/* ==================== GRUPO 1: TABS PRINCIPAIS ==================== */}
        <div className="relative">
          {/* Gradientes indicadores de overflow */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-surface to-transparent opacity-0 md:opacity-100 pointer-events-none z-10" aria-hidden="true" />
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-surface to-transparent opacity-0 md:opacity-100 pointer-events-none z-10" aria-hidden="true" />
          
          <TabsList className="flex overflow-x-auto pb-2 gap-1 md:gap-2 justify-start md:justify-center whitespace-nowrap scroll-smooth snap-x snap-mandatory">
            <TabsTrigger value="overview" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <LayoutDashboard className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <BarChart3 className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="eventos" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <Calendar className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="jogos" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <Gamepad2 className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Jogos</span>
            </TabsTrigger>
            <TabsTrigger value="vencedores" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <Trophy className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Vencedores</span>
            </TabsTrigger>

            {/* Pedidos e Entregas (navegação externa) */}
            <TabsTrigger value="pedidos" onClick={() => router.push('/admindashboard/pedidos')} className="flex-shrink-0 relative text-sm md:text-base px-3 md:px-4 py-2">
              <Wallet className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Pedidos</span>
              {pedidosPendentesCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-foreground text-xs">
                  {pedidosPendentesCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="entregas" onClick={() => router.push('/admindashboard/entregas')} className="flex-shrink-0 relative text-sm md:text-base px-3 md:px-4 py-2">
              <TrendingUp className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Entregas</span>
              {entregasPendentesCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-foreground text-xs">
                  {entregasPendentesCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="verificar" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <Hash className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Verificar</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ==================== GRUPO 2: TABS ADMINISTRATIVAS ==================== */}
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 pl-1">Administração</p>
          
          {/* Gradientes indicadores de overflow */}
          <div className="absolute left-0 top-8 bottom-0 w-4 bg-gradient-to-r from-surface to-transparent opacity-0 md:opacity-100 pointer-events-none z-10" aria-hidden="true" />
          <div className="absolute right-0 top-8 bottom-0 w-4 bg-gradient-to-l from-surface to-transparent opacity-0 md:opacity-100 pointer-events-none z-10" aria-hidden="true" />
          
          <TabsList className="flex overflow-x-auto pb-2 gap-1 md:gap-2 justify-start md:justify-center whitespace-nowrap scroll-smooth">
            <TabsTrigger value="users" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <Users className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Utilizadores</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>

            {userRole === "aldeia_admin" && (
              <TabsTrigger value="comissoes" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
                <DollarSign className="h-4 w-4 mr-1 md:mr-2" />
                Comissões
              </TabsTrigger>
            )}

            {userRole === "super_admin" && (
              <>
                <TabsTrigger value="aldeias" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
                  <Building2 className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Aldeias</span>
                </TabsTrigger>
                <TabsTrigger value="transacoes" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
                  <CreditCard className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Transações</span>
                  <span className="sm:hidden">Trans.</span>
                </TabsTrigger>
                <TabsTrigger value="auditoria" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
                  <Shield className="h-4 w-4 mr-1 md:mr-2" />
                  Auditoria
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <OverviewTab
            stats={stats}
            eventos={eventos}
            setSelectedEvento={setSelectedEvento}
            setEventoModalOpen={setEventoModalOpen}
            setJogoModalOpen={setJogoModalOpen}
            getEstadoBadge={getEstadoBadge}
            userRole={userRole}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <DashboardAnalytics token={token} aldeiaId={aldeiaId} />
        </TabsContent>

        {/* Eventos Tab */}
        <TabsContent value="eventos">
          <EventosTab
            eventos={eventos}
            setSelectedEvento={setSelectedEvento}
            setEventoModalOpen={setEventoModalOpen}
            setJogoModalOpen={setJogoModalOpen}
            requestDelete={requestDelete}
            getEstadoBadge={getEstadoBadge}
            onVerJogos={handleVerJogos}
          />
        </TabsContent>

        {/* Jogos Tab */}
         <TabsContent value="jogos">
           <JogosTab
             jogos={jogos}
             eventos={eventos}
             userRole={userRole}
             selectedEventoIdParaJogo={selectedEventoIdParaJogo}
             setSelectedJogo={handleSetSelectedJogo}
             setJogoModalOpen={setJogoModalOpen}
             setSelectedEventoIdParaJogo={setSelectedEventoIdParaJogo}
             setQrCodeData={setQrCodeData}
             setQrCodeOpen={setQrCodeOpen}
             handleTestarJogo={handleTestarJogo}
             setTestJogoOpen={setTestJogoOpen}
             requestDelete={requestDelete}
             getEstadoBadge={getEstadoBadge}
             onToggleEstado={handleToggleJogoEstado}
             filtroEventoId={filtroEventoId}
             onLimparFiltro={handleLimparFiltroJogos}
           />
        </TabsContent>

        {/* Vencedores Tab */}
        <TabsContent value="vencedores">
          <VencedoresTab
            vencedores={vencedores}
            setSelectedPremio={setSelectedPremio}
            setConvertPrizeOpen={setConvertPrizeOpen}
            setConfirmEntregaOpen={setConfirmEntregaOpen}
            token={token}
          />
        </TabsContent>

        {/* Verificar Tab */}
        <TabsContent value="verificar">
          <VerificarTab setVerificarHashOpen={setVerificarHashOpen} />
        </TabsContent>

         {/* Users Tab */}
         <TabsContent value="users">
           <UsersTab
             users={users}
             setSelectedUser={handleSetSelectedUser}
             setUserModalOpen={setUserModalOpen}
             requestDelete={requestDelete}
           />
         </TabsContent>

         {/* Comissões Tab (apenas aldeia_admin) */}
         {userRole === "aldeia_admin" && (
           <TabsContent value="comissoes">
             <ComissoesTab
               vendedoresStats={vendedoresStats}
               setSelectedUser={handleSetSelectedUser}
               setUserModalOpen={setUserModalOpen}
             />
           </TabsContent>
         )}

         {/* Aldeias Tab (apenas super_admin) */}
         {userRole === "super_admin" && (
           <TabsContent value="aldeias">
             <Suspense fallback={<div>Carregando...</div>}>
               <AldeiasTab
                 aldeias={aldeias}
                 setSelectedAldeia={handleSetSelectedAldeia}
                 setAldeiaModalOpen={setAldeiaModalOpen}
                 requestDelete={requestDelete}
               />
             </Suspense>
           </TabsContent>
         )}

        {/* Transações Tab (apenas super_admin) */}
        {userRole === "super_admin" && (
          <TabsContent value="transacoes">
            <Suspense fallback={<div>Carregando...</div>}>
              <TransacoesTab transacoes={transacoes} />
            </Suspense>
          </TabsContent>
        )}

        {/* Auditoria Tab (apenas super_admin) */}
        {userRole === "super_admin" && (
          <TabsContent value="auditoria">
            <Suspense fallback={<div>Carregando...</div>}>
              <AuditoriaTab logs={logs} />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>

      {/* ==================== MODALS ==================== */}
      <CreateEventoModal
        open={eventoModalOpen}
        onOpenChange={setEventoModalOpen}
        onSubmit={handleSaveEvento}
        aldeiaId={aldeiaId || ""}
        initialData={selectedEvento ? {
          id: selectedEvento.id,
          nome: selectedEvento.nome,
          descricao: selectedEvento.descricao,
          dataInicio: selectedEvento.dataInicio,
          dataFim: selectedEvento.dataFim,
          objectivoAngariacao: selectedEvento.objectivoAngariacao || selectedEvento.totalAngariado,
          publico: selectedEvento.publico || false,
          aldeiaId: selectedEvento.aldeiaId || aldeiaId || "",
          estado: selectedEvento.estado as any,
        } : undefined}
        aldeias={userRole === "super_admin" ? aldeias : undefined}
      />

        <CreateJogoModal
          open={jogoModalOpen}
          onOpenChange={setJogoModalOpen}
          onSubmit={handleSaveJogo}
          eventoId={selectedEventoIdParaJogo}
          initialData={selectedJogo ?? undefined}
          userRole={userRole}
          token={token}
          aldeiaId={aldeiaId}
          metodosPagamentoDefault={paymentMethodsDefault}
        />

        <AldeiaModal
          open={aldeiaModalOpen}
          onOpenChange={setAldeiaModalOpen}
          onSubmit={handleSaveAldeia}
          initialData={selectedAldeia ?? undefined}
        />

        <UserModal
          open={userModalOpen}
          onOpenChange={setUserModalOpen}
          onSubmit={handleSaveUser}
          initialData={selectedUser ?? undefined}
          aldeias={aldeia ? [aldeia] : (userRole === "super_admin" ? aldeias : [])}
          currentUserRole={userRole}
        />

      <ConfirmModal
        open={!!deleteData}
        onOpenChange={() => setDeleteData(null)}
        title="Confirmar Eliminação"
        description="Esta ação não pode ser desfeita. Tem a certeza que deseja eliminar?"
        onConfirm={executeDelete}
       />

       {/* Confirmação de toggle de estado do jogo */}
       <ConfirmModal
         open={!!toggleJogoData}
         onOpenChange={(open) => {
           if (!open) setToggleJogoData(null);
         }}
         title={toggleJogoData?.novoEstado === 'fechado' ? "Desativar Jogo" : "Ativar Jogo"}
         description={
           toggleJogoData ? (
             <div className="space-y-2">
               <p>
                 Tem a certeza que deseja <strong>{toggleJogoData.novoEstado === 'fechado' ? 'DESATIVAR' : 'ATIVAR'}</strong> o jogo:
               </p>
               <p className="font-semibold">{toggleJogoData.jogo.nome}</p>
               {toggleJogoData.novoEstado === 'fechado' && (
                 <p className="text-sm text-muted-foreground">
                   Participações futuras serão bloqueadas. Participações existentes mantêm-se.
                 </p>
               )}
               {toggleJogoData.novoEstado === 'aberto' && (
                 <p className="text-sm text-muted-foreground">
                   O jogo voltará a aceitar novas participações.
                 </p>
               )}
             </div>
           ) : undefined
         }
         confirmText={toggleJogoData?.novoEstado === 'fechado' ? 'Desativar' : 'Ativar'}
         variant={toggleJogoData?.novoEstado === 'fechado' ? 'destructive' : 'default'}
         onConfirm={executeToggleJogoEstado}
       />

       {/* Outros modais */}
      <ResultadosExternosModal
        open={resultadosExternosOpen}
        onOpenChange={setResultadosExternosOpen}
        token={token}
      />

      <VerificarHashModal
        open={verificarHashOpen}
        onOpenChange={setVerificarHashOpen}
        token={token}
      />

      <QRCodeGenerator
        open={qrCodeOpen}
        onOpenChange={setQrCodeOpen}
        data={qrCodeData || { type: "jogo" }}
        title="Partilhar Jogo"
      />

      {/* Modal Converter Prémio em Saldo */}
      <ConfirmModal
        open={convertPrizeOpen}
        onOpenChange={setConvertPrizeOpen}
        title="Converter Prémio em Saldo"
        description={
          <div className="space-y-4">
            <p>Introduza o valor a creditar na carteira do utilizador:</p>
            <Input
              type="number"
              value={convertValor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConvertValor(e.target.value)}
              placeholder="Valor em euros"
            />
          </div>
        }
        confirmText="Converter"
        onConfirm={() => {
          const valor = parseFloat(convertValor);
          if (selectedPremio && !isNaN(valor) && valor > 0) {
            handleConvertPrize(selectedPremio.id, valor);
          }
        }}
      />

      {/* Modal Confirmar Entrega */}
      <ConfirmModal
        open={confirmEntregaOpen}
        onOpenChange={setConfirmEntregaOpen}
        title="Confirmar Entrega"
        description="Tem a certeza que deseja marcar este prémio como entregue fisicamente?"
        onConfirm={async () => {
          if (selectedPremio) {
            const res = await fetch(`/api/participacoes/${selectedPremio.id}`, {
              method: 'PUT',
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ premioEntregue: true })
            });
            if(res.ok) { toast.success("Marcado como entregue"); fetchData(); }
          }
        }}
      />

      {/* Modal Testar Jogo (Super Admin) */}
      <Dialog open={testJogoOpen} onOpenChange={setTestJogoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-secondary" />
              Testar Jogo: {testJogo?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              Esta funcionalidade permite testar o jogo em modo fictício, sem afectar dados reais.
              O sorteio será executado usando as participações existentes e os vencedores serão determinados aleatoriamente.
            </p>
            {testJogoTotalParticipacoes === 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Não há participações para este jogo. Cria participações primeiro para testar.
                </AlertDescription>
              </Alert>
            )}
            {/* SorteioModal para executar sorteios de teste */}
            {testJogo && testJogoTotalParticipacoes > 0 && (
              <SorteioModal
                open={testJogoOpen}
                onOpenChange={setTestJogoOpen}
                jogoNome={testJogo.nome}
                totalParticipacoes={testJogoTotalParticipacoes}
                onExecutarSorteio={async (observacoes?: string) => {
                  try {
                    const res = await fetch('/api/sorteios/teste', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ jogoId: testJogo.id, observacoes }),
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      return { success: false, error: json.error || 'Erro ao executar teste' };
                    }
                    // Recarregar dados após teste
                    fetchData();
                    return {
                      success: true,
                      data: {
                        resultado: json.data.resultado,
                        vencedores: json.data.vencedores,
                        hash: json.data.hash,
                        seed: json.data.seed,
                      },
                    };
                  } catch (error) {
                    console.error('Erro no teste de sorteio:', error);
                    return { success: false, error: 'Erro interno do servidor' };
                  }
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
