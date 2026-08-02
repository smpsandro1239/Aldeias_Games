"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  DollarSign,
  Users,
  Building2,
  Gamepad2,
  Calendar,
  ChevronDown,
  TrendingUp,
  Trophy,
  Receipt,
  ArrowRight,
  X,
  Coins,
  Activity,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { Stats, Aldeia, Evento, Jogo, Transacao, Vencedor } from "./types";

export type StatExpandKey = "angariado" | "participacoes" | "aldeias" | "jogos" | "eventos";

interface StatsDetailPanelsProps {
  stats: Stats | null;
  aldeias: Aldeia[];
  eventos: Evento[];
  jogos: Jogo[];
  transacoes: Transacao[];
  vencedores: Vencedor[];
  mode?: "global" | "aldeia";
  onNavigate?: (tab: string) => void;
  onPush?: (href: string) => void;
}

interface AldeiaAgg {
  id: string;
  nome: string;
  angariado: number;
  participacoes: number;
  eventos: number;
  jogos: number;
}

const formatNum = (n: number) => n.toLocaleString("pt-PT");

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-container overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatsDetailPanels({
  stats,
  aldeias,
  eventos,
  jogos,
  transacoes,
  vencedores,
  mode = "global",
  onNavigate,
  onPush,
}: StatsDetailPanelsProps) {
  const [expanded, setExpanded] = useState<StatExpandKey | null>(null);

  const jogosAtivos = useMemo(() => jogos.filter((j) => j.estado === "aberto"), [jogos]);
  const eventosAtivos = useMemo(() => eventos.filter((e) => e.estado === "ativo"), [eventos]);

  const porAldeia = useMemo<AldeiaAgg[]>(() => {
    const map = new Map<string, AldeiaAgg>();
    for (const e of eventos) {
      const key = e.aldeiaId;
      const nome = e.aldeia?.nome || key;
      const cur = map.get(key) || { id: key, nome, angariado: 0, participacoes: 0, eventos: 0, jogos: 0 };
      cur.angariado += e.totalAngariado || 0;
      cur.participacoes += e.totalParticipacoes || 0;
      cur.eventos += 1;
      map.set(key, cur);
    }
    for (const j of jogos) {
      const aldeia = j.evento?.aldeia;
      const key = aldeia?.id;
      if (!key) continue;
      const cur = map.get(key) || { id: key, nome: aldeia?.nome || key, angariado: 0, participacoes: 0, eventos: 0, jogos: 0 };
      cur.jogos += 1;
      map.set(key, cur);
    }
    for (const a of aldeias) {
      if (!map.has(a.id)) {
        map.set(a.id, { id: a.id, nome: a.nome, angariado: 0, participacoes: 0, eventos: 0, jogos: 0 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.angariado - a.angariado || b.participacoes - a.participacoes);
  }, [eventos, jogos, aldeias]);

  const porEvento = useMemo(() => {
    return [...eventos]
      .filter((e) => mode === "aldeia" || e.aldeiaId)
      .sort((a, b) => (b.totalAngariado || 0) - (a.totalAngariado || 0))
      .map((e) => ({ nome: e.nome, aldeia: e.aldeia?.nome, angariado: e.totalAngariado || 0, participacoes: e.totalParticipacoes || 0, estado: e.estado }));
  }, [eventos, mode]);

  const topTransacoes = useMemo(
    () =>
      [...transacoes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [transacoes]
  );

  const maxAngariado = Math.max(...porAldeia.map((a) => a.angariado), 1);
  const maxParticipacoes = Math.max(...porAldeia.map((a) => a.participacoes), 1);
  const totalAngariado = stats?.totalAngariado ?? porAldeia.reduce((s, a) => s + a.angariado, 0);
  const totalParticipacoes = stats?.totalParticipacoes ?? porAldeia.reduce((s, a) => s + a.participacoes, 0);

  const toggle = (key: StatExpandKey) => setExpanded((cur) => (cur === key ? null : key));

  const renderBreakdown = () => (
    <div className="space-y-3">
      {porAldeia.map((a) => (
        <div key={a.id} className="flex items-center gap-3">
          <div className="w-1/4 min-w-0">
            <p className="text-sm font-medium text-accent truncate">{a.nome}</p>
            <p className="text-[11px] text-muted-foreground">
              {a.eventos} evento{a.eventos === 1 ? "" : "s"} · {a.jogos} jogo{a.jogos === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex-1">
            <ProgressBar value={a.angariado} max={maxAngariado} color="bg-emerald-500" />
          </div>
          <div className="w-28 text-right shrink-0">
            <p className="text-sm font-bold text-emerald-500">{formatCurrency(a.angariado)}</p>
            <p className="text-[11px] text-muted-foreground">{formatNum(a.participacoes)} part.</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAngariadoPanel = (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-surface-container p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> Total</p>
          <p className="text-xl font-black text-emerald-500 mt-1">{formatCurrency(totalAngariado)}</p>
        </div>
        <div className="rounded-xl bg-surface-container p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Activity className="h-3.5 w-3.5" /> Participações</p>
          <p className="text-xl font-black text-foreground mt-1">{formatNum(totalParticipacoes)}</p>
        </div>
        <div className="rounded-xl bg-surface-container p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Vencedores</p>
          <p className="text-xl font-black text-violet-500 mt-1">{formatNum(vencedores.length)}</p>
        </div>
      </div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {mode === "global" ? "Por aldeia" : "Por evento"}
      </h4>
      {mode === "global" ? (
        renderBreakdown()
      ) : (
        <div className="space-y-3">
          {porEvento.map((e) => (
            <div key={e.nome} className="flex items-center gap-3">
              <div className="w-1/3 min-w-0">
                <p className="text-sm font-medium text-accent truncate">{e.nome}</p>
              </div>
              <div className="flex-1">
                <ProgressBar value={e.angariado} max={maxAngariado} color="bg-emerald-500" />
              </div>
              <div className="w-28 text-right shrink-0">
                <p className="text-sm font-bold text-emerald-500">{formatCurrency(e.angariado)}</p>
                <p className="text-[11px] text-muted-foreground">{formatNum(e.participacoes)} part.</p>
              </div>
            </div>
          ))}
          {porEvento.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem eventos com receita.</p>}
        </div>
      )}
      {topTransacoes.length > 0 && (
        <>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-2">Últimas transações</h4>
          <div className="space-y-1">
            {topTransacoes.map((t) => {
              const isCredit = t.tipo === "carregamento" || t.tipo === "deposito";
              return (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", isCredit ? "bg-emerald-500/15" : "bg-red-500/15")}>
                      <Receipt className={cn("h-3.5 w-3.5", isCredit ? "text-emerald-500" : "text-red-500")} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-accent truncate">{t.user?.nome || "Sistema"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {t.descricao || t.tipo} · {new Date(t.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold ml-3 shrink-0", isCredit ? "text-emerald-500" : "text-red-500")}>
                    {isCredit ? "+" : "-"}{formatCurrency(Math.abs(t.valor))}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const renderParticipacoesPanel = (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl bg-surface-container p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Total</p>
          <p className="text-xl font-black text-foreground mt-1">{formatNum(totalParticipacoes)}</p>
        </div>
        <div className="rounded-xl bg-surface-container p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Vencedoras</p>
          <p className="text-xl font-black text-violet-500 mt-1">{formatNum(vencedores.length)}</p>
        </div>
        <div className="rounded-xl bg-surface-container p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Gamepad2 className="h-3.5 w-3.5" /> Jogos ativos</p>
          <p className="text-xl font-black text-amber-500 mt-1">{formatNum(stats?.jogosAtivos ?? jogosAtivos.length)}</p>
        </div>
      </div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {mode === "global" ? "Participações por aldeia" : "Participações por evento"}
      </h4>
      {mode === "global" ? (
        <div className="space-y-3">
          {porAldeia.map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <div className="w-1/4 min-w-0">
                <p className="text-sm font-medium text-accent truncate">{a.nome}</p>
              </div>
              <div className="flex-1">
                <ProgressBar value={a.participacoes} max={maxParticipacoes} color="bg-blue-500" />
              </div>
              <div className="w-24 text-right shrink-0">
                <p className="text-sm font-bold text-blue-500">{formatNum(a.participacoes)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {porEvento.map((e) => (
            <div key={e.nome} className="flex items-center gap-3">
              <div className="w-1/3 min-w-0">
                <p className="text-sm font-medium text-accent truncate">{e.nome}</p>
              </div>
              <div className="flex-1">
                <ProgressBar value={e.participacoes} max={maxParticipacoes} color="bg-blue-500" />
              </div>
              <div className="w-24 text-right shrink-0">
                <p className="text-sm font-bold text-blue-500">{formatNum(e.participacoes)}</p>
              </div>
            </div>
          ))}
          {porEvento.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem participações.</p>}
        </div>
      )}
    </div>
  );

  const renderAldeiasPanel = (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {porAldeia.map((a) => (
        <div key={a.id} className="rounded-xl bg-surface-container p-3 border border-outline-variant/5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-accent truncate">{a.nome}</p>
            <Badge className="bg-violet-500/15 text-violet-500 hover:bg-violet-500/20 text-[10px]">
              {formatCurrency(a.angariado)}
            </Badge>
          </div>
          <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
            <span>{a.eventos} evento{a.eventos === 1 ? "" : "s"}</span>
            <span>{a.jogos} jogo{a.jogos === 1 ? "" : "s"}</span>
            <span>{formatNum(a.participacoes)} part.</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderJogosPanel = (
    <div className="space-y-1.5">
      {jogosAtivos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem jogos ativos.</p>}
      {jogosAtivos.map((j) => (
        <div key={j.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Gamepad2 className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-accent truncate">{j.nome}</p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">
                {j.tipo.replace(/_/g, " ")}
                {j.evento?.aldeia?.nome ? ` · ${j.evento.aldeia.nome}` : ""}
                {j.evento?.nome ? ` · ${j.evento.nome}` : ""}
              </p>
            </div>
          </div>
          <Badge className="bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 text-[10px] shrink-0 ml-3">
            {formatCurrency(j.preco)}/bilhete
          </Badge>
        </div>
      ))}
    </div>
  );

  const renderEventosPanel = (
    <div className="space-y-1.5">
      {eventosAtivos.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem eventos ativos.</p>}
      {eventosAtivos.map((e) => (
        <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-accent truncate">{e.nome}</p>
              <p className="text-[11px] text-muted-foreground truncate">{e.aldeia?.nome || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <Badge className="bg-blue-500/15 text-blue-500 hover:bg-blue-500/20 text-[10px]">{formatNum(e.totalParticipacoes)} part.</Badge>
            <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 text-[10px]">{formatCurrency(e.totalAngariado)}</Badge>
          </div>
        </div>
      ))}
    </div>
  );

  const card3 = mode === "global"
    ? {
        key: "aldeias" as StatExpandKey,
        title: "Aldeias",
        value: aldeias.length.toString(),
        icon: Building2,
        color: "violet" as const,
      }
    : {
        key: "eventos" as StatExpandKey,
        title: "Eventos Ativos",
        value: stats?.eventosAtivos?.toString() || eventosAtivos.length.toString(),
        icon: Calendar,
        color: "violet" as const,
      };

  const renderPanelContent = (key: StatExpandKey) => {
    if (key === "angariado") return renderAngariadoPanel;
    if (key === "participacoes") return renderParticipacoesPanel;
    if (key === "aldeias") return renderAldeiasPanel;
    if (key === "jogos") return renderJogosPanel;
    if (key === "eventos") return renderEventosPanel;
    return null;
  };

  const panelFooter = (key: StatExpandKey): { label: string; tab?: string; href?: string } | null => {
    if (key === "angariado") return { label: "Ver transações", tab: "transacoes" };
    if (key === "participacoes") return { label: "Ver números jogados", href: "/numeros-jogados" };
    if (key === "aldeias") return { label: "Gerir aldeias", tab: "aldeias" };
    if (key === "jogos") return { label: "Gerir jogos", tab: "jogos" };
    if (key === "eventos") return { label: "Gerir eventos", tab: "eventos" };
    return null;
  };

  const cards: { key: StatExpandKey; title: string; value: string; icon: LucideIcon; color: "emerald" | "blue" | "violet" | "amber" }[] = [
    {
      key: "angariado",
      title: "Total Angariado",
      value: stats?.totalAngariado ? formatCurrency(stats.totalAngariado) : formatCurrency(totalAngariado),
      icon: DollarSign,
      color: "emerald",
    },
    {
      key: "participacoes",
      title: "Participações",
      value: stats?.totalParticipacoes ? formatNum(stats.totalParticipacoes) : formatNum(totalParticipacoes),
      icon: Users,
      color: "blue",
    },
    card3,
    {
      key: "jogos",
      title: "Jogos Ativos",
      value: stats?.jogosAtivos?.toString() || jogosAtivos.length.toString(),
      icon: Gamepad2,
      color: "amber",
    },
  ];

  const panelTitles: Record<StatExpandKey, string> = {
    angariado: "Análise de receita",
    participacoes: "Análise de participações",
    aldeias: "Resumo por aldeia",
    jogos: "Jogos ativos",
    eventos: "Eventos ativos",
  };

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => {
          const isOpen = expanded === c.key;
          return (
            <div key={c.key} className={cn(isOpen && "ring-2 ring-primary/60 rounded-xl shadow-lg")}>
              <StatCard
                title={c.title}
                value={c.value}
                icon={<c.icon className="h-5 w-5" />}
                color={c.color}
                subtitle={isOpen ? "Clique para ocultar" : "Clique para ver detalhes"}
                onClick={() => toggle(c.key)}
              />
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            key={expanded}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="mt-3 bg-surface-container-low border-outline-variant/10 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/5 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{panelTitles[expanded]}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const f = panelFooter(expanded);
                    if (!f) return null;
                    if (f.tab && onNavigate) {
                      return (
                        <button
                          onClick={() => onNavigate(f.tab!)}
                          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium"
                        >
                          {f.label} <ArrowRight className="h-3 w-3" />
                        </button>
                      );
                    }
                    if (f.href && onPush) {
                      return (
                        <button
                          onClick={() => onPush(f.href!)}
                          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium"
                        >
                          {f.label} <ArrowRight className="h-3 w-3" />
                        </button>
                      );
                    }
                    return null;
                  })()}
                  <button
                    onClick={() => setExpanded(null)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-surface-container"
                    aria-label="Fechar detalhes"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <CardContent className="p-4">{renderPanelContent(expanded)}</CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
