"use client";

import { useState, useEffect } from "react";
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
import {
  User,
  Trophy,
  Gamepad2,
  DollarSign,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Vencedor {
  id: string;
  jogo?: {
    id: string;
    nome: string;
    tipo: string;
    preco: number;
    evento?: { nome: string };
  };
  nomeCliente?: string;
  telefoneCliente?: string;
  emailCliente?: string;
  user?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    saldo: number;
  };
  participacaoId?: string;
  createdAt: string;
  premioEntregue: boolean;
  dadosVencedor?: {
    userId?: string;
    userNome?: string;
    userEmail?: string;
    userTelefone?: string;
    letra?: string;
    numero?: number;
  };
}

interface VencedorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vencedor: Vencedor | null;
  token: string;
  onConvertPrize: (vencedor: Vencedor) => void;
  onEntregaPremio: (vencedor: Vencedor) => void;
}

export function VencedorDetailModal({
  open,
  onOpenChange,
  vencedor,
  token,
  onConvertPrize,
  onEntregaPremio,
}: VencedorDetailModalProps) {
  const [activeTab, setActiveTab] = useState("perfil");
  const [participacoes, setParticipacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && vencedor && activeTab === "historico") {
      fetchHistorico();
    }
  }, [open, vencedor, activeTab]);

  const fetchHistorico = async () => {
    if (!vencedor) return;
    const userId = vencedor.user?.id || vencedor.dadosVencedor?.userId;
    if (!userId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/participacoes?userId=${userId}&page=1&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const totalInvestido = participacoes.reduce((sum, p) => sum + p.valorPago, 0);
  const totalGanhos = vencedor.premioEntregue ? (vencedor.jogo?.preco || 0) : 0; // Simplificado

  if (!vencedor) return null;

  const nomeExibicao = vencedor.nomeCliente || vencedor.user?.nome || vencedor.dadosVencedor?.userNome || "Anónimo";
  const emailExibicao = vencedor.user?.email || vencedor.dadosVencedor?.userEmail || vencedor.emailCliente || "";
  const telefoneExibicao = vencedor.user?.telefone || vencedor.dadosVencedor?.userTelefone || vencedor.telefoneCliente || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Detalhes do Vencedor
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre o vencedor e seu histórico
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Card de Resumo */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{nomeExibicao}</h3>
                  {emailExibicao && <p className="text-sm text-muted-foreground">{emailExibicao}</p>}
                  {telefoneExibicao && <p className="text-sm text-muted-foreground">{telefoneExibicao}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-accent/10 text-accent">
                      <Trophy className="w-3 h-3 mr-1" />
                      {vencedor.jogo?.nome}
                    </Badge>
                    {vencedor.premioEntregue ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        <Award className="w-3 h-3 mr-1" />
                        Prémio Entregue/Convertido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{formatCurrency(vencedor.jogo?.preco || 0)}</p>
                  <p className="text-xs text-muted-foreground">Valor do prémio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="perfil">
                <User className="w-4 h-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="historico">
                <TrendingUp className="w-4 h-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{nomeExibicao}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{emailExibicao || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{telefoneExibicao || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Jogo</p>
                      <p className="font-medium">{vencedor.jogo?.nome || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data do Sorteio</p>
                      <p className="font-medium">{formatDate(vencedor.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <Badge variant={vencedor.premioEntregue ? "default" : "secondary"}>
                        {vencedor.premioEntregue ? "Entregue/Convertido" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="space-y-4 mt-4">
              {loading ? (
                <p className="text-center text-muted-foreground">A carregar...</p>
              ) : participacoes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground">Sem histórico de participações</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 p-2 text-xs font-semibold text-muted-foreground border-b">
                    <div className="col-span-4">Jogo</div>
                    <div className="col-span-3">Data</div>
                    <div className="col-span-2">Valor</div>
                    <div className="col-span-3">Resultado</div>
                  </div>
                  {participacoes.map((p) => (
                    <Card key={p.id} className="hover:bg-accent/5 transition-colors">
                      <CardContent className="p-3 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4 truncate">
                          <p className="font-medium">{p.jogo?.nome}</p>
                          <p className="text-xs text-muted-foreground">{p.jogo?.tipo}</p>
                        </div>
                        <div className="col-span-3 text-sm">
                          {formatDate(p.createdAt)}
                        </div>
                        <div className="col-span-2 font-semibold text-primary">
                          {formatCurrency(p.valorPago)}
                        </div>
                        <div className="col-span-3">
                          {p.ganhador ? (
                            <Badge className="bg-accent text-accent-foreground">
                              <Trophy className="w-3 h-3 mr-1" />
                              Ganhou
                            </Badge>
                          ) : (
                            <Badge variant="outline">Não sorteado</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Ações */}
          {!vencedor.premioEntregue && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onConvertPrize(vencedor)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Converter em Saldo
              </Button>
              <Button
                className="flex-1"
                onClick={() => onEntregaPremio(vencedor)}
              >
                <Award className="w-4 h-4 mr-2" />
                Entregar Prémio
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
