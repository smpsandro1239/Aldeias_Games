"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard, Calendar, Gamepad2, Users, DollarSign, Plus, Edit, Trash2, Eye, Play, Trophy, Building2, Power, PowerOff, Globe, BarChart3, Hash
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreateEventoModal, CreateJogoModal, SorteioModal, ConfirmModal, AldeiaModal, UserModal, ResultadosExternosModal } from "@/components/modals";
import { GameQuickActions } from "@/components/game-quick-actions";
import { VerificarHashModal } from "@/components/verificar-hash-modal";
import { DashboardAnalytics } from "./analytics-dashboard";
import { toast } from "sonner";

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
  const [stats, setStats] = useState<Stats | null>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [jogos, setJogos] = useState<any[]>([]);
  const [aldeias, setAldeias] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [participacoes, setParticipacoes] = useState<any[]>([]);
  const [vencedores, setVencedores] = useState<any[]>([]);

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

    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // --- EVENTOS ---
  const handleSaveEvento = async (data: any) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/eventos/${data.id}` : `/api/eventos`;
    const method = isEditing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });

    if (res.ok) {
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

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(`Jogo ${isEditing ? "atualizado" : "criado"} com sucesso!`);
      fetchData();
      setJogoModalOpen(false);
    } else {
      const err = await res.json();
      throw new Error(err.error || "Erro ao salvar jogo");
    }
  };

  // --- TOGGLE JOGO ESTADO ---
  const handleToggleJogoEstado = async (jogo: any) => {
    const novoEstado = jogo.estado === 'aberto' ? 'fechado' : 'aberto';
    const res = await fetch(`/api/jogos/${jogo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ estado: novoEstado }),
      cache: 'no-store',
    });
    if (res.ok) {
      toast.success(`Jogo ${novoEstado === 'aberto' ? 'ativado' : 'desativado'} com sucesso!`);
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erro ao alterar estado do jogo");
    }
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

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {userRole === "super_admin" ? "Dashboard Global" : "Dashboard"}
            </h1>
            {userRole === "aldeia_admin" && aldeia && (
              <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                {aldeia.nome}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            {userRole === "super_admin" 
              ? "Vista global de todas as aldeias" 
              : `Gestão: ${aldeia?.nome || 'Aldeia'}`
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Angariado</CardTitle><DollarSign className="h-4 w-4" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(stats?.totalAngariado || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Participações</CardTitle><Users className="h-4 w-4" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalParticipacoes || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle><Calendar className="h-4 w-4" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.eventosAtivos || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Jogos Ativos</CardTitle><Gamepad2 className="h-4 w-4" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.jogosAtivos || 0}</div></CardContent>
        </Card>
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
          {userRole === "super_admin" && (
            <TabsTrigger value="aldeias"><Building2 className="h-4 w-4 mr-2" /> Aldeias</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
          <div className="flex justify-between"><h2 className="text-xl font-semibold">Gestão de Eventos</h2></div>
          {eventos.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <Calendar className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Nenhum evento encontrado</p>
                  <p className="text-sm text-muted-foreground">Clique em "Novo Evento" para criar o primeiro evento.</p>
                </div>
                <Button onClick={() => { setSelectedEvento(null); setEventoModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Novo Evento
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
            <Card className="p-8 text-center">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <Gamepad2 className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Nenhum jogo encontrado</p>
                  <p className="text-sm text-muted-foreground">Clique em "Novo Jogo" para criar o primeiro jogo.</p>
                </div>
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
            <Card className="p-8 text-center">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <Users className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Nenhum utilizador encontrado</p>
                  <p className="text-sm text-muted-foreground">Clique em "Novo Utilizador" para adicionar.</p>
                </div>
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
          <TabsContent value="aldeias" className="space-y-4">
             <div className="flex justify-between">
               <h2 className="text-xl font-semibold">Gestão de Aldeias/Organizações</h2>
             </div>
             {aldeias.length === 0 ? (
               <Card className="p-8 text-center">
                 <CardContent className="flex flex-col items-center justify-center space-y-4">
                   <Building2 className="h-12 w-12 text-muted-foreground" />
                   <div>
                     <p className="text-lg font-medium">Nenhuma organização encontrada</p>
                     <p className="text-sm text-muted-foreground">Clique em "Nova Organização" para adicionar.</p>
                   </div>
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
        )}
      </Tabs>

      {/* Modals */}
      <CreateEventoModal
        open={eventoModalOpen}
        onOpenChange={setEventoModalOpen}
        onSubmit={handleSaveEvento}
        aldeiaId={aldeiaId || ""}
        initialData={selectedEvento}
        aldeias={aldeias}
      />
      <CreateJogoModal open={jogoModalOpen} onOpenChange={setJogoModalOpen} onSubmit={handleSaveJogo} eventoId={selectedEventoIdParaJogo} initialData={selectedJogo} />
      <AldeiaModal open={aldeiaModalOpen} onOpenChange={setAldeiaModalOpen} onSubmit={handleSaveAldeia} initialData={selectedAldeia} />
      <UserModal open={userModalOpen} onOpenChange={setUserModalOpen} onSubmit={handleSaveUser} initialData={selectedUser} aldeias={aldeias} currentUserRole={userRole} />

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
    </div>
  );
}
