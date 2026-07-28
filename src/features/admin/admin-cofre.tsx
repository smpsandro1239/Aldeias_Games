"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import {
  Banknote, Send, Check, X, Clock, RefreshCw, History, Scale,
  ArrowLeft, ArrowUpFromLine
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { QuickAction } from "@/components/dashboard/quick-action";
import { CofreTransactionHistory } from "./cofre-transaction-history";
import { CofreDepositDialog } from "./cofre-deposit-dialog";
import { CofreWithdrawalDialog } from "./cofre-withdrawal-dialog";
import type { DepositoData, VaultData, VaultTransacao, Levantamento } from "./admin-cofre-types";

export function AdminCofre() {
  const [depositos, setDepositos] = useState<DepositoData[]>([]);
  const [vault, setVault] = useState<VaultData | null>(null);
  const [levantamentos, setLevantamentos] = useState<Levantamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pendentes");
  const [vaultTransacoes, setVaultTransacoes] = useState<VaultTransacao[]>([]);
  const [vaultTransacoesTotal, setVaultTransacoesTotal] = useState(0);
  const [vaultTransacoesPage, setVaultTransacoesPage] = useState(1);
  const vaultTransacoesLimit = 20;

  const [levantamentoModalOpen, setLevantamentoModalOpen] = useState(false);
  const [depositoModalOpen, setDepositoModalOpen] = useState(false);

  const [confirmDepId, setConfirmDepId] = useState<string | null>(null);
  const [rejectDepId, setRejectDepId] = useState<string | null>(null);
  const [rejectDepMotivo, setRejectDepMotivo] = useState("");
  const [confirmLevId, setConfirmLevId] = useState<string | null>(null);
  const [rejectLevId, setRejectLevId] = useState<string | null>(null);
  const [rejectLevMotivo, setRejectLevMotivo] = useState("");

  const searchParams = useSearchParams();
  const aldeiaId = searchParams.get("aldeiaId") || undefined;

  const fetchData = useCallback(async () => {
    try {
      const [depRes, vaultRes, levRes] = await Promise.all([
        apiRequest(`/api/cofre/pedido-deposito${aldeiaId ? `?aldeiaId=${aldeiaId}` : ''}`),
        apiRequest(`/api/cofre/historico?page=${vaultTransacoesPage}&limit=${vaultTransacoesLimit}${aldeiaId ? `&aldeiaId=${aldeiaId}` : ''}`),
        apiRequest(`/api/cofre/levantamento${aldeiaId ? `?aldeiaId=${aldeiaId}` : ''}`),
      ]);

      if (depRes.ok) {
        const data = await depRes.json();
        setDepositos(data.data);
      }
      if (vaultRes.ok) {
        const data = await vaultRes.json();
        setVault(data.data);
        if (data.transacoes) {
          setVaultTransacoes(data.transacoes.data || []);
          setVaultTransacoesTotal(data.transacoes.pagination?.total || 0);
        }
      }
      if (levRes.ok) {
        const data = await levRes.json();
        setLevantamentos(data.data);
      }
    } catch {
      toast.error("Erro ao carregar dados do cofre");
    } finally {
      setLoading(false);
    }
  }, [vaultTransacoesPage, vaultTransacoesLimit, aldeiaId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConfirmarDeposito = async (id: string) => {
    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "confirmar" })
      });
      if (res.ok) {
        toast.success("Depósito confirmado com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao confirmar depósito");
      }
    } catch {
      toast.error("Erro ao confirmar depósito");
    }
  };

  const handleRejeitarDeposito = async (id: string, motivo: string) => {
    try {
      const res = await apiRequest(`/api/cofre/pedido-deposito/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "rejeitar", observacoes: motivo })
      });
      if (res.ok) {
        toast.success("Depósito rejeitado");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao rejeitar depósito");
      }
    } catch {
      toast.error("Erro ao rejeitar depósito");
    }
  };

  const handleConfirmarLevantamento = async (id: string) => {
    try {
      const res = await apiRequest(`/api/cofre/levantamento/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
  const levPendentes = levantamentos.filter(l => l.estado === 'pendente');
  const levProcessados = levantamentos.filter(l => l.estado !== 'pendente');

  return (
    <>
      <div className="space-y-6 p-4 md:p-6">
        <div className="relative bg-gradient-to-r from-green-500/10 via-green-500/5 to-emerald-500/10 rounded-3xl p-6 border border-green-500/10">
          <div className="flex items-center gap-4 mb-2">
            <button onClick={() => window.location.href = aldeiaId ? `/admindashboard?aldeiaId=${aldeiaId}` : "/admindashboard"} className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center hover:bg-green-500/30 transition-colors">
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

        <div>
          <h2 className="font-serif text-lg font-semibold text-accent mb-3">Ações Rápidas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction
              icon={<Send className="w-5 h-5" />}
              label="Depositar no Cofre"
              onClick={() => setDepositoModalOpen(true)}
              color="emerald"
            />
            <QuickAction
              icon={<ArrowUpFromLine className="w-5 h-5" />}
              label="Solicitar Levantamento"
              onClick={() => setLevantamentoModalOpen(true)}
              color="violet"
            />
            <QuickAction
              icon={<Scale className="w-5 h-5" />}
              label="Reconciliação"
              onClick={() => window.location.href = aldeiaId ? `/admindashboard/cofre/reconciliacao?aldeiaId=${aldeiaId}` : '/admindashboard/cofre/reconciliacao'}
              color="blue"
            />
            <QuickAction
              icon={<History className="w-5 h-5" />}
              label="Movimentos"
              onClick={() => setActiveTab("historico")}
              color="orange"
            />
          </div>
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
              <Button size="sm" onClick={() => setDepositoModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Send className="w-4 h-4 mr-2" />
                Depositar no Cofre
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = aldeiaId ? `/admindashboard/cofre/reconciliacao?aldeiaId=${aldeiaId}` : '/admindashboard/cofre/reconciliacao'}>
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmLevId(lev.id)}>
                            <Check className="w-4 h-4 mr-1" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => { setRejectLevId(lev.id); setRejectLevMotivo(""); }}>
                            <X className="w-4 h-4 mr-1" /> Rejeitar
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">{formatCurrency(dep.valor)}</p>
                            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                              <Clock className="w-3 h-3 mr-1" /> PENDENTE
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{dep.descricao || "Depósito"}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>De: <strong>{dep.vendedor.nome}</strong></span>
                            <span>Criado: {formatDateTime(dep.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmDepId(dep.id)}>
                            <Check className="w-4 h-4 mr-1" /> Confirmar
                          </Button>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => { setRejectDepId(dep.id); setRejectDepMotivo(""); }}>
                            <X className="w-4 h-4 mr-1" /> Rejeitar
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
                            <Check className="w-3 h-3 mr-1" /> CONFIRMADO
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
                <ArrowUpFromLine className="w-4 h-4 mr-2" /> Solicitar Levantamento
              </Button>
            </div>

            {levPendentes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Pendentes de Aprovação</h4>
                {levPendentes.map((lev) => (
                  <Card key={lev.id} className="border-purple-500/30 mb-3">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-lg text-purple-700">{formatCurrency(lev.valor)}</p>
                            <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">
                              <Clock className="w-3 h-3 mr-1" /> PENDENTE
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
            <CofreTransactionHistory
              transacoes={vaultTransacoes}
              total={vaultTransacoesTotal}
              page={vaultTransacoesPage}
              limit={vaultTransacoesLimit}
              onPageChange={setVaultTransacoesPage}
            />
          </TabsContent>
        </Tabs>
      </div>

      <CofreDepositDialog
        open={depositoModalOpen}
        onOpenChange={setDepositoModalOpen}
        aldeiaId={aldeiaId}
        onSuccess={fetchData}
      />

      <CofreWithdrawalDialog
        open={levantamentoModalOpen}
        onOpenChange={setLevantamentoModalOpen}
        vaultSaldo={vault?.saldo || 0}
        aldeiaId={aldeiaId}
        onSuccess={fetchData}
      />

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
