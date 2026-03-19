"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  Calendar,
  Gamepad2,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Trophy,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreateEventoModal, CreateJogoModal, SorteioModal, ConfirmModal } from "@/components/modals";
import { toast } from "sonner";

interface AdminDashboardProps {
  token: string;
  aldeiaId?: string;
}

interface Stats {
  totalEventos: number;
  eventosAtivos: number;
  totalJogos: number;
  jogosAtivos: number;
  totalParticipacoes: number;
  totalAngariado: number;
  evolucaoMensal: { mes: string; valor: number; participacoes: number }[];
}

interface Evento {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  estado: string;
  publico: boolean;
  totalAngariado: number;
  totalParticipacoes: number;
  objectivoAngariacao?: number;
}

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockAtual: number;
  stockInicial: number;
  estado: string;
  sorteado: boolean;
  evento?: { nome: string };
}

export function AdminDashboard({ token, aldeiaId }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Modais
  const [createEventoOpen, setCreateEventoOpen] = useState(false);
  const [createJogoOpen, setCreateJogoOpen] = useState(false);
  const [sorteioOpen, setSorteioOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedJogo, setSelectedJogo] = useState<Jogo | null>(null);
  const [selectedEventoId, setSelectedEventoId] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [token, aldeiaId]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      // Fetch stats
      const statsRes = await fetch(`/api/dashboard/stats?${aldeiaId ? `aldeiaId=${aldeiaId}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      // Fetch eventos
      const eventosRes = await fetch(`/api/eventos?${aldeiaId ? `aldeiaId=${aldeiaId}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (eventosRes.ok) {
        const eventosData = await eventosRes.json();
        setEventos(eventosData.data);
      }

      // Fetch jogos
      const jogosRes = await fetch(`/api/jogos?${aldeiaId ? `aldeiaId=${aldeiaId}` : ""}`, {
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

  const handleCreateEvento = async (data: {
    nome: string;
    descricao?: string;
    dataInicio: string;
    dataFim: string;
    objectivoAngariacao?: number;
    publico: boolean;
  }) => {
    const response = await fetch("/api/eventos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...data, aldeiaId: aldeiaId || "" }),
    });

    if (response.ok) {
      toast.success("Evento criado com sucesso!");
      fetchData();
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }
  };

  const handleCreateJogo = async (data: {
    nome: string;
    tipo: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha";
    descricao?: string;
    preco: number;
    stockInicial: number;
    limitePorUsuario: number;
    eventoId: string;
    configuracao: Record<string, unknown>;
  }) => {
    const response = await fetch("/api/jogos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      toast.success("Jogo criado com sucesso!");
      fetchData();
    } else {
      const error = await response.json();
      throw new Error(error.error);
    }
  };

  const handleExecutarSorteio = async (jogoId: string, observacoes?: string) => {
    const response = await fetch("/api/sorteios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jogoId, observacoes }),
    });

    const data = await response.json();

    if (response.ok) {
      toast.success("Sorteio executado com sucesso!");
      fetchData();
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.error };
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, string> = {
      rascunho: "secondary",
      ativo: "default",
      aberto: "default",
      pausado: "warning",
      fechado: "destructive",
      finalizado: "outline",
    };
    return <Badge variant={variants[estado] as never}>{estado}</Badge>;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Gestão da sua organização</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateEventoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Angariado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalAngariado || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalParticipacoes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.eventosAtivos || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jogos Ativos</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.jogosAtivos || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="eventos">
            <Calendar className="h-4 w-4 mr-2" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="jogos">
            <Gamepad2 className="h-4 w-4 mr-2" />
            Jogos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Eventos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventos.slice(0, 3).map((evento) => (
                  <div key={evento.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{evento.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(evento.dataInicio)}
                      </p>
                    </div>
                    <div className="text-right">
                      {getEstadoBadge(evento.estado)}
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(evento.totalAngariado)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Eventos</h2>
            <Button onClick={() => setCreateEventoOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>

          <div className="grid gap-4">
            {eventos.map((evento) => (
              <Card key={evento.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{evento.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(evento.dataInicio)} - {formatDate(evento.dataFim)}
                      </p>
                      {evento.objectivoAngariacao && (
                        <div className="mt-2">
                          <Progress
                            value={(evento.totalAngariado / evento.objectivoAngariacao) * 100}
                            className="w-48"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(evento.totalAngariado)} /{" "}
                            {formatCurrency(evento.objectivoAngariacao)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getEstadoBadge(evento.estado)}
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jogos" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Jogos</h2>
            <Button
              onClick={() => {
                if (eventos.length > 0) {
                  setSelectedEventoId(eventos[0].id);
                  setCreateJogoOpen(true);
                } else {
                  toast.error("Crie um evento primeiro");
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Jogo
            </Button>
          </div>

          <div className="grid gap-4">
            {jogos.map((jogo) => (
              <Card key={jogo.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{jogo.nome}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {jogo.tipo.replace("_", " ")} • {jogo.evento?.nome}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(jogo.preco)} • Stock: {jogo.stockAtual}/{jogo.stockInicial}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getEstadoBadge(jogo.estado)}
                      {!jogo.sorteado && jogo.estado === "fechado" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedJogo(jogo);
                            setSorteioOpen(true);
                          }}
                        >
                          <Trophy className="h-4 w-4" />
                        </Button>
                      )}
                      {jogo.estado === "rascunho" && (
                        <Button variant="ghost" size="icon">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      <CreateEventoModal
        open={createEventoOpen}
        onOpenChange={setCreateEventoOpen}
        onSubmit={handleCreateEvento}
        aldeiaId={aldeiaId || ""}
      />

      <CreateJogoModal
        open={createJogoOpen}
        onOpenChange={setCreateJogoOpen}
        onSubmit={handleCreateJogo}
        eventoId={selectedEventoId}
      />

      {selectedJogo && (
        <SorteioModal
          open={sorteioOpen}
          onOpenChange={setSorteioOpen}
          jogoNome={selectedJogo.nome}
          totalParticipacoes={selectedJogo.stockInicial - selectedJogo.stockAtual}
          onExecutarSorteio={(obs) => handleExecutarSorteio(selectedJogo.id, obs)}
        />
      )}
    </div>
  );
}
