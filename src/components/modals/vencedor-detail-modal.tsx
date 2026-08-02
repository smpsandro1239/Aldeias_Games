"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificarHashModal } from "@/components/verificar-hash-modal";
import { apiRequest } from "@/lib/api-client";
import {
  User,
  Trophy,
  Gamepad2,
  Euro,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight,
  BarChart2
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Vencedor {
  id: string;
  jogo?: {
    id?: string;
    nome?: string;
    tipo?: string;
    preco?: number;
    evento?: {
      id?: string;
      nome?: string;
      aldeia?: {
        id?: string;
        nome?: string;
      };
    };
    premios?: {
      id?: string;
      nome?: string;
      ordem?: number;
      valorDinheiroAlternative?: number | null;
    }[];
  };
  nomeCliente?: string;
  telefoneCliente?: string;
  emailCliente?: string;
  user?: {
    id?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    saldo?: number;
  };
  participacaoId?: string;
  createdAt: string;
  premioEntregue: boolean;
  ganhador?: boolean;
  valorPago?: number;
  resultadoRaspe?: string | null;
  dadosParticipacao?: string | null;
  alteracoes?: {
    id?: string;
    tipoAlteracao?: string;
    motivo?: string | null;
    dadosAnteriores?: string | null;
    createdAt?: string;
    user?: {
      id?: string;
      nome?: string;
      email?: string;
    };
  }[];
  dadosVencedor?: {
    userId?: string;
    userNome?: string;
    userEmail?: string;
    userTelefone?: string;
    letra?: number;
    numero?: number;
  };
}

interface Participacao {
  id: string;
  jogo?: {
    nome?: string;
    tipo?: string;
  };
  createdAt: string;
  valorPago: number;
  ganhador: boolean;
}

interface UserData {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
  saldo?: number;
  aldeiaId?: string;
  // Add other user properties if needed
}

interface AldeiaData {
  id: string;
  nome?: string;
  // Add other aldeia properties if needed
}

interface VencedorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vencedor: Vencedor | null;
  onConvertPrize: (vencedor: Vencedor) => void;
  onEntregaPremio: (vencedor: Vencedor) => void;
}

function useUserData(userId: string | undefined, active: boolean) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !active) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUserData(data.data || null);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, active]);

  return { userData, loading: loading };
}

function useAldeiaData(aldeiaId: string | undefined) {
  const [aldeiaData, setAldeiaData] = useState<AldeiaData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!aldeiaId) {
      setAldeiaData(null);
      return;
    }

    const fetchAldeiaData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/api/aldeias/${aldeiaId}`);
        if (res.ok) {
          const data = await res.json();
          setAldeiaData(data.data || null);
        }
      } catch (error) {
        console.error("Erro ao buscar aldeia:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAldeiaData();
  }, [aldeiaId]);

  return { aldeiaData, loading: loading };
}

function useHistoricoParticipacoes(userId: string | undefined, active: boolean) {
  const [participacoes, setParticipacoes] = useState<Participacao[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !active || participacoes.length > 0) return;

    const fetchHistorico = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/api/participacoes?userId=${userId}&page=1&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setParticipacoes(data.data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        toast.error("Erro ao carregar histórico");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [userId, active, participacoes.length]);

  return { participacoes, loading };
}

export function VencedorDetailModal({
  open,
  onOpenChange,
  vencedor,
  onConvertPrize,
  onEntregaPremio,
}: VencedorDetailModalProps) {
  const [activeTab, setActiveTab] = useState("perfil");
  const [verificarHashOpen, setVerificarHashOpen] = useState(false);
  const [hashVerificado, setHashVerificado] = useState(false);

  const userId = vencedor?.user?.id || vencedor?.dadosVencedor?.userId;
  const { userData, loading: loadingUser } = useUserData(userId, open && (activeTab === "perfil" || activeTab === "estatisticas"));
  const { aldeiaData, loading: loadingAldeia } = useAldeiaData(userData?.aldeiaId);
  const { participacoes, loading: loadingHistorico } = useHistoricoParticipacoes(
    userId,
    open && (activeTab === "historico" || activeTab === "estatisticas")
  );

  // Limpar dados ao trocar vencedor
  useEffect(() => {
    // Reset would happen naturally with new userId
  }, [vencedor]);

  const estatisticas = useMemo(() => {
    const total = participacoes.length;
    const vitorias = participacoes.filter(p => p.ganhador).length;
    const investido = participacoes.reduce((sum, p) => sum + p.valorPago, 0);
    const percentual = total > 0 ? ((vitorias / total) * 100).toFixed(1) : "0.0";
    return { total, vitorias, investido, percentual };
  }, [participacoes]);

  const handleConvertPrize = useCallback(() => {
    if (vencedor) onConvertPrize(vencedor);
  }, [vencedor, onConvertPrize]);

  const handleVerificacaoSucesso = useCallback(() => {
    setHashVerificado(true);
    setVerificarHashOpen(false);
  }, []);

  const handleEntregaPremio = useCallback(() => {
    if (!hashVerificado) {
      // Abrir modal de verificação se hash não foi verificado
      setVerificarHashOpen(true);
      return;
    }
    if (vencedor) onEntregaPremio(vencedor);
  }, [vencedor, onEntregaPremio, hashVerificado]);

  const parseWinningPrize = (v: Vencedor): { nome: string; valor: number } | null => {
    let dp: Record<string, unknown> | null = null;
    try {
      dp = typeof v.dadosParticipacao === 'string' ? JSON.parse(v.dadosParticipacao) : (v.dadosParticipacao as unknown);
    } catch {
      dp = null;
    }
    const winningPrize = (dp as Record<string, unknown>)?.winningPrize as Record<string, unknown> | null | undefined;
    if (winningPrize && typeof winningPrize.nome === 'string') {
      return { nome: winningPrize.nome, valor: Number(winningPrize.valorDinheiroAlternative) || 0 };
    }
    if ((dp as Record<string, unknown>)?.hasWin === true && Array.isArray((dp as Record<string, unknown>)?.grid)) {
      const counts = new Map<string, number>();
      for (const g of ((dp as Record<string, unknown>).grid as { nome?: string; valorDinheiroAlternative?: number }[])) {
        if (!g?.nome) continue;
        counts.set(g.nome, (counts.get(g.nome) || 0) + 1);
        if (counts.get(g.nome)! >= 3 && (Number(g.valorDinheiroAlternative) || 0) > 0) {
          return { nome: g.nome, valor: Number(g.valorDinheiroAlternative) || 0 };
        }
      }
    }
    if (v.resultadoRaspe && v.resultadoRaspe !== 'sem_premio') {
      const match = v.jogo?.premios?.find((p) => p.nome === v.resultadoRaspe);
      if (match) return { nome: match.nome || v.resultadoRaspe, valor: Number(match.valorDinheiroAlternative) || 0 };
      return { nome: v.resultadoRaspe, valor: 0 };
    }
    return null;
  };

  const ENTREGA_TIPO_LABEL: Record<string, string> = {
    entrega_premio: "Entregue",
    convert_prize: "Convertido em saldo",
    claim: "Reclamado (carteira)",
    claim_cofre: "Entregue ao cofre",
    claim_jogar_novamente: "Convertido para jogar",
    claim_pagar_cliente: "Pago ao cliente",
    desfazer_entrega_premio: "Entrega anulada",
  };

  if (!vencedor) return null;

  const wonPrize = parseWinningPrize(vencedor);

  const nomeExibicao = vencedor.nomeCliente || vencedor.user?.nome || vencedor.dadosVencedor?.userNome || "Anónimo";
  const emailExibicao = vencedor.user?.email || vencedor.dadosVencedor?.userEmail || vencedor.emailCliente || "";
  const telefoneExibicao = vencedor.user?.telefone || vencedor.dadosVencedor?.userTelefone || vencedor.telefoneCliente || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" aria-describedby="vencedor-detail-description">
        <DialogHeader className="bg-gradient-to-r from-amber-600/10 via-yellow-600/10 to-orange-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-amber-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-amber-600/20 p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-amber-600" aria-hidden="true" />
            </div>
            Detalhes do Vencedor
          </DialogTitle>
          <DialogDescription id="vencedor-detail-description">
            Informações completas sobre o vencedor {nomeExibicao} e o seu histórico
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Card de Resumo */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{nomeExibicao}</h3>
                  {emailExibicao && <p className="text-sm text-muted-foreground" aria-label={`Email: ${emailExibicao}`}>{emailExibicao}</p>}
                  {telefoneExibicao && <p className="text-sm text-muted-foreground" aria-label={`Telefone: ${telefoneExibicao}`}>{telefoneExibicao}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-accent/10 text-accent">
                      <Trophy className="w-3 h-3 mr-1" aria-hidden="true" />
                      {vencedor.jogo?.nome}
                    </Badge>
                    {vencedor.premioEntregue ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500" aria-label="Prémio entregue ou convertido">
                        <Award className="w-3 h-3 mr-1" aria-hidden="true" />
                        Prémio Entregue/Convertido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600" aria-label="Prémio pendente">
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary" aria-label={`Valor do prémio: ${formatCurrency(wonPrize?.valor ?? 0)}`}>
                    {formatCurrency(wonPrize?.valor ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{wonPrize?.nome ? `Prémio: ${wonPrize.nome}` : "Valor do prémio"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="perfil" aria-label="Ver perfil do vencedor">
                <User className="w-4 h-4 mr-2" aria-hidden="true" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="historico" aria-label="Ver histórico de participações">
                <TrendingUp className="w-4 h-4 mr-2" aria-hidden="true" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="estatisticas" aria-label="Ver estatísticas">
                <BarChart2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Estatísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium" aria-label={`Nome: ${nomeExibicao}`}>{nomeExibicao}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium" aria-label={`Email: ${emailExibicao || "Não disponível"}`}>{emailExibicao || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium" aria-label={`Telefone: ${telefoneExibicao || "Não disponível"}`}>{telefoneExibicao || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jogo</p>
                      <p className="font-medium" aria-label={`Jogo: ${vencedor.jogo?.nome || "Não disponível"}`}>{vencedor.jogo?.nome || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Aldeia</p>
                      <p className="font-medium" aria-label={`Aldeia: ${loadingUser || loadingAldeia ? "A carregar..." : aldeiaData?.nome || vencedor.jogo?.evento?.aldeia?.nome || "Não disponível"}`}>
                        {loadingUser || loadingAldeia ? "A carregar..." :
                          aldeiaData?.nome || vencedor.jogo?.evento?.aldeia?.nome || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data do Sorteio</p>
                      <p className="font-medium" aria-label={`Data do sorteio: ${formatDate(vencedor.createdAt)}`}>
                        {formatDate(vencedor.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <Badge variant={vencedor.premioEntregue ? "default" : "secondary"} aria-label={`Estado: ${vencedor.premioEntregue ? "Entregue/Convertido" : "Pendente"}`}>
                        {vencedor.premioEntregue ? "Entregue/Convertido" : "Pendente"}
                      </Badge>
                    </div>
                  </div>

                  {(vencedor.jogo?.premios?.length ?? 0) > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Prémios em jogo</p>
                      <div className="flex flex-wrap gap-2">
                        {vencedor.jogo!.premios!.map((p, i) => (
                          <Badge key={p.id || i} variant="outline">
                            {p.nome}
                            {typeof p.valorDinheiroAlternative === "number" && p.valorDinheiroAlternative > 0
                              ? ` • ${formatCurrency(p.valorDinheiroAlternative)}`
                              : ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {wonPrize && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Prémio ganho</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {wonPrize.nome}
                        {wonPrize.valor > 0 ? ` • ${formatCurrency(wonPrize.valor)}` : ""}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Histórico de entrega / auditoria</p>
                    {vencedor.alteracoes && vencedor.alteracoes.length > 0 ? (
                      <ul className="space-y-2">
                        {vencedor.alteracoes.map((a) => (
                          <li key={a.id} className="rounded-lg border p-2 text-sm">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-medium">{ENTREGA_TIPO_LABEL[a.tipoAlteracao || ""] || a.tipoAlteracao || "Alteração"}</span>
                              <span className="text-xs text-muted-foreground">
                                {a.user?.nome || "Desconhecido"}
                                {a.createdAt ? ` • ${formatDate(a.createdAt)}` : ""}
                              </span>
                            </div>
                            {a.motivo && <p className="text-xs text-muted-foreground mt-1">{a.motivo}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem registo de entrega.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="space-y-4 mt-4">
              {loadingHistorico ? (
                <p className="text-center text-muted-foreground">A carregar...</p>
              ) : participacoes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" aria-hidden="true" />
                    <p className="text-muted-foreground">Sem histórico de participações</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 p-2 text-xs font-semibold text-muted-foreground border-b">
                    <div className="col-span-3 sm:col-span-4">Jogo</div>
                    <div className="col-span-3 sm:col-span-3">Data</div>
                    <div className="hidden sm:block col-span-2">Valor</div>
                    <div className="col-span-3 sm:col-span-3">Resultado</div>
                  </div>
                  {participacoes.map((p) => (
                    <Card key={p.id} className="hover:bg-accent/5 transition-colors">
                      <CardContent className="p-3 grid grid-cols-6 sm:grid-cols-12 gap-2 items-center">
                        <div className="col-span-3 sm:col-span-4 truncate">
                          <p className="font-medium">{p.jogo?.nome}</p>
                          <p className="text-xs text-muted-foreground">{p.jogo?.tipo}</p>
                        </div>
                        <div className="col-span-3 sm:col-span-3 text-sm">
                          {formatDate(p.createdAt)}
                        </div>
                        <div className="hidden sm:block col-span-2 font-semibold text-primary">
                          {formatCurrency(p.valorPago)}
                        </div>
                        <div className="col-span-3 sm:col-span-3">
                          {p.ganhador ? (
                            <Badge className="bg-accent text-accent-foreground" aria-label="Ganhou o prémio">
                              <Trophy className="w-3 h-3 mr-1" aria-hidden="true" />
                              Ganhou
                            </Badge>
                          ) : (
                            <Badge variant="outline" aria-label="Não foi sorteado">Não sorteado</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="estatisticas" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Estatísticas de Participação</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-primary" aria-label={`${estatisticas.total} participações totais`}>
                        {estatisticas.total}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Participações</p>
                    </div>
                    <div className="bg-accent/10 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-accent" aria-label={`${estatisticas.vitorias} vitórias`}>
                        {estatisticas.vitorias}
                      </p>
                      <p className="text-sm text-muted-foreground">Vitórias</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-green-600" aria-label={`${estatisticas.percentual}% taxa de vitória`}>
                        {estatisticas.percentual}%
                      </p>
                      <p className="text-sm text-muted-foreground">Taxa de Vitória</p>
                    </div>
                    <div className="bg-secondary/10 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold" aria-label={`Total investido: ${formatCurrency(estatisticas.investido)}`}>
                        {formatCurrency(estatisticas.investido)}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Investido</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Status de Verificação */}
          {!vencedor.premioEntregue && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${hashVerificado ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">
                    Verificação: {hashVerificado ? '✅ Validada' : '❌ Pendente'}
                  </span>
                </div>
                {!hashVerificado && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVerificarHashOpen(true)}
                  >
                    Verificar Hash
                  </Button>
                )}
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>⚠️ Obrigatório:</strong> A entrega de prémios só pode ser realizada após verificação do hash de autenticidade.
                  {!hashVerificado && " Clique em 'Verificar Hash' para validar a participação."}
                </p>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleConvertPrize}
                  aria-label="Converter prémio em saldo"
                >
                  <Euro className="w-4 h-4 mr-2" aria-hidden="true" />
                  Converter em Saldo
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleEntregaPremio}
                  disabled={!hashVerificado}
                  aria-label="Marcar prémio como entregue"
                >
                  <Award className="w-4 h-4 mr-2" aria-hidden="true" />
                  {hashVerificado ? 'Entregar Prémio' : 'Verificar Primeiro'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Verificação de Hash */}
        <VerificarHashModal
          open={verificarHashOpen}
          onOpenChange={setVerificarHashOpen}
        />

      </DialogContent>
    </Dialog>
  );
}