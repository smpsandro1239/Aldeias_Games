"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Gamepad2,
  Trophy,
  Ticket,
  CreditCard,
  Sparkles,
  Eye,
  Play,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ScratchCardModal, NumberSelectorModal, PoioDaVacaModal, PaymentModal, ConfirmModal, VictoryCelebration, WalletBalance, EmptyJogos, EmptyParticipacoes } from "@/components/modals";
import { SkeletonStats, SkeletonGrid, SkeletonList } from "@/components/modals";
import { toast } from "sonner";
import { WalletCard } from "@/components/wallet/wallet-card";

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
  const [participacoes, setParticipacoes] = useState<Participacao[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("jogos");
  const [saldo, setSaldo] = useState(0);
  const [aldeiaPrincipal, setAldeiaPrincipal] = useState<{ id: string; nome: string } | null>(null);

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
      }

      // Fetch perfil do utilizador para obter aldeia principal
      const perfilRes = await fetch("/api/users/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (perfilRes.ok) {
        const perfilData = await perfilRes.json();
        if (perfilData.data?.aldeiaPrincipal) {
          setAldeiaPrincipal(perfilData.data.aldeiaPrincipal);
        }
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleJogar = async (jogo: Jogo) => {
    // Verificar se está a jogar noutra aldeia
    const aldeiaDoJogo = jogo.evento?.aldeia?.nome;
    if (aldeiaPrincipal && aldeiaDoJogo && aldeiaDoJogo !== aldeiaPrincipal.nome) {
      setConfirmAldeia({ jogo, nome: aldeiaDoJogo });
      setConfirmOpen(true);
      return;
    }

    proceedToJogo(jogo);
  };

  const proceedToJogo = async (jogo: Jogo) => {
    setSelectedJogo(jogo);

    // Buscar números ocupados para o jogo
    try {
      const res = await fetch(`/api/participacoes?jogoId=${jogo.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const participacoes = data.data || [];

        if (jogo.tipo === "poio_da_vaca") {
          const ocupdos = participacoes.map((p: any) => {
            const dados = JSON.parse(p.dadosParticipacao || "{}");
            return dados.selecao || [];
          }).flat();
          setNumerosOcupadosPoio(ocupdos);
        } else if (jogo.tipo === "rifa" || jogo.tipo === "tombola") {
          const ocupdos = participacoes.map((p: any) => {
            const dados = JSON.parse(p.dadosParticipacao || "{}");
            return dados.numero;
          }).filter(Boolean);
          setNumerosOcupadosRifa(ocupdos);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar números ocupados:", error);
    }

    switch (jogo.tipo) {
      case "raspadinha":
        setPaymentOpen(true);
        break;
      case "rifa":
      case "tombola":
        setNumberSelectorOpen(true);
        break;
      case "poio_da_vaca":
        setPoioDaVacaOpen(true);
        break;
    }
  };

  const handleRevelarRaspadinha = (participacao: Participacao) => {
    setSelectedParticipacao(participacao);
    setScratchCardOpen(true);
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
          <p className="text-muted-foreground mt-2">Participa em jogos e ganha prémios</p>
        </div>
        <div className="md:col-span-1">
          <WalletCard token={token} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Ticket, label: "Participações", value: participacoes.length, color: "secondary" },
          { icon: CreditCard, label: "Total Gasto", value: formatCurrency(participacoes.reduce((sum, p) => sum + p.valorPago, 0)), color: "primary" },
          { icon: Trophy, label: "Vitórias", value: participacoes.filter((p) => p.ganhador).length, color: "tertiary" },
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
        <TabsList className="bg-card/50 border border-white/10 backdrop-blur-sm p-1">
          <TabsTrigger 
            value="jogos" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Jogar
          </TabsTrigger>
          <TabsTrigger 
            value="participacoes"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary data-[state=active]:to-primary data-[state=active]:text-white"
          >
            <Ticket className="h-4 w-4 mr-2" />
            As Minhas Participações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jogos" className="space-y-4">
          {jogos.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 border-white/10 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <Gamepad2 className="h-16 w-16 text-muted-foreground" />
                  <div className="absolute inset-0 bg-secondary/10 blur-xl rounded-full" />
                </div>
                <div>
                  <p className="text-xl font-gaming font-bold text-white">Nenhum jogo disponível</p>
                  <p className="text-sm text-muted-foreground mt-2">De momento não há jogos ativos. Volte mais tarde!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jogos.map((jogo) => (
              <Card key={jogo.id} className="card-hover bg-card/50 border-white/10 backdrop-blur-sm overflow-hidden group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-secondary/20">
                      {getTipoIcon(jogo.tipo)}
                    </div>
                    <Badge variant="outline" className="border-secondary/30 text-secondary text-xs capitalize">
                      {jogo.tipo.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-gaming mt-3">{jogo.nome}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {jogo.evento?.aldeia?.nome} • {jogo.evento?.nome}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{jogo.descricao}</p>
                  {jogo.premio && (
                    <p className="text-sm mb-3">
                      <span className="font-medium text-tertiary">Prémio:</span> {jogo.premio.nome}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
                    <div>
                      <p className="text-2xl font-gaming font-bold text-gradient">
                        {formatCurrency(jogo.preco)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{jogo.stockAtual} disponíveis</p>
                    </div>
                    <Button 
                      onClick={() => handleJogar(jogo)}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Jogar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
              <Card key={participacao.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{participacao.jogo?.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {participacao.jogo?.evento?.aldeia?.nome} •{" "}
                        {formatDate(participacao.createdAt)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(participacao.valorPago)}
                      </p>
                      {/* Números jogados */}
                      {participacao.jogo?.tipo === "rifa" || participacao.jogo?.tipo === "tombola" ? (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Números jogados:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(() => {
                              const dados = JSON.parse(participacao.dadosParticipacao as any || "{}");
                              const numeros = dados.numeros || [];
                              return numeros.map((n: number) => (
                                <span
                                  key={n}
                                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                                >
                                  {n}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      ) : participacao.jogo?.tipo === "poio_da_vaca" ? (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Coordenadas:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(() => {
                              const dados = JSON.parse(participacao.dadosParticipacao as any || "{}");
                              const coordenadas = dados.coordenadas || dados.selecao || [];
                              return coordenadas.map((c: { letra: string; numero: number }) => (
                                <span
                                  key={`${c.letra}${c.numero}`}
                                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
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
                            <p className="text-sm text-green-600 font-medium">
                              ✓ Ganhou!
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Sorteio realizado: não foi sorteado
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {participacao.ganhador && (
                        <Badge className="bg-yellow-500">
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
      </Tabs>

      {/* Modais */}
      {selectedJogo && selectedJogo.tipo === "raspadinha" && (
        <PaymentModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          valor={selectedJogo.preco}
          descricao={selectedJogo.nome}
          saldoDisponivel={saldo}
          onMBWayPayment={async () => {
            await handleConfirmarPagamento("mbway");
          }}
          onStripePayment={async () => {
            await handleConfirmarPagamento("stripe");
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
              Está a jogar na aldeia <strong>"{confirmAldeia?.nome}"</strong>, que não é a sua aldeia de registo <strong>"{aldeiaPrincipal?.nome}"</strong>.
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
    </div>
  );
}
