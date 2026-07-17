"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import {
  Banknote, Send, Check, X, Clock, RefreshCw, History, Scale,
  Download, ArrowLeft, ArrowUpFromLine, FileText, AlertTriangle
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { generateCSV, downloadCSV, formatDateISO } from "@/lib/export-utils";

interface DepositoData {
  id: string;
  valor: number;
  descricao: string | null;
  estado: string;
  createdAt: string;
  confirmadoAt: string | null;
  vendedor: { id: string; nome: string };
  criadoPor: { id: string; nome: string };
  confirmadoPor: { id: string; nome: string } | null;
}

interface VaultData {
  saldo: number;
  transacoes: Array<{
    id: string;
    tipo: string;
    valor: number;
    descricao: string;
    estado: string;
    dataCriacao: string;
    criadoPor: { id: string; nome: string };
    aprovadoPor: { nome: string } | null;
    observacoes: string | null;
  }>;
}

interface Levantamento {
  id: string;
  valor: number;
  descricao: string;
  estado: string;
  dataCriacao: string;
  dataAprovacao: string | null;
  observacoes: string | null;
  criadoPor: { id: string; nome: string; email: string };
  aprovadoPor: { nome: string } | null;
}

export function AdminCofre() {
  const [depositos, setDepositos] = useState<DepositoData[]>([]);
  const [vault, setVault] = useState<VaultData | null>(null);
  const [levantamentos, setLevantamentos] = useState<Levantamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pendentes");

  const [levantamentoModalOpen, setLevantamentoModalOpen] = useState(false);
  const [levValor, setLevValor] = useState("");
  const [levDescricao, setLevDescricao] = useState("");
  const [levDestino, setLevDestino] = useState("");
  const [levObservacoes, setLevObservacoes] = useState("");
  const [levSubmitting, setLevSubmitting] = useState(false);

  const [confirmDepId, setConfirmDepId] = useState<string | null>(null);
  const [rejectDepId, setRejectDepId] = useState<string | null>(null);
  const [rejectDepMotivo, setRejectDepMotivo] = useState("");
  const [confirmLevId, setConfirmLevId] = useState<string | null>(null);
  const [rejectLevId, setRejectLevId] = useState<string | null>(null);
  const [rejectLevMotivo, setRejectLevMotivo] = useState("");

  const getToken = useCallback(() => "", []);
  const getAldeiaId = useCallback(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.aldeiaId || undefined;
    } catch {
      return undefined;
    }
  }, []);

  const fetchData = useCallback(async () => {
    const aldeiaId = getAldeiaId();
    try {
      const [depRes, vaultRes, levRes] = await Promise.all([
        apiRequest("/api/cofre/pedido-deposito"),
        apiRequest(`/api/cofre/historico${aldeiaId ? `?aldeiaId=${aldeiaId}` : ''}`),
        apiRequest(`/api/cofre/levantamento${aldeiaId ? `?aldeiaId=${aldeiaId}` : ''}`),
      ]);

      if (depRes.ok) {
        const data = await depRes.json();
        setDepositos(data.data);
      }
      if (vaultRes.ok) {
        const data = await vaultRes.json();
        setVault(data.data);
      }
      if (levRes.ok) {
        const data = await levRes.json();
        setLevantamentos(data.data);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados do cofre");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirmarDeposito = async (id: string) => {
    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ acao: "confirmar" })
      });

      if (res.ok) {
        toast.success("Depósito confirmado com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao confirmar depósito");
      }
    } catch (error) {
      toast.error("Erro ao confirmar depósito");
    }
  };

  const handleRejeitarDeposito = async (id: string, motivo: string) => {
    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ acao: "rejeitar", observacoes: motivo })
      });

      if (res.ok) {
        toast.success("Depósito rejeitado");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao rejeitar depósito");
      }
    } catch (error) {
      toast.error("Erro ao rejeitar depósito");
    }
  };

  const handleSolicitarLevantamento = async () => {
    const valor = parseFloat(levValor);
    if (!valor || valor <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    if (!levDescricao.trim() || levDescricao.trim().length < 5) {
      toast.error("Descrição deve ter pelo menos 5 caracteres");
      return;
    }
    if (!levDestino.trim()) {
      toast.error("Destino/finalidade é obrigatório");
      return;
    }

    setLevSubmitting(true);
    try {
      const res = await apiRequest("/api/cofre/levantamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          valor,
          descricao: levDescricao.trim(),
          destino: levDestino.trim(),
          observacoes: levObservacoes.trim() || undefined,
        })
      });

      if (res.ok) {
        toast.success("Levantamento solicitado com sucesso!");
        setLevantamentoModalOpen(false);
        setLevValor("");
        setLevDescricao("");
        setLevDestino("");
        setLevObservacoes("");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao solicitar levantamento");
      }
    } catch {
      toast.error("Erro ao solicitar levantamento");
    } finally {
      setLevSubmitting(false);
    }
  };

  const handleConfirmarLevantamento = async (id: string) => {
    try {
      const res = await apiRequest(`/api/cofre/levantamento/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ acao: "confirmar" })
      });
      if (res.ok) {
        toast.success("Levantamento confirmado!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao confirmar");
      }
    } catch {
      toast.error("Erro ao confirmar levantamento");
    }
  };

  const handleRejeitarLevantamento = async (id: string, motivo: string) => {
    try {
      const res = await apiRequest(`/api/cofre/levantamento/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ acao: "rejeitar", observacoes: motivo })
      });
      if (res.ok) {
        toast.success("Levantamento rejeitado");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao rejeitar");
      }
    } catch {
      toast.error("Erro ao rejeitar levantamento");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const pendentes = depositos.filter(d => d.estado === 'pendente');
  const confirmados = depositos.filter(d => d.estado === 'confirmado');
  const rejeitados = depositos.filter(d => d.estado === 'rejeitado');
  const levPendentes = levantamentos.filter(l => l.estado === 'pendente');
  const levProcessados = levantamentos.filter(l => l.estado !== 'pendente');
  const vaultTransacoes = vault?.transacoes || [];

  return (
    <>
    <div className="space-y-6 p-4 md:p-6">
      <div className="relative bg-gradient-to-r from-green-500/10 via-green-500/5 to-emerald-500/10 rounded-3xl p-6 border border-green-500/10">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => window.location.href = "/admindashboard"} className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center hover:bg-green-500/30 transition-colors">
            <ArrowLeft className="w-6 h-6 text-green-600" />
          </button>
          <div>
            <h1 className="text-3xl font-serif font-bold">Gestão do Cofre</h1>
            <p className="text-muted-foreground font-medium">
              Transparência total na movimentação de fundos da aldeia
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Saldo do Cofre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(vault?.saldo || 0)}
            </p>
            <p className="text-sm text-green-700/80 dark:text-green-300/80 mt-1">
              Dinheiro físico guardado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20 border-orange-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pedidos Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              {pendentes.length + levPendentes.length}
            </p>
            <p className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-1">
              {pendentes.length} depósitos + {levPendentes.length} levantamentos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/20 border-purple-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
              <ArrowUpFromLine className="w-4 h-4" />
              Total Levantado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {formatCurrency(
                levantamentos.filter(l => l.estado === 'confirmado').reduce((sum, l) => sum + l.valor, 0)
              )}
            </p>
            <p className="text-xs text-purple-700/80 dark:text-purple-300/80 mt-1">
              {levProcessados.length} levantamentos processados
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pendentes" className="relative">
              Pendentes
              {pendentes.length + levPendentes.length > 0 && (
                <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs">
                  {pendentes.length + levPendentes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmados">Depósitos</TabsTrigger>
            <TabsTrigger value="levantamentos">Levantamentos</TabsTrigger>
            <TabsTrigger value="historico">Movimentos</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/admindashboard/cofre/reconciliacao'}>
              <Scale className="w-4 h-4 mr-2" />
              Reconciliação
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        <TabsContent value="pendentes" className="space-y-4 mt-4">
          {levPendentes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4" />
                Levantamentos Pendentes ({levPendentes.length})
              </h3>
              {levPendentes.map((lev) => (
                <Card key={lev.id} className="border-purple-500/30 mb-3">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg text-purple-700">{formatCurrency(lev.valor)}</p>
                          <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">
                            <ArrowUpFromLine className="w-3 h-3 mr-1" />
                            LEVANTAMENTO
                          </Badge>
                        </div>
                        <p className="text-sm">{lev.descricao}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Solicitado por: <strong>{lev.criadoPor.nome}</strong></span>
                          <span>{formatDateTime(lev.dataCriacao)}</span>
                        </div>
                        {lev.observacoes && (
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-1">
                            {lev.observacoes.split('\n').filter(l => l.startsWith('Destino:')).map((l, i) => (
                              <p key={i}><strong>Destino:</strong> {l.replace('Destino: ', '')}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setConfirmLevId(lev.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => { setRejectLevId(lev.id); setRejectLevMotivo(""); }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pendentes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Depósitos Pendentes ({pendentes.length})
              </h3>
              {pendentes.map((dep) => (
                <Card key={dep.id} className="border-accent/50 mb-3">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg">{formatCurrency(dep.valor)}</p>
                          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                            <Clock className="w-3 h-3 mr-1" />
                            PENDENTE
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {dep.descricao || "Depósito"}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>De: <strong>{dep.vendedor.nome}</strong></span>
                          <span>Criado: {formatDateTime(dep.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => setConfirmDepId(dep.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive/10"
                          onClick={() => { setRejectDepId(dep.id); setRejectDepMotivo(""); }}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {pendentes.length === 0 && levPendentes.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Tudo processado! Nenhum pedido pendente.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="confirmados" className="space-y-3 mt-4">
          {confirmados.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum depósito confirmado</p>
              </CardContent>
            </Card>
          ) : (
            confirmados.map((dep) => (
              <Card key={dep.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg">{formatCurrency(dep.valor)}</p>
                        <Badge className="bg-primary">
                          <Check className="w-3 h-3 mr-1" />
                          CONFIRMADO
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{dep.descricao || "Depósito"}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>De: <strong>{dep.vendedor.nome}</strong></span>
                        <span>Por: <strong>{dep.confirmadoPor?.nome || "—"}</strong></span>
                        <span>{dep.confirmadoAt ? formatDateTime(dep.confirmadoAt) : "—"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="levantamentos" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Levantamentos do Cofre</h3>
            <Button onClick={() => setLevantamentoModalOpen(true)}>
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              Solicitar Levantamento
            </Button>
          </div>

          {levPendentes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Pendentes de Aprovação</h4>
              {levPendentes.map((lev) => (
                <Card key={lev.id} className="border-purple-500/30 mb-3">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg text-purple-700">{formatCurrency(lev.valor)}</p>
                          <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">
                            <Clock className="w-3 h-3 mr-1" />
                            PENDENTE
                          </Badge>
                        </div>
                        <p className="text-sm">{lev.descricao}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Por: <strong>{lev.criadoPor.nome}</strong></span>
                          <span>{formatDateTime(lev.dataCriacao)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleConfirmarLevantamento(lev.id)}>
                          <Check className="w-4 h-4 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => setRejectLevId(lev.id)}>
                          <X className="w-4 h-4 mr-1" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Histórico</h4>
            {levProcessados.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <ArrowUpFromLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum levantamento registado</p>
                </CardContent>
              </Card>
            ) : (
              levProcessados.map((lev) => (
                <Card key={lev.id} className="mb-2">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          lev.estado === 'confirmado' ? 'bg-purple-500/20' : 'bg-red-500/20'
                        }`}>
                          <ArrowUpFromLine className={`w-4 h-4 ${lev.estado === 'confirmado' ? 'text-purple-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{lev.descricao}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>Por: {lev.criadoPor.nome}</span>
                            {lev.aprovadoPor && <span>Aprovado por: {lev.aprovadoPor.nome}</span>}
                            <span>{formatDateTime(lev.dataCriacao)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${lev.estado === 'confirmado' ? 'text-purple-600' : 'text-red-600'}`}>
                          -{formatCurrency(lev.valor)}
                        </p>
                        <Badge variant={lev.estado === 'confirmado' ? 'default' : 'destructive'} className="text-xs">
                          {lev.estado === 'confirmado' ? 'APROVADO' : 'REJEITADO'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-3 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  <CardTitle>Movimentos do Cofre</CardTitle>
                </div>
                {vaultTransacoes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const headers = ['Data', 'Tipo', 'Valor', 'Descrição', 'Estado', 'Criado por', 'Aprovado por'];
                      const rows = vaultTransacoes.map(tx => [
                        formatDateISO(tx.dataCriacao),
                        tx.tipo === 'deposito' ? 'Depósito' : tx.tipo === 'levantamento' ? 'Levantamento' : tx.tipo,
                        tx.valor.toFixed(2),
                        tx.descricao,
                        tx.estado,
                        tx.criadoPor.nome,
                        tx.aprovadoPor?.nome ?? '-',
                      ]);
                      downloadCSV(generateCSV(headers, rows), `cofre-movimentos-${new Date().toISOString().slice(0, 10)}.csv`);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                )}
              </div>
              <CardDescription>
                Todas as entradas e saídas registadas no cofre
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vaultTransacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum movimento registado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {vaultTransacoes.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.tipo === 'deposito'
                            ? 'bg-green-500/20'
                            : 'bg-purple-500/20'
                        }`}>
                          {tx.tipo === 'deposito'
                            ? <Check className="w-4 h-4 text-green-600" />
                            : <ArrowUpFromLine className="w-4 h-4 text-purple-600" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.descricao}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span>Criado por: {tx.criadoPor.nome}</span>
                            {tx.aprovadoPor && (
                              <span>{tx.tipo === 'levantamento' ? 'Aprovado' : 'Aprovado'} por: {tx.aprovadoPor.nome}</span>
                            )}
                            <span>{formatDateTime(tx.dataCriacao)}</span>
                            <Badge variant={tx.estado === 'confirmado' ? 'default' : tx.estado === 'pendente' ? 'secondary' : 'destructive'} className="text-xs">
                              {tx.estado.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className={`font-bold ${tx.tipo === 'deposito' ? 'text-green-600' : 'text-purple-600'}`}>
                        {tx.tipo === 'deposito' ? '+' : '-'}{formatCurrency(tx.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={levantamentoModalOpen} onOpenChange={setLevantamentoModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpFromLine className="w-5 h-5 text-purple-600" />
              Solicitar Levantamento do Cofre
            </DialogTitle>
            <DialogDescription>
              Regista a retirada de dinheiro do cofre. O levantamento ficará pendente até aprovação por outro administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Saldo disponível no cofre</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(vault?.saldo || 0)}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="levValor">Valor (€) *</Label>
              <Input
                id="levValor"
                type="number"
                step="0.01"
                min="0.01"
                max={vault?.saldo || 0}
                value={levValor}
                onChange={(e) => setLevValor(e.target.value)}
                placeholder="0.00"
              />
              {levValor && parseFloat(levValor) > (vault?.saldo || 0) && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Valor excede o saldo disponível no cofre
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="levDestino">Destino / Finalidade *</Label>
              <Input
                id="levDestino"
                value={levDestino}
                onChange={(e) => setLevDestino(e.target.value)}
                placeholder="Ex: Pagamento de materiais, Despesas de evento..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="levDescricao">Descrição detalhada *</Label>
              <Textarea
                id="levDescricao"
                value={levDescricao}
                onChange={(e) => setLevDescricao(e.target.value)}
                placeholder="Descreva detalhadamente para que serve este levantamento..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="levObservacoes">Observações adicionais</Label>
              <Textarea
                id="levObservacoes"
                value={levObservacoes}
                onChange={(e) => setLevObservacoes(e.target.value)}
                placeholder="Notas internas (opcional)..."
                rows={2}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
              <p className="font-medium text-purple-700 mb-1">Regras de transparência:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>O destino e descrição são obrigatórios</li>
                <li>Apenas outro administrador pode aprovar</li>
                <li>O solicitante não pode aprovar o próprio pedido</li>
                <li>Toda a movimentação fica registada para auditoria</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLevantamentoModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSolicitarLevantamento}
              disabled={levSubmitting || !levValor || !levDescricao.trim() || !levDestino.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              {levSubmitting ? "A enviar..." : "Solicitar Levantamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    <ConfirmModal
      open={!!confirmDepId}
      onOpenChange={(open) => { if (!open) setConfirmDepId(null); }}
      title="Confirmar Depósito"
      description="Tem certeza que deseja confirmar este depósito? O valor será creditado no cofre da aldeia."
      confirmText="Confirmar"
      variant="default"
      onConfirm={() => { if (confirmDepId) { handleConfirmarDeposito(confirmDepId); setConfirmDepId(null); } }}
    />

    <ConfirmModal
      open={!!rejectDepId}
      onOpenChange={(open) => { if (!open) { setRejectDepId(null); setRejectDepMotivo(""); } }}
      title="Rejeitar Depósito"
      description={
        <div className="space-y-2">
          <p>Tem certeza que deseja rejeitar este depósito?</p>
          <Textarea
            placeholder="Motivo da rejeição (obrigatório)"
            value={rejectDepMotivo}
            onChange={(e) => setRejectDepMotivo(e.target.value)}
            rows={3}
          />
        </div>
      }
      confirmText="Rejeitar"
      variant="destructive"
      onConfirm={() => { if (rejectDepId && rejectDepMotivo.trim()) { handleRejeitarDeposito(rejectDepId, rejectDepMotivo); setRejectDepId(null); setRejectDepMotivo(""); } }}
    />

    <ConfirmModal
      open={!!confirmLevId}
      onOpenChange={(open) => { if (!open) setConfirmLevId(null); }}
      title="Confirmar Levantamento"
      description="Tem certeza que deseja confirmar este levantamento? O valor será deduzido do cofre."
      confirmText="Confirmar"
      variant="default"
      onConfirm={() => { if (confirmLevId) { handleConfirmarLevantamento(confirmLevId); setConfirmLevId(null); } }}
    />

    <ConfirmModal
      open={!!rejectLevId}
      onOpenChange={(open) => { if (!open) { setRejectLevId(null); setRejectLevMotivo(""); } }}
      title="Rejeitar Levantamento"
      description={
        <div className="space-y-2">
          <p>Tem certeza que deseja rejeitar este levantamento?</p>
          <Textarea
            placeholder="Motivo da rejeição (obrigatório)"
            value={rejectLevMotivo}
            onChange={(e) => setRejectLevMotivo(e.target.value)}
            rows={3}
          />
        </div>
      }
      confirmText="Rejeitar"
      variant="destructive"
      onConfirm={() => { if (rejectLevId && rejectLevMotivo.trim()) { handleRejeitarLevantamento(rejectLevId, rejectLevMotivo); setRejectLevId(null); setRejectLevMotivo(""); } }}
    />
    </>
  );
}
