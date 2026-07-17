"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gamepad2, CreditCard, Shield, Sparkles,
  Ticket, Leaf, Award, ArrowRight, Star, Clock,
  Heart, Flame, Home, Loader2, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Jogo {
  id: string;
  nome: string;
  tipo: JogoTipo;
  descricao?: string;
  preco: number;
  stockAtual: number;
}

type JogoTipo = "raspadinha" | "poio_da_vaca" | "rifa" | "euromilhoes" | string;

interface Evento {
  id: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  dataInicio: string;
  dataFim: string;
  aldeia?: { nome: string };
}

interface Aldeia {
  id: string;
  nome: string;
  tipoOrganizacao: string;
  logoUrl?: string;
}

interface Stats {
  aldeias: number;
  utilizadores: number;
  angariado: number;
}

interface LandingPageProps {
  jogos: Jogo[];
  eventos: Evento[];
  aldeias: Aldeia[];
  onRegisterClick: () => void;
  onLoginClick: () => void;
  onViewAllGames?: () => void;
  onGameClick?: (jogoId: string) => void;
  onEventoClick?: (eventoId: string) => void;
  onAldeiaClick?: (aldeiaId: string) => void;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const JOGO_ICONS: Record<string, React.ElementType> = {
  raspadinha: Sparkles,
  poio_da_vaca: Leaf,
  rifa: Ticket,
  euromilhoes: Award,
};

const JOGO_LABELS: Record<string, string> = {
  raspadinha: "Raspadinha",
  poio_da_vaca: "Poio da Vaca",
  rifa: "Rifa",
  euromilhoes: "Euromilhões",
};

interface Feature {
  icon: React.ElementType;
  title: string;
  desc: string;
  iconClass: string;
  hoverBgClass: string;
  tagClasses: string[];
  tags: string[];
}

const FEATURES: Feature[] = [
  {
    icon: Gamepad2,
    title: "Jogos que são Memórias",
    desc: "O Poio da Vaca, as Rifas, Euromilhões e Raspadinhas que conheces desde pequeno, agora na ponta dos teus dedos.",
    iconClass: "text-primary",
    hoverBgClass: "group-hover:bg-primary/20",
    tagClasses: ["text-primary", "text-muted-foreground"],
    tags: ["Tradição", "Nostalgia"],
  },
  {
    icon: Shield,
    title: "Sorteio com Honra",
    desc: "Algoritmos SHA-256 auditáveis. Aqui, nada é manipulado. A sorte é tua, como sempre foi.",
    iconClass: "text-secondary",
    hoverBgClass: "group-hover:bg-secondary/20",
    tagClasses: ["text-secondary", "text-muted-foreground"],
    tags: ["Justo", "Auditado"],
  },
  {
    icon: CreditCard,
    title: "Pagamentos que Chegam Longe",
    desc: "Stripe + MBWay. O dinheiro que angarias vai direto para a tua aldeia, esteja ela a 100km ou a 10000km.",
    iconClass: "text-accent",
    hoverBgClass: "group-hover:bg-accent/20",
    tagClasses: ["text-accent", "text-muted-foreground"],
    tags: ["Rápido", "Seguro"],
  },
];

const STATS_CONFIG = [
  {
    icon: Home,
    label: "Aldeias",
    getValue: (s: Stats) => `${s.aldeias}+`,
    iconClass: "text-primary",
  },
  {
    icon: Heart,
    label: "Utilizadores",
    getValue: (s: Stats) => `${s.utilizadores.toLocaleString("pt-PT")}+`,
    iconClass: "text-primary",
  },
  {
    icon: Flame,
    label: "Angariado",
    getValue: (s: Stats) => `€${s.angariado.toLocaleString("pt-PT")}+`,
    iconClass: "text-accent",
  },
  {
    icon: Shield,
    label: "Transparente",
    getValue: () => "100%",
    iconClass: "text-secondary",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconClass: string;
  isLoading: boolean;
}) {
  return (
    <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
      <div className="flex items-center gap-3 mb-3">
        <Icon className={cn("text-xl", iconClass)} />
        <span className="text-xs font-bold uppercase tracking-widest opacity-60">
          {label}
        </span>
      </div>
      {isLoading ? (
        <div className="h-9 w-24 bg-surface-container-low animate-pulse rounded-lg" />
      ) : (
        <p className="text-3xl font-bold">{value}</p>
      )}
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <div className="group bg-surface-container rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-default ring-1 ring-outline-variant/10 hover:ring-primary/50">
      <div className="mb-6">
        <div
          className={cn(
            "w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center transition-colors",
            feature.hoverBgClass
          )}
        >
          <Icon className={cn("text-3xl", feature.iconClass)} />
        </div>
      </div>
      <h4 className="font-serif text-2xl mb-2">{feature.title}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        {feature.desc}
      </p>
      <div className="flex gap-2 flex-wrap">
        {feature.tags.map((tag, j) => (
          <span
            key={tag}
            className={cn(
              "bg-surface-container-low px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter",
              feature.tagClasses[j]
            )}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function JogoCard({
  jogo,
  onClick,
}: {
  jogo: Jogo;
  onClick?: () => void;
}) {
  const Icon = JOGO_ICONS[jogo.tipo] ?? Gamepad2;
  const label = JOGO_LABELS[jogo.tipo] ?? jogo.tipo.replace("_", " ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-surface-container rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer ring-1 ring-outline-variant/10 hover:ring-primary/50 text-left w-full"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
          <Icon className="text-3xl text-primary" />
        </div>
        <Badge
          variant="secondary"
          className="bg-secondary/20 text-secondary text-xs"
        >
          {label}
        </Badge>
      </div>
      <h4 className="font-serif text-xl mb-2 group-hover:text-primary transition-colors">
        {jogo.nome}
      </h4>
      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
        {jogo.descricao}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
        <div>
          <span className="font-serif text-2xl font-bold text-primary">
            {jogo.preco.toFixed(2)}€
          </span>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Star className="h-3 w-3 text-accent" />
            {jogo.stockAtual} disponíveis
          </p>
        </div>
        <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl group-hover:shadow-lg group-hover:shadow-glow transition-shadow">
          Participar
        </span>
      </div>
    </button>
  );
}

function EventoCard({
  evento,
  onClick,
}: {
  evento: Evento;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-surface-container rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer ring-1 ring-outline-variant/10 hover:ring-primary/50 text-left w-full"
    >
      {evento.imagemUrl && (
        <div className="aspect-video w-full overflow-hidden bg-surface-container-low">
          <Image
            src={evento.imagemUrl}
            alt={evento.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            width={640}
            height={360}
            unoptimized
          />
        </div>
      )}
      <div className="p-6">
        {evento.aldeia?.nome && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Home className="h-4 w-4 text-primary" />
            <span>{evento.aldeia.nome}</span>
          </div>
        )}
        <h4 className="font-serif text-xl mb-2 group-hover:text-primary transition-colors">
          {evento.nome}
        </h4>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {evento.descricao}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <time dateTime={evento.dataInicio}>
            {new Date(evento.dataInicio).toLocaleDateString("pt-PT")}
          </time>
          <span>—</span>
          <time dateTime={evento.dataFim}>
            {new Date(evento.dataFim).toLocaleDateString("pt-PT")}
          </time>
        </div>
      </div>
    </button>
  );
}

function AldeiaCard({
  aldeia,
  onClick,
}: {
  aldeia: Aldeia;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-surface-container rounded-2xl p-4 border border-outline-variant/10 hover:border-primary/30 transition-colors text-left w-full flex items-center gap-3"
    >
      {aldeia.logoUrl ? (
        <Image
          src={aldeia.logoUrl}
          alt={`Logo de ${aldeia.nome}`}
          className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/30 shrink-0"
          width={40}
          height={40}
          unoptimized
        />
      ) : (
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Home className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-bold text-sm truncate">{aldeia.nome}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {aldeia.tipoOrganizacao.replace("_", " ")}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LandingPage({
  jogos,
  eventos,
  aldeias,
  onRegisterClick,
  onLoginClick,
  onViewAllGames,
  onGameClick,
  onEventoClick,
  onAldeiaClick,
}: LandingPageProps) {
  const [stats, setStats] = useState<Stats>({ aldeias: 0, utilizadores: 0, angariado: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/stats");
        const data = await res.json();
        if (!cancelled && data.success) {
          setStats(data.data);
        }
      } catch {
        // Silently fail - stats are non-critical
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayedJogos = jogos.slice(0, 4);
  const displayedEventos = eventos.slice(0, 6);
  const displayedAldeias = aldeias.slice(0, 8);

  const hasContent = displayedJogos.length > 0 || displayedEventos.length > 0 || displayedAldeias.length > 0;

  return (
    <div className="space-y-16">
      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <span className="text-primary font-label font-bold tracking-widest uppercase text-xs mb-4 block">
            O Teu Legado
          </span>
          <h2 className="font-serif text-5xl md:text-7xl leading-tight">
            Traz a tua{" "}
            <span className="text-primary italic">Aldeia para o Futuro</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-6 leading-relaxed">
            Mesmo longe, o teu coração nunca deixe de bater pela terra que te
            viu crescer. Aqui, a tradição encontra a tecnologia e tu podes ser o
            elo que une gerações.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button
              onClick={onRegisterClick}
              className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform gap-2"
            >
              Criar Conta Grátis
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={onLoginClick}
              className="px-6 py-3 rounded-xl border-outline-variant/20 text-foreground"
            >
              Entrar
            </Button>
          </div>
        </div>
        <div className="hidden lg:block w-48 h-48 bg-surface-container rounded-2xl relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
          <div className="p-6 flex flex-col h-full justify-between">
            <Heart className="text-primary text-4xl" />
            <span className="font-label text-xs font-bold leading-tight uppercase opacity-60">
              Preserva as tuas raízes
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats Row ────────────────────────────────────────────── */}
      <section
        aria-label="Estatísticas da plataforma"
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {STATS_CONFIG.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.getValue(stats)}
            iconClass={stat.iconClass}
            isLoading={statsLoading}
          />
        ))}
      </section>

      {/* ── Features Section ─────────────────────────────────────── */}
      <section aria-labelledby="features-heading">
        <h3
          id="features-heading"
          className="font-serif text-3xl mb-8 text-secondary"
        >
          Por que razão isto é teu?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </section>

      {/* ── Games Section ────────────────────────────────────────── */}
      {displayedJogos.length > 0 && (
        <section aria-labelledby="games-heading" id="eventos">
          <div className="flex justify-between items-center mb-8">
            <h3 id="games-heading" className="font-serif text-3xl text-secondary">
              Os Teus Jogos
            </h3>
            {onViewAllGames && (
              <Button
                variant="outline"
                onClick={onViewAllGames}
                className="border-outline-variant/20 gap-2"
              >
                Ver Todos
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedJogos.map((jogo) => (
              <JogoCard
                key={jogo.id}
                jogo={jogo}
                onClick={onGameClick ? () => onGameClick(jogo.id) : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Events Section ───────────────────────────────────────── */}
      {displayedEventos.length > 0 && (
        <section aria-labelledby="events-heading">
          <h3
            id="events-heading"
            className="font-serif text-3xl mb-8 text-primary"
          >
            Eventos em Destaque
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedEventos.map((evento) => (
              <EventoCard
                key={evento.id}
                evento={evento}
                onClick={
                  onEventoClick ? () => onEventoClick(evento.id) : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Aldeias Section ──────────────────────────────────────── */}
      {displayedAldeias.length > 0 && (
        <section aria-labelledby="aldeias-heading" id="aldeias">
          <h3
            id="aldeias-heading"
            className="font-serif text-3xl mb-8 text-accent"
          >
            A Tua Aldeia
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedAldeias.map((aldeia) => (
              <AldeiaCard
                key={aldeia.id}
                aldeia={aldeia}
                onClick={
                  onAldeiaClick ? () => onAldeiaClick(aldeia.id) : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty State ──────────────────────────────────────────── */}
      {!hasContent && (
        <section className="text-center py-16">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">A carregar conteúdo...</p>
        </section>
      )}

      {/* ── CTA Section ──────────────────────────────────────────── */}
      <section aria-label="Chamada para ação">
        <div className="bg-surface-container rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h3 className="font-serif text-3xl md:text-4xl mb-4">
              O teu lugar é aqui
            </h3>
            <p className="text-muted-foreground text-lg mb-8">
              Mesmo que estejas do outro lado do mundo, a tua aldeia precisa de
              ti. Une-te a milhares de Corações que mantêm a tradição viva.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={onRegisterClick}
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 md:px-10 py-4 rounded-xl font-bold shadow-xl shadow-glow hover:scale-105 transition-transform gap-3"
              >
                Criar Conta Grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={onLoginClick}
                className="px-8 md:px-10 py-4 rounded-xl border-outline-variant/20 text-foreground"
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 