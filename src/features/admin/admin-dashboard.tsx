"use client";

import { StatCard } from "@/components/ui/StatCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  LayoutDashboard, Calendar, Gamepad2, Users, DollarSign, Plus, Edit, Trash2, Eye, Play, Trophy, Building2, Power, PowerOff, Globe, BarChart3, Hash, Shield, CreditCard, Sparkles, Grid3X3, Ticket, QrCode, ShoppingCart
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreateEventoModal, CreateJogoModal, SorteioModal, ConfirmModal, AldeiaModal, UserModal, ResultadosExternosModal } from "@/components/modals";
import { GameQuickActions } from "@/components/game-quick-actions";
import { VerificarHashModal } from "@/components/verificar-hash-modal";
import { QRCodeGenerator } from "@/components/qr-code-generator";
import { DashboardAnalytics } from "./analytics-dashboard";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";

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
  };
}

interface Stats {
  totalEventos: number;
  eventosAtivos: number;
  totalJogos: number;
  jogosAtivos: number;
  totalParticipacoes: number;
  totalAngariado: number;
}

export function AdminDashboard({ token, aldeiaId, userRole = "aldeia_admin", aldeia }: AdminDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [jogos, setJogos] = useState<any[]>([]);
  const [aldeias, setAldeias] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [participacoes, setParticipacoes] = useState<any[]>([]);
  const [vencedores, setVencedores] = useState<any[]>([]);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [vendedoresStats, setVendedoresStats] = useState<any[]>([]);

  // Modals state
  const [eventoModalOpen, setEventoModalOpen] = useState(false);
  const [jogoModalOpen, setJogoModalOpen] = useState(false);
  const [aldeiaModalOpen, setAldeiaModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [sorteioOpen, setSorteioOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [resultadosExternosOpen, setResultadosExternosOpen] = useState(false);
  
  // Modal de converter prémio em saldo
  const [convertPrizeOpen, setConvertPrizeOpen] = useState(false);
  const [selectedPremio, setSelectedPremio] = useState<any>(null);
  const [convertValor, setConvertValor] = useState("25");
  
  // Modal de confirmar entrega
  const [confirmEntregaOpen, setConfirmEntregaOpen] = useState(false);

  // Modal de verificar hash
  const [verificarHashOpen, setVerificarHashOpen] = useState(false);

  // Modal de QR Code
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{jogoId?: string; eventoId?: string; aldeiaSlug?: string; type: "jogo" | "evento" | "aldeia"} | null>(null);

  // Selections
  const [selectedEvento, setSelectedEvento] = useState<any>(null);
  const [selectedJogo, setSelectedJogo] = useState<any>(null);
  const [selectedAldeia, setSelectedAldeia] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedEventoIdParaJogo, setSelectedEventoIdParaJogo] = useState<string>("");
  const [tipoJogoSelecionado, setTipoJogoSelecionado] = useState<"poio_da_vaca" | "rifa" | "raspadinha">("rifa");

  // Handler para abrir modal de criar jogo com tipo pré-selecionado
  const handleOpenJogoModal = (tipo: "poio_da_vaca" | "rifa" | "raspadinha") => {
    if (!eventos.length) {
      toast.error("Crie um evento primeiro");
      return;
    }
    setTipoJogoSelecionado(tipo);
    setSelectedJogo(null);
    setSelectedEventoIdParaJogo(eventos[0].id);
    setJogoModalOpen(true);
  };

  // Delete State
  const [deleteData, setDeleteData] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [token, aldeiaId, userRole]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const q = aldeiaId ? `?aldeiaId=${aldeiaId}` : "";

      const getApi = async (url: string) => {
        const res = await fetch(url, { headers, cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          return j.data;
        }
        return null;
      };

      const [st, ev, jg] = await Promise.all([
        getApi(`/api/dashboard/stats${q}`),
        getApi(`/api/eventos${q}`),
        getApi(`/api/jogos${q}`)
      ]);

      if (st) setStats(st);
      if (ev) setEventos(ev);
      if (jg) setJogos(jg);

      if (userRole === "super_admin") {
        const al = await getApi(`/api/aldeias`);
        if (al) setAldeias(al);
      }
      
      const us = await getApi(`/api/users${q}`);
      if (us) setUsers(us);

      const part = await getApi(`/api/participacoes${q}${q ? '&' : '?'}ganhador=true`);
      if (part) setVencedores(part);

      if (userRole === "super_admin") {
        const tr = await getApi(`/api/admin/transacoes`);
        if (tr) setTransacoes(tr);

        const lg = await getApi(`/api/admin/logs`);
        if (lg) setLogs(lg);
      }

      if (userRole === "aldeia_admin") {
        const vs = await getApi(`/api/admin/vendedores-stats`);
        if (vs) setVendedoresStats(vs);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // --- EVENTOS ---
  const handleSaveEvento = async (data: any) => {
    const isEditing = !!data.id;
    const jogosSelecionados = data.jogosSelecionados || [];
    const eventoData = { ...data };
    delete eventoData.jogosSelecionados;
    
    const url = isEditing ? `/api/eventos/${data.id}` : `/api/eventos`;
    const method = isEditing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(eventoData),
    });

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
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      throw new Error(err.error || "Erro ao salvar evento");
    }
  };

  // --- JOGOS ---
  const handleSaveJogo = async (data: any) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/jogos/${data.id}` : `/api/jogos`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Jogo ${isEditing ? "atualizado" : "criado"} com sucesso!`);
        fetchData();
        setJogoModalOpen(false);
      } else {
        console.error('Erro ao criar jogo:', result);
        const errorMsg = result.error || result.details?.map((d: any) => d.message).join(', ') || "Erro ao salvar jogo";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Exceção ao salvar jogo:', error);
      if (!error.message) {
        toast.error("Erro ao salvar jogo");
      }
      throw error;
    }
  };

  // --- TOGGLE JOGO ESTADO ---
  const handleToggleJogoEstado = async (jogo: any) => {
    const novoEstado = jogo.estado === 'aberto' ? 'fechado' : 'aberto';
    try {
      const res = await fetch(`/api/jogos/${jogo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: novoEstado }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Jogo ${novoEstado === 'aberto' ? 'ativado' : 'desativado'} com sucesso!`);
        fetchData();
      } else {
        toast.error(data.error || "Erro ao alterar estado do jogo");
      }
    } catch (error) {
      toast.error("Erro de conexão ao alterar estado do jogo");
    }
  };

  // --- TESTAR JOGO (Super Admin) ---
  const [testJogoOpen, setTestJogoOpen] = useState(false);
  const [testJogo, setTestJogo] = useState<any>(null);

  const handleTestarJogo = (jogo: any) => {
    setTestJogo(jogo);
    setTestJogoOpen(true);
  };

  // --- ALDEIAS ---
  const handleSaveAldeia = async (data: any) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/aldeias/${data.id}` : `/api/aldeias`;
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
  };

  // --- USERS ---
  const handleSaveUser = async (data: any) => {
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

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
  };

  // --- CONVERT PRIZE ---
  const handleConvertPrize = async (participacaoId: string, valor: number) => {
    const res = await fetch("/api/admin/convert-prize", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ participacaoId, valor }),
    });

    if (res.ok) {
      toast.success("Prémio convertido em saldo com sucesso!");
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erro ao converter prémio");
    }
  };

  // --- DELETE ---
  const requestDelete = (type: string, id: string) => {
    setDeleteData({ type, id });
    setConfirmDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteData) return;
    const urls: Record<string, string> = {
      evento: `/api/eventos/${deleteData.id}`,
      jogo: `/api/jogos/${deleteData.id}`,
      aldeia: `/api/aldeias/${deleteData.id}`,
      user: `/api/users/${deleteData.id}`,
    };

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
    setConfirmDeleteOpen(false);
  };

  const handleExecutarSorteio = async (jogoId: string, observacoes?: string) => {
    const response = await fetch("/api/sorteios", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jogoId, observacoes }),
    });

    const data = await response.json();
    if (response.ok) {
      toast.success("Sorteio executado com sucesso!");
      fetchData();
      return { success: true, data: data.data };
    }
    return { success: false, error: data.error };
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, string> = {
      rascunho: "secondary", ativo: "default", aberto: "default",
      pausado: "warning", fechado: "destructive", finalizado: "outline",
    };
    return <Badge variant={variants[estado] as never || "default"}>{estado}</Badge>;
  };

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-32">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-4" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {userRole === "super_admin" ? "Painel Global" : "O Meu Painel"}
            </h1>
            {userRole === "aldeia_admin" && aldeia && (
              <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                {aldeia.nome}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {userRole === "super_admin" 
              ? "Visão global de todas as aldeias" 
              : `A gerir a tua aldeia: ${aldeia?.nome || 'Aldeia'}`
            }
          </p>
        </div>
        <div className="flex gap-2">
          {userRole === "super_admin" && (
            <Button variant="outline" onClick={() => { setSelectedAldeia(null); setAldeiaModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nova Aldeia
            </Button>
          )}
          <Button onClick={() => { setSelectedEvento(null); setEventoModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Evento
          </Button>
          <Button variant="outline" onClick={() => setResultadosExternosOpen(true)}>
            <Globe className="h-4 w-4 mr-2" /> Lotaria Externa
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Angariado"
          value={formatCurrency(stats?.totalAngariado || 0)}
          variant="emerald"
          icon={DollarSign}
        />
        <StatCard
          title="Participações"
          value={stats?.totalParticipacoes?.toLocaleString() || 0}
          variant="blue"
          icon={Users}
        />
        <StatCard
          title="Eventos Ativos"
          value={stats?.eventosAtivos || 0}
          variant="violet"
          icon={Calendar}
        />
        <StatCard
          title="Jogos Ativos"
          value={stats?.jogosAtivos || 0}
          variant="amber"
          icon={Gamepad2}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview"><LayoutDashboard className="h-4 w-4 mr-2" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-2" /> Analytics</TabsTrigger>
          <TabsTrigger value="eventos"><Calendar className="h-4 w-4 mr-2" /> Eventos</TabsTrigger>
          <TabsTrigger value="jogos"><Gamepad2 className="h-4 w-4 mr-2" /> Jogos</TabsTrigger>
          <TabsTrigger value="vencedores"><Trophy className="h-4 w-4 mr-2" /> Vencedores</TabsTrigger>
          <TabsTrigger value="verificar"><Hash className="h-4 w-4 mr-2" /> Verificar</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-2" /> Utilizadores</TabsTrigger>
          {userRole === "aldeia_admin" && (
            <TabsTrigger value="comissoes"><DollarSign className="h-4 w-4 mr-2" /> Comissões & POS</TabsTrigger>
          )}
          {userRole === "super_admin" && (
            <>
              <TabsTrigger value="aldeias"><Building2 className="h-4 w-4 mr-2" /> Aldeias</TabsTrigger>
              <TabsTrigger value="transacoes"><CreditCard className="h-4 w-4 mr-2" /> Transações</TabsTrigger>
              <TabsTrigger value="auditoria"><Shield className="h-4 w-4 mr-2" /> Auditoria</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={() => { setSelectedEvento(null); setEventoModalOpen(true); }} className="bg-[#ff734b] hover:bg-[#ff734b]/90">
              <Plus className="h-4 w-4 mr-2" /> Novo Evento
            </Button>
            <Button onClick={() => { setSelectedJogo(null); setJogoModalOpen(true); }} variant="outline" className="border-[#ff734b]/30">
              <Gamepad2 className="h-4 w-4 mr-2" /> Novo Jogo
            </Button>
            <Button onClick={() => router.push('/vendedordashboard?venda=true')} variant="outline" className="border-[#ff734b]/30">
              <ShoppingCart className="h-4 w-4 mr-2" /> Realizar Venda
            </Button>
            <Button onClick={() => router.push('/vendedordashboard')} variant="outline" className="border-[#ff734b]/30">
              <Users className="h-4 w-4 mr-2" /> Ver Vendedores
            </Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Eventos Recentes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventos.slice(0, 3).map((ev) => (
                  <div key={ev.id} className="flex justify-between items-center">
                    <div><p className="font-medium">{ev.nome}</p><p className="text-sm text-muted-foreground">{formatDate(ev.dataInicio)}</p></div>
                    <div className="text-right">{getEstadoBadge(ev.estado)}<p className="text-sm">{formatCurrency(ev.totalAngariado)}</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <DashboardAnalytics token={token} aldeiaId={aldeiaId} />
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <div className="flex justify-between items-center"><h2 className="text-xl font-semibold">Eventos</h2><Button onClick={() => { setSelectedEvento(null); setEventoModalOpen(true); }} size="sm" className="bg-[#ff734b]"><Plus className="h-4 w-4 mr-1" /> Novo</Button></div>
          {eventos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Calendar className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sem eventos</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  Comece por criar o seu primeiro evento para organizar jogos e angariações.
                </p>
                <Button onClick={() => { setSelectedEvento(null); setEventoModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Criar Evento
                </Button>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4">
            {eventos.map((ev) => (
              <Card key={ev.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{ev.nome}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(ev.dataInicio)} - {formatDate(ev.dataFim)}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { 
                        setSelectedEventoIdParaJogo(ev.id); 
                        // Filter jogos for this event
                        const jogosDoEvento = jogos.filter(j => j.eventoId === ev.id);
                        setJogos(jogosDoEvento.length > 0 ? jogosDoEvento : jogos);
                      }}
                    >
                      <Gamepad2 className="h-4 w-4 mr-1" /> Ver Jogos
                    </Button>
                    {getEstadoBadge(ev.estado)}
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedEvento(ev); setEventoModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => requestDelete("evento", ev.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="jogos" className="space-y-4">
          {/* Quick Actions - Criar cada tipo de jogo */}
          <GameQuickActions eventos={eventos} onOpenModal={handleOpenJogoModal} />

          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Jogos Criados</h2>
            <Button onClick={() => { if(eventos.length) { setSelectedJogo(null); setSelectedEventoIdParaJogo(eventos[0].id); setJogoModalOpen(true); } else { toast.error("Crie um evento primeiro"); } }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Jogo
            </Button>
          </div>
          {jogos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Gamepad2 className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sem jogos</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  Crie jogos para os seus eventos e comece a angariar fundos.
                </p>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4">
            {jogos.map((jg) => (
              <Card key={jg.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{jg.nome}</h3>
                    <p className="text-sm text-muted-foreground">{jg.tipo} • {jg.evento?.nome} • {formatCurrency(jg.preco)}</p>
                  </div>
                    <div className="flex gap-2 items-center">
                      {jg.estado === 'aberto' && (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Ativo
                        </span>
                      )}
                      {getEstadoBadge(jg.estado)}
                      {userRole === "super_admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Testar jogo (modo fictício)"
                          className="text-blue-500 hover:text-blue-400"
                          onClick={() => handleTestarJogo(jg)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Gerar QR Code para partilha"
                        className="text-purple-500 hover:text-purple-400"
                        onClick={() => { setQrCodeData({ jogoId: jg.id, type: "jogo" }); setQrCodeOpen(true); }}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={jg.estado === 'aberto' ? 'Desativar jogo' : 'Ativar jogo'}
                        className={jg.estado === 'aberto' ? 'text-green-600 hover:text-red-500' : 'text-gray-400 hover:text-green-600'}
                        onClick={() => handleToggleJogoEstado(jg)}
                      >
                        {jg.estado === 'aberto' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedJogo(jg); setSelectedEventoIdParaJogo(jg.eventoId); setJogoModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => requestDelete("jogo", jg.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="vencedores" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Participações Vencedoras</h2>
          </div>
          <div className="grid gap-4">
            {vencedores.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Nenhum vencedor encontrado no momento.</p>
            )}
            {vencedores.map((v) => (
              <Card key={v.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{v.jogo?.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {v.nomeCliente || v.user?.nome || "Anónimo"} • {v.telefoneCliente || v.user?.telefone || "Sem contacto"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Data: {formatDate(v.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {v.premioEntregue ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Prémio Entregue/Convertido
                      </Badge>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPremio(v);
                            setConvertValor("25");
                            setConvertPrizeOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-1" /> Converter em Saldo
                        </Button>
                        <Button 
                           size="sm"
                           onClick={() => {
                             setSelectedPremio(v);
                             setConfirmEntregaOpen(true);
                           }}
                        >
                          Entregar Prémio
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verificar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Verificar Participação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Introduza o hash de uma participação para verificar a sua autenticidade antes de entregar o prémio.
                O sistema verificará se o hash corresponde aos registros e permitirá confirmar a entrega.
              </p>
              <Button onClick={() => setVerificarHashOpen(true)}>
                <Hash className="h-4 w-4 mr-2" />
                Verificar Hash
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Gestão de Utilizadores</h2>
            <Button onClick={() => { setSelectedUser(null); setUserModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Utilizador
            </Button>
          </div>
          {users.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Sem utilizadores</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  Adicione utilizadores à sua organização para gerir o sistema.
                </p>
                <Button onClick={() => { setSelectedUser(null); setUserModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Utilizador
                </Button>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4">
            {users.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{u.nome}</h3>
                    <p className="text-sm text-muted-foreground">{u.email} • {u.role}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(u); setUserModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => requestDelete("user", u.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        {userRole === "super_admin" && (
          <>
          <TabsContent value="aldeias" className="space-y-4">
             <div className="flex justify-between">
               <h2 className="text-xl font-semibold">Gestão de Aldeias/Organizações</h2>
             </div>
             {aldeias.length === 0 ? (
               <Card className="border-dashed">
                 <CardContent className="flex flex-col items-center justify-center py-16">
                   <div className="rounded-full bg-primary/10 p-4 mb-4">
                     <Building2 className="h-12 w-12 text-primary" />
                   </div>
                   <h3 className="text-xl font-semibold mb-2">Sem organizações</h3>
                   <p className="text-muted-foreground text-center max-w-sm mb-6">
                     Crie a primeira organização para começar a gerir aldeias, escolas e associações.
                   </p>
                   <Button onClick={() => { setSelectedAldeia(null); setAldeiaModalOpen(true); }}>
                     <Plus className="h-4 w-4 mr-2" /> Nova Organização
                   </Button>
                 </CardContent>
               </Card>
             ) : (
             <div className="grid gap-4">
                {aldeias.map((al) => (
                 <Card key={al.id}>
                   <CardContent className="p-4 flex items-center justify-between">
                     <div>
                       <h3 className="font-semibold">{al.nome}</h3>
                       <p className="text-sm text-muted-foreground">{al.tipoOrganizacao} • {al.email}</p>
                     </div>
                     <div className="flex gap-2 items-center">
                       <Button variant="ghost" size="icon" onClick={() => { setSelectedAldeia(al); setAldeiaModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                       <Button variant="ghost" size="icon" className="text-red-500" onClick={() => requestDelete("aldeia", al.id)}><Trash2 className="h-4 w-4" /></Button>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
             )}
           </TabsContent>
           
            <TabsContent value="transacoes" className="space-y-4">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">Transações da Plataforma</h2>
              </div>
              {transacoes.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <CreditCard className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Sem transações</h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      As transações aparecem aqui quando os utilizadores carregam saldo ou participam em jogos.
                    </p>
                  </CardContent>
                </Card>
             ) : (
             <div className="grid gap-4">
                {transacoes.map((t) => (
                 <Card key={t.id}>
                   <CardContent className="p-4 flex items-center justify-between">
                     <div>
                       <div className="flex gap-2 items-center">
                         <h3 className="font-semibold">{t.tipo}</h3>
                         <Badge variant="outline">{t.estado || "concluido"}</Badge>
                       </div>
                       <p className="text-sm text-muted-foreground">{t.descricao || "-"} • User: {t.user?.nome || t.user?.email || t.userId}</p>
                       <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                     </div>
                     <div className="text-right">
                       <div className="text-lg font-bold">{formatCurrency(t.valor)}</div>
                       <p className="text-xs text-muted-foreground">{t.metodoPagamento || "saldo"}</p>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
             )}
           </TabsContent>

            <TabsContent value="auditoria" className="space-y-4">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">Auditoria e Logs de Acesso</h2>
              </div>
              {logs.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <Shield className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Sem registos</h3>
                    <p className="text-muted-foreground text-center max-w-sm">
                      Os logs de acesso aparecem aqui quando os utilizadores iniciam sessão.
                    </p>
                  </CardContent>
                </Card>
             ) : (
             <div className="grid gap-4">
                {logs.map((log) => (
                 <Card key={log.id}>
                   <CardContent className="p-4 flex items-center justify-between">
                     <div>
                       <div className="flex gap-2 items-center">
                         <Badge variant={log.sucesso ? "default" : "destructive"}>
                           {log.sucesso ? "Sucesso" : "Falha"}
                         </Badge>
                         <h3 className="font-semibold">{log.email}</h3>
                       </div>
                       <p className="text-sm text-muted-foreground">IP: {log.ip} • User Agent: {log.userAgent}</p>
                       <p className="text-xs text-muted-foreground">{log.motivo || ""}</p>
                       <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
             )}
           </TabsContent>
          </>
        )}

        {userRole === "aldeia_admin" && (
          <TabsContent value="comissoes" className="space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">Comissões & Desempenho de Vendedores (POS)</h2>
            </div>
            {vendedoresStats.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <DollarSign className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sem vendedores</h3>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Adicione vendedores à sua organização para ver as estatísticas de desempenho e comissões.
                  </p>
                </CardContent>
              </Card>
            ) : (
            <div className="grid gap-4">
               {vendedoresStats.map((vs) => (
                <Card key={vs.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex gap-2 items-center">
                        <h3 className="font-semibold text-lg">{vs.nome}</h3>
                        <Badge variant="outline">{vs.totalVendas} vendas globais</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{vs.email} • {vs.telefone || "Sem telefone"}</p>
                      <div className="flex items-center gap-4 mt-2">
                         <div>
                            <p className="text-xs text-muted-foreground">Volume Faturado</p>
                            <p className="font-semibold text-green-600">{formatCurrency(vs.volumeTotal)}</p>
                         </div>
                         <div>
                            <p className="text-xs text-muted-foreground">Comissão ({vs.comissaoPercentual}%)</p>
                            <p className="font-semibold text-blue-600">{formatCurrency(vs.comissaoGanhas)}</p>
                         </div>
                         <div>
                            <p className="text-xs text-muted-foreground">Saldo Aberto (A Pagar)</p>
                            <p className="font-semibold text-orange-600">{formatCurrency(vs.saldoAberto)}</p>
                         </div>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedUser(vs); setUserModalOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Editar Perfil</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      <BottomNav role="aldeia_admin" />

      {/* Modals */}
      <CreateEventoModal
        open={eventoModalOpen}
        onOpenChange={setEventoModalOpen}
        onSubmit={handleSaveEvento}
        aldeiaId={aldeiaId || ""}
        initialData={selectedEvento}
        aldeias={aldeias}
      />
      <CreateJogoModal open={jogoModalOpen} onOpenChange={setJogoModalOpen} onSubmit={handleSaveJogo} eventoId={selectedEventoIdParaJogo} initialData={selectedJogo} userRole={userRole} token={token} />
      <AldeiaModal open={aldeiaModalOpen} onOpenChange={setAldeiaModalOpen} onSubmit={handleSaveAldeia} initialData={selectedAldeia} />
      <UserModal open={userModalOpen} onOpenChange={setUserModalOpen} onSubmit={handleSaveUser} initialData={selectedUser} aldeias={aldeia ? [aldeia] : aldeias} currentUserRole={userRole} />

      <ConfirmModal
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Confirmar Eliminação"
        description="Tem a certeza que deseja eliminar este registo? Esta ação não pode ser desfeita."
        onConfirm={executeDelete}
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
              onChange={(e) => setConvertValor(e.target.value)}
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

      {/* Modal Testar Jogo (Super Admin) */}
      <Dialog open={testJogoOpen} onOpenChange={setTestJogoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Testar Jogo — Modo Fictício
            </DialogTitle>
            <DialogDescription>
              Simule uma participação neste jogo para verificar se está configurado corretamente. Nenhuma alteração é guardada.
            </DialogDescription>
          </DialogHeader>
          {testJogo && <JogoTestView jogo={testJogo} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de teste fictício de jogos
function JogoTestView({ jogo }: { jogo: any }) {
  const [step, setStep] = useState<"info" | "simulate">("info");
  const config = jogo.configuracao ? (typeof jogo.configuracao === "string" ? JSON.parse(jogo.configuracao) : jogo.configuracao) : {};

  const tipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      raspadinha: "Raspadinha",
      rifa: "Rifa",
      tombola: "Tombola",
      poio_da_vaca: "Poio da Vaca",
    };
    return labels[tipo] || tipo;
  };

  if (step === "info") {
    return (
      <div className="space-y-6">
        <div className="bg-muted/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            {jogo.tipo === "raspadinha" && <Sparkles className="h-6 w-6 text-yellow-500" />}
            {jogo.tipo === "rifa" && <Ticket className="h-6 w-6 text-blue-500" />}
            {jogo.tipo === "tombola" && <Ticket className="h-6 w-6 text-purple-500" />}
            {jogo.tipo === "poio_da_vaca" && <Grid3X3 className="h-6 w-6 text-green-500" />}
            <div>
              <h3 className="text-lg font-bold">{jogo.nome}</h3>
              <Badge variant="secondary">{tipoLabel(jogo.tipo)}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Preço</p>
              <p className="font-bold text-lg">{formatCurrency(jogo.preco)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stock</p>
              <p className="font-bold text-lg">{jogo.stockAtual} / {jogo.stockInicial}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estado</p>
              <Badge variant={jogo.estado === "aberto" ? "default" : "secondary"}>{jogo.estado}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Evento</p>
              <p className="font-medium">{jogo.evento?.nome || "—"}</p>
            </div>
          </div>

          {jogo.tipo === "raspadinha" && config.premios && config.premios.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Prémios Configurados</h4>
              <div className="space-y-1">
                {config.premios.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm p-2 bg-background rounded">
                    <span>{p.nome}</span>
                    <span className="font-medium">{p.valorDinheiroAlternative}€ ({p.percentagem}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {jogo.tipo === "poio_da_vaca" && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Configuração do Campo</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-background rounded">
                  <span className="text-muted-foreground">Dimensões:</span> {config.dimensoesX || 10}x{config.dimensoesY || 10}
                </div>
                <div className="p-2 bg-background rounded">
                  <span className="text-muted-foreground">Custo/quadrado:</span> {config.custoQuadrado || jogo.preco}€
                </div>
                <div className="p-2 bg-background rounded">
                  <span className="text-muted-foreground">Valor da Vaca:</span> {formatCurrency(config.valorCompraVaca || 0)}
                </div>
                <div className="p-2 bg-background rounded">
                  <span className="text-muted-foreground">Total quadrados:</span> {(config.dimensoesX || 10) * (config.dimensoesY || 10)}
                </div>
              </div>
            </div>
          )}

          {(jogo.tipo === "rifa" || jogo.tipo === "tombola") && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Configuração</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-background rounded">
                  <span className="text-muted-foreground">Números:</span> {config.numeroInicial || 1} – {config.numeroFinal || 1000}
                </div>
                <div className="p-2 bg-background rounded">
                  <span className="text-muted-foreground">Modo sorteio:</span> {jogo.modoSorteio === "externo" ? "Externo" : "App"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setStep("simulate")}>
            <Play className="h-4 w-4 mr-2" />
            Simular Participação
          </Button>
        </div>
      </div>
    );
  }

  // Simulate step
  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-lg">Simulação de Participação</h3>
        <p className="text-sm text-muted-foreground">
          Se um jogador participasse neste jogo agora, eis o que aconteceria:
        </p>

        <div className="space-y-3">
          <div className="p-3 bg-background rounded-lg space-y-2">
            <p className="text-sm font-medium">1. Jogador seleciona {jogo.tipo === "poio_da_vaca" ? "coordenadas no campo" : jogo.tipo === "raspadinha" ? "uma raspadinha" : "número(s) da rifa"}</p>
            <p className="text-xs text-muted-foreground">
              {jogo.tipo === "poio_da_vaca" && `Campo de ${config.dimensoesX || 10}x${config.dimensoesY || 10} = ${(config.dimensoesX || 10) * (config.dimensoesY || 10)} quadrados disponíveis`}
              {jogo.tipo === "raspadinha" && `${jogo.stockAtual} raspadinhas disponíveis com ${config.premios?.length || 0} tipos de prémio`}
              {(jogo.tipo === "rifa" || jogo.tipo === "tombola") && `Números de ${config.numeroInicial || 1} a ${config.numeroFinal || 1000}`}
            </p>
          </div>

          <div className="p-3 bg-background rounded-lg space-y-2">
            <p className="text-sm font-medium">2. Pagamento de {formatCurrency(jogo.preco)}</p>
            <p className="text-xs text-muted-foreground">Métodos disponíveis: Saldo, MBWay, Dinheiro</p>
          </div>

          <div className="p-3 bg-background rounded-lg space-y-2">
            <p className="text-sm font-medium">3. Participação registada com hash de verificação</p>
            <p className="text-xs text-muted-foreground">SHA-256 seed gerado — auditável e transparente</p>
          </div>

          {jogo.tipo === "raspadinha" && (
            <div className="p-3 bg-background rounded-lg space-y-2">
              <p className="text-sm font-medium">4. Jogador raspa e revela o prémio</p>
              <p className="text-xs text-muted-foreground">
                Prémio determinado pelo número do cartão ({jogo.stockInicial - jogo.stockAtual + 1}º cartão vendido)
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setStep("info")}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
