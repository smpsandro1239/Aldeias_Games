"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNav } from "@/components/bottom-nav";
import { Badge } from "@/components/ui/badge";
import {
  Gamepad2,
  Trophy,
  Ticket,
  CreditCard,
  Sparkles,
  Eye,
  Play,
  MapPin,
  Gift,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ScratchCardModal, NumberSelectorModal, PoioDaVacaModal, PaymentModal, ConfirmModal, VictoryCelebration, WalletBalance, EmptyJogos, EmptyParticipacoes, SelectPaymentModal } from "@/components/modals";
import { SkeletonStats, SkeletonGrid, SkeletonList } from "@/components/modals";
import { toast } from "sonner";
import { WalletCard } from "@/components/wallet/wallet-card";
import { GameList } from "@/components/games/game-list";
import { AldeiaWizardModal } from "@/components/modals/aldeia-wizard-modal";

interface ClienteDashboardProps {
  token: string;
}

interface Participacao {
  id: string;
  dadosParticipacao: string;
  valorPago: number;
  estadoPagamento: string;
  revelado: boolean;
  resultadoRaspe?: string;
  hashRaspe?: string;
  seedRaspe?: string;
  ganhador: boolean;
  createdAt: string;
  jogo?: {
    id: string;
    nome: string;
    tipo: string;
    preco: number;
    sorteado: boolean;
    dataSorteio?: string;
    premioId?: string;
    configuracao?: Record<string, unknown>;
    evento?: {
      nome: string;
      aldeia?: { nome: string };
    };
    premios?: Array<{
      id: string;
      nome: string;
      ordem: number;
    }>;
  };
  premio?: {
    id: string;
    nome: string;
  };
}

interface Jogo {
  id: string;
  nome: string;
  tipo: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha";
  descricao?: string;
  preco: number;
  stockAtual: number;
  configuracao: Record<string, unknown>;
  evento?: {
    nome: string;
    aldeia?: { nome: string };
  };
  premio?: { nome: string };
}

export function ClienteDashboard({ token }: ClienteDashboardProps) {
  const router = useRouter();
  const [participacoes, setParticipacoes] = useState<Participacao[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("jogos");
  const [saldo, setSaldo] = useState(0);
  const [walletStats, setWalletStats] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ role: string; aldeiaId?: string; aldeia?: { nome: string } } | null>(null);

  // Modais
  const [scratchCardOpen, setScratchCardOpen] = useState(false);
  const [numberSelectorOpen, setNumberSelectorOpen] = useState(false);
  const [poioDaVacaOpen, setPoioDaVacaOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedJogo, setSelectedJogo] = useState<Jogo | null>(null);
  const [selectedParticipacao, setSelectedParticipacao] = useState<Participacao | null>(null);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [selecaoPoioDaVaca, setSelecaoPoioDaVaca] = useState<{ letra: string; numero: number }[]>([]);
  const [numerosOcupadosPoio, setNumerosOcupadosPoio] = useState<{ letra: string; numero: number }[]>([]);
  const [numerosOcupadosRifa, setNumerosOcupadosRifa] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAldeia, setConfirmAldeia] = useState<{ jogo: Jogo; nome: string } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Celebração de vitória
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [victoryPremio, setVictoryPremio] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      // Fetch participações
      const partRes = await fetch("/api/participacoes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (partRes.ok) {
        const partData = await partRes.json();
        setParticipacoes(partData.data);
      }

      // Fetch jogos disponíveis
      const jogosRes = await fetch("/api/jogos?ativos=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (jogosRes.ok) {
        const jogosData = await jogosRes.json();
        setJogos(jogosData.data);
      }

      // Fetch saldo
      const walletRes = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setSaldo(walletData.saldo);
        setWalletStats(walletData);
      }

      // Fetch perfil do utilizador
      const perfilRes = await fetch("/api/users/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (perfilRes.ok) {
        const perfilData = await perfilRes.json();
        const profile = perfilData.data;
        setUserProfile(profile);

        if (profile?.role !== 'super_admin' && !profile?.aldeiaId) {
          setWizardOpen(true);
        }
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleJogar = async (jogo: Jogo) => {
    // Verificar se está a jogar noutra aldeia (apenas para não super_admins)
    const aldeiaDoJogo = jogo.evento?.aldeia?.nome;
    const minhaAldeiaNome = userProfile?.aldeia?.nome;
    if (userProfile?.role !== 'super_admin' && minhaAldeiaNome && aldeiaDoJogo && aldeiaDoJogo !== minhaAldeiaNome) {
      setConfirmAldeia({ jogo, nome: aldeiaDoJogo });
      setConfirmOpen(true);
      return;
    }

    proceedToJogo(jogo);
  };

  const proceedToJogo = (jogo: Jogo) => {
    router.push(`/jogos`);
  };

  const handleRevelarRaspadinha = (participacao: Participacao) => {
    setSelectedParticipacao(participacao);
    setScratchCardOpen(true);
  };

  const handleVerVitoria = (participacao: Participacao) => {
    if (participacao.ganhador && participacao.jogo?.premios && participacao.jogo.premios.length > 0) {
      setVictoryPremio({
        premio: participacao.jogo.premios[0],
        jogoNome: participacao.jogo.nome,
        tipoJogo: participacao.jogo.tipo,
      });
      setVictoryOpen(true);
    }
  };

  const handleConfirmarPagamento = async (metodo: string = "mbway") => {
    if (!selectedJogo) return;

    let dadosParticipacao: Record<string, unknown> = {};

    if (selectedJogo.tipo === "rifa" || selectedJogo.tipo === "tombola") {
      dadosParticipacao = { numeros: numerosSelecionados };
    } else if (selectedJogo.tipo === "poio_da_vaca") {
      dadosParticipacao = { coordenadas: selecaoPoioDaVaca };
    } else {
      dadosParticipacao = {};
    }

    const response = await fetch("/api/participacoes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jogoId: selectedJogo.id,
        dadosParticipacao,
        quantidade: numerosSelecionados.length || selecaoPoioDaVaca.length || 1,
        metodoPagamento: metodo,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      toast.success("Participação registada!");

      setPaymentOpen(false);
      setNumberSelectorOpen(false);
      setPoioDaVacaOpen(false);
      setNumerosSelecionados([]);
      setSelecaoPoioDaVaca([]);

      if (selectedJogo.tipo === "raspadinha" && data.participacao) {
        setSelectedParticipacao(data.participacao);
        setScratchCardOpen(true);
      }

      fetchData();
    } else {
      const error = await response.json();
      toast.error(error.error || "Erro ao registar participação");
    }
  };

  const handleRevelar = async (participacaoId?: string) => {
    const id = participacaoId || selectedParticipacao?.id;
    if (!id) return;

    const response = await fetch(`/api/participacoes/${id}/revelar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || "Erro ao revelar";
      throw new Error(errorMessage);
    }

    fetchData();
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "raspadinha":
        return <Sparkles className="h-5 w-5" />;
      case "poio_da_vaca":
        return <Gamepad2 className="h-5 w-5" />;
      default:
        return <Ticket className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-30" />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative">
            <Gamepad2 className="h-16 w-16 text-secondary animate-pulse" />
            <div className="absolute inset-0 h-16 w-16 bg-secondary/20 blur-xl rounded-full animate-pulse" />
          </div>
          <div className="text-gradient font-gaming text-2xl tracking-wider">
            A carregar...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 animated-gradient opacity-20 -z-10" />
      <div className="fixed inset-0 particle-bg opacity-10 -z-10" />

      {/* Header e Wallet */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 items-start">
        <div className="md:col-span-2 lg:col-span-3">
          <h1 className="text-3xl md:text-4xl font-gaming font-bold">
            <span className="text-gradient">Os Meus Jogos</span>
          </h1>
          <p className="text-muted-foreground mt-2">Participa nos jogos e tenta a tua sorte</p>
        </div>
        <div className="md:col-span-1">
          <WalletCard token={token} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Ticket, label: "Participações", value: participacoes.length, color: "secondary" },
          { icon: CreditCard, label: "Total Investido", value: formatCurrency(participacoes.reduce((sum, p) => sum + p.valorPago, 0)), color: "primary" },
          { icon: Trophy, label: "Prémios Ganhos", value: formatCurrency(walletStats?.historicoPremios?.total || 0), color: "tertiary" },
          { icon: Gift, label: "Cashback Recebido", value: formatCurrency(walletStats?.transacoes?.filter((t: any) => t.tipo === 'cashback').reduce((acc: number, t: any) => acc + t.valor, 0) || 0), color: "green-500" },
        ].map((stat, i) => (
          <Card
            key={i}
            className="card-hover bg-card/50 border-white/10 backdrop-blur-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <div className={`p-2 rounded-lg bg-${stat.color}/20`}>
                <stat.icon className={`h-4 w-4 text-${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-gaming font-bold text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#2e2928] border border-[#58413b]/30 p-1 grid grid-cols-3 rounded-2xl">
          <TabsTrigger
            value="jogos"
            className="data-[state=active]:bg-[#ff734b] data-[state=active]:text-[#110d0c] data-[state=active]:font-bold rounded-xl transition-all duration-200 text-[#e0bfb7] text-xs"
          >
            <Play className="h-3 w-3 mr-1" />
            Jogar
          </TabsTrigger>
          <TabsTrigger
            value="participacoes"
            className="data-[state=active]:bg-[#ff734b] data-[state=active]:text-[#110d0c] data-[state=active]:font-bold rounded-xl transition-all duration-200 text-[#e0bfb7] text-xs"
          >
            <Ticket className="h-3 w-3 mr-1" />
            Bilhetes
          </TabsTrigger>
          <TabsTrigger
            value="extrato"
            className="data-[state=active]:bg-[#ff734b] data-[state=active]:text-[#110d0c] data-[state=active]:font-bold rounded-xl transition-all duration-200 text-[#e0bfb7] text-xs"
          >
            <Receipt className="h-3 w-3 mr-1" />
            Extrato
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jogos" className="space-y-4">
          {userProfile?.role !== 'super_admin' && !userProfile?.aldeiaId ? (
            <Card className="p-12 text-center bg-card/50 border-white/10 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <MapPin className="h-16 w-16 text-muted-foreground" />
                  <div className="absolute inset-0 bg-secondary/10 blur-xl rounded-full" />
                </div>
                <div>
                  <p className="text-xl font-gaming font-bold text-white">Escolhe a tua Aldeia</p>
                  <p className="text-sm text-muted-foreground mt-2">Precisas de selecionar uma aldeia para ver os jogos disponíveis.</p>
                  <Button
                    onClick={() => setWizardOpen(true)}
                    className="mt-6 bg-secondary hover:bg-secondary/90"
                  >
                    Escolher Aldeia
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <GameList
              jogos={jogos as any}
              onJogoClick={(jogo) => handleJogar(jogo as any)}
              loading={loading}
              title={userProfile?.role === 'super_admin' ? "Todos os Jogos" : `Jogos de ${userProfile?.aldeia?.nome || "Carregando..."}`}
              emptyMessage={userProfile?.role === 'super_admin' ? "Nenhum jogo disponível" : "Nenhum jogo disponível na tua aldeia"}
              emptySubtext={userProfile?.role === 'super_admin' ? "Volte mais tarde!" : "Não há jogos ativos na tua aldeia de momento."}
              showAldeia={userProfile?.role === 'super_admin'}
            />
          )}
        </TabsContent>

        <TabsContent value="participacoes" className="space-y-4">
          {participacoes.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <Ticket className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Nenhuma participação</p>
                  <p className="text-sm text-muted-foreground">Ainda não参加了 nenhum jogo. Escolha um jogo para participar!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {participacoes.map((participacao) => (
                <Card key={participacao.id} className="bg-[#1f1b19] border-[#58413b]/20 rounded-2xl overflow-hidden card-hover">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-[#ff734b]/10 border border-[#ff734b]/20">
                          {getTipoIcon(participacao.jogo?.tipo || "")}
                        </div>
                        <div>
                          <h3 className="font-gaming text-lg text-[#eae0de]">{participacao.jogo?.nome}</h3>
                          <p className="text-sm text-[#e0bfb7]/60 flex items-center gap-1 mt-1">
                            {participacao.jogo?.evento?.aldeia?.nome} • {formatDate(participacao.createdAt)}
                          </p>
                          <p className="text-sm font-bold text-[#ff734b] mt-1">
                            {formatCurrency(participacao.valorPago)}
                          </p>

                          {/* Números jogados */}
                          {participacao.jogo?.tipo === "rifa" || participacao.jogo?.tipo === "tombola" ? (
                            <div className="mt-2">
                              <p className="text-xs text-[#e0bfb7]/50">Números jogados:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(() => {
                                  const dados = JSON.parse(participacao.dadosParticipacao as any || "{}");
                                  const numeros = dados.numeros || [];
                                  return numeros.map((n: number) => (
                                    <span
                                      key={n}
                                      className="px-2 py-0.5 bg-[#ff734b]/10 text-[#ff734b] text-xs rounded"
                                    >
                                      {n}
                                    </span>
                                  ));
                                })()}
                              </div>
                            </div>
                          ) : participacao.jogo?.tipo === "poio_da_vaca" ? (
                            <div className="mt-2">
                              <p className="text-xs text-[#e0bfb7]/50">Coordenadas:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(() => {
                                  const dados = JSON.parse(participacao.dadosParticipacao as any || "{}");
                                  const coordenadas = dados.coordenadas || dados.selecao || [];
                                  return coordenadas.map((c: { letra: string; numero: number }) => (
                                    <span
                                      key={`${c.letra}${c.numero}`}
                                      className="px-2 py-0.5 bg-[#ff734b]/10 text-[#ff734b] text-xs rounded"
                                    >
                                      {c.letra}{c.numero}
                                    </span>
                                  ));
                                })()}
                              </div>
                            </div>
                          ) : null}

                          {/* Resultado do sorteio */}
                          {participacao.jogo?.sorteado && (
                            <div className="mt-2">
                              {participacao.ganhador ? (
                                <p className="text-sm text-green-500 font-medium">
                                  ✓ Ganhou!
                                </p>
                              ) : (
                                <p className="text-sm text-[#e0bfb7]/40">
                                  Sorteio realizado: não foi sorteado
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participacao.ganhador && (
                          <Badge
                            className="bg-yellow-500 cursor-pointer hover:bg-yellow-600"
                            onClick={() => handleVerVitoria(participacao)}
                          >
                            <Trophy className="h-3 w-3 mr-1" />
                            Vencedor
                          </Badge>
                        )}
                        {participacao.jogo?.tipo === "raspadinha" && !participacao.revelado && (
                          <Button size="sm" onClick={() => handleRevelarRaspadinha(participacao)}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Revelar
                          </Button>
                        )}
                        {participacao.jogo?.tipo === "raspadinha" && participacao.revelado && (
                          <Badge variant={participacao.resultadoRaspe ? "default" : "secondary"}>
                            {participacao.resultadoRaspe || "Sem prémio"}
                          </Badge>
                        )}
                        {participacao.jogo?.sorteado && participacao.jogo?.premioId && (
                          <Button variant="outline" size="sm">
                            Ver Prémios
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="extrato" className="space-y-4">
          <Card className="bg-[#1f1b19] border-[#58413b]/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-secondary" />
                Extrato de Movimentos
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Consulte o histórico de carregamentos, prémios convertidos e cashbacks recebidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!walletStats?.transacoes || walletStats.transacoes.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Banknote className="h-10 w-10 opacity-20" />
                  <p>Sem movimentos recentes</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {walletStats.transacoes.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {t.tipo === "cashback" ? (
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Gift className="h-5 w-5 text-green-500" />
                          </div>
                        ) : t.valor > 0 ? (
                          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <ArrowUpRight className="h-5 w-5 text-blue-500" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <ArrowDownLeft className="h-5 w-5 text-red-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-[#eae0de]">
                            {t.descricao || "Transação"}
                          </p>
                          <p className="text-xs text-[#e0bfb7]/50 mt-1">
                            {formatDate(t.createdAt)} • Tipo: {t.tipo?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-lg ${t.valor > 0 ? "text-green-500" : "text-white"}`}>
                          {t.valor > 0 ? "+" : ""}{formatCurrency(t.valor)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais */}
      {selectedJogo && selectedJogo.tipo === "raspadinha" && (
        <PaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          valor={selectedJogo.preco}
          descricao={selectedJogo.nome}
          saldoDisponivel={saldo}
          userRole="stripe_blocked"
          onMBWayPayment={async () => {
            await handleConfirmarPagamento("mbway");
          }}
          onSaldoPayment={async () => {
            await handleConfirmarPagamento("saldo");
          }}
        />
      )}

      {selectedJogo && (selectedJogo.tipo === "rifa" || selectedJogo.tipo === "tombola") && (
        <NumberSelectorModal
          open={numberSelectorOpen}
          onOpenChange={setNumberSelectorOpen}
          numeroInicial={selectedJogo.configuracao.numeroInicial as number}
          numeroFinal={selectedJogo.configuracao.numeroFinal as number}
          numerosOcupados={numerosOcupadosRifa}
          numerosSelecionados={numerosSelecionados}
          onSelect={setNumerosSelecionados}
          onConfirm={() => {
            setNumberSelectorOpen(false);
            setPaymentOpen(true);
          }}
          preco={selectedJogo.preco}
        />
      )}

      {selectedJogo && selectedJogo.tipo === "poio_da_vaca" && (
        <PoioDaVacaModal
          open={poioDaVacaOpen}
          onOpenChange={setPoioDaVacaOpen}
          letras={(selectedJogo.configuracao.letras as string[]) || ["A", "B", "C", "D", "E"]}
          numerosPorLetra={(selectedJogo.configuracao.numerosPorLetra as number) || 20}
          numerosOcupados={numerosOcupadosPoio}
          numerosJogados={participacoes
            .filter(p => p.jogo?.id === selectedJogo.id)
            .map(p => {
              const dados = p.dadosParticipacao as unknown as { coordenadas?: { letra: string; numero: number }[] };
              return dados?.coordenadas || [];
            })
            .flat()
            .map((c: { letra: string; numero: number }) => ({ letra: c.letra, numero: c.numero }))}
          precoIndividual={selectedJogo.preco}
          precoCartao={((selectedJogo.configuracao.precos as { cartao: number })?.cartao) || selectedJogo.preco * 4}
          onSelect={setSelecaoPoioDaVaca}
          onConfirm={() => {
            setPoioDaVacaOpen(false);
            setPaymentOpen(true);
          }}
        />
      )}

      {selectedParticipacao && (
        <ScratchCardModal
          open={scratchCardOpen}
          onOpenChange={setScratchCardOpen}
          participacaoId={selectedParticipacao.id}
          hashRaspe={selectedParticipacao.hashRaspe || undefined}
          seedRaspe={selectedParticipacao.seedRaspe || undefined}
          resultadoRaspe={selectedParticipacao.resultadoRaspe || undefined}
          onReveal={handleRevelar}
          jaRevelado={selectedParticipacao.revelado}
          titulo={selectedParticipacao.jogo?.configuracao?.raspadinhaTitulo as string || "RASPADINHA PREMIUM"}
          organizacao={selectedParticipacao.jogo?.configuracao?.raspadinhaOrganizacao as string || ""}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmAldeia(null);
        }}
        title="Aviso - Aldeia Diferente"
        description={
          <div>
            <p className="mb-2">
              Está a jogar na aldeia <strong>"{confirmAldeia?.nome}"</strong>, que não é a sua aldeia de registo <strong>"{userProfile?.aldeia?.nome}"</strong>.
            </p>
            <p>Deseja continuar?</p>
          </div>
        }
        confirmText="Continuar"
        cancelText="Cancelar"
        onConfirm={() => {
          if (confirmAldeia?.jogo) {
            proceedToJogo(confirmAldeia.jogo);
          }
        }}
      />

      <AldeiaWizardModal
        open={wizardOpen}
        onComplete={(id, nome) => {
          setWizardOpen(false);
          fetchData();
        }}
      />

      {victoryPremio && (
        <VictoryCelebration
          open={victoryOpen}
          onOpenChange={setVictoryOpen}
          premio={victoryPremio.premio}
          jogoNome={victoryPremio.jogoNome}
          tipoJogo={victoryPremio.tipoJogo}
        />
      )}

      <BottomNav role="user" />
    </div>
  );
}
