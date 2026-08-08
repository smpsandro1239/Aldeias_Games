"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, TrendingUp, BarChart2, Trophy } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ENTREGA_TIPO_LABEL, Participacao, Vencedor, WonPrize } from "./vencedor-detail-types";

interface VencedorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  vencedor: Vencedor;
  nomeExibicao: string;
  emailExibicao: string;
  telefoneExibicao: string;
  wonPrize: WonPrize | null;
  aldeiaData?: { id: string; nome?: string } | null;
  loadingUser: boolean;
  loadingAldeia: boolean;
  participacoes: Participacao[];
  loadingHistorico: boolean;
  estatisticas: { total: number; vitorias: number; investido: number; percentual: string };
}

export function VencedorTabs(props: VencedorTabsProps) {
  const { activeTab, onTabChange, vencedor, nomeExibicao, emailExibicao, telefoneExibicao, wonPrize, aldeiaData, loadingUser, loadingAldeia, participacoes, loadingHistorico, estatisticas } = props;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
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
  );
}