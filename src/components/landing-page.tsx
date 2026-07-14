"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gamepad2, CreditCard, Shield, Sparkles, 
  Ticket, Leaf, Award, ArrowRight, Star, Clock, Home, Heart, Flame
} from "lucide-react";

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  descricao?: string;
  preco: number;
  stockAtual: number;
}

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

interface LandingPageProps {
  jogos: Jogo[];
  eventos: Evento[];
  aldeias: Aldeia[];
  onRegisterClick: () => void;
  onLoginClick: () => void;
}

// Mapa seguro para classes dinâmicas do Tailwind (evita purge em produção)
const colorClasses = {
  primary: { text: "text-primary", bg: "bg-primary/20" },
  secondary: { text: "text-secondary", bg: "bg-secondary/20" },
  accent: { text: "text-accent", bg: "bg-accent/20" },
};

export function LandingPage({ jogos, eventos, aldeias, onRegisterClick, onLoginClick }: LandingPageProps) {
  const [stats, setStats] = useState({ aldeias: 0, utilizadores: 0, angariado: 0 });

  useEffect(() => {
    fetch('/api/public/stats')
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(() => {});
  }, []);

  const getJogoIcon = (tipo: string) => {
    const iconClass = "h-7 w-7";
    switch (tipo) {
      case "raspadinha": return <Sparkles className={iconClass} />;
      case "poio_da_vaca": return <Leaf className={iconClass} />;
      case "rifa": return <Ticket className={iconClass} />;
      case "euromilhoes": return <Award className={iconClass} />;
      default: return <Gamepad2 className={iconClass} />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-PT", { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const statsData = [
    { icon: Home, label: "Aldeias", value: `${stats.aldeias}+`, color: "text-primary" },
    { icon: Heart, label: "Utilizadores", value: `${stats.utilizadores.toLocaleString('pt-PT')}+`, color: "text-primary" },
    { icon: Flame, label: "Angariado", value: `€${stats.angariado.toLocaleString('pt-PT')}+`, color: "text-accent" },
    { icon: Shield, label: "Transparente", value: "100%", color: "text-secondary" },
  ];

  const features = [
    { 
      icon: Gamepad2, 
      title: "Jogos que são Memórias", 
      desc: "O Poio da Vaca, as Rifas, Euromilhões e Raspadinhas que conheces desde pequeno, agora na ponta dos teus dedos.", 
      color: "primary" as const, 
      tags: ["Tradição", "Nostalgia"] 
    },
    { 
      icon: Shield, 
      title: "Sorteio com Honra", 
      desc: "Algoritmos SHA-256 auditáveis. Aqui, nada é manipulado. A sorte é tua, como sempre foi.", 
      color: "secondary" as const, 
      tags: ["Justo", "Auditado"] 
    },
    { 
      icon: CreditCard, 
      title: "Pagamentos que Chegam Longe", 
      desc: "Stripe + MBWay. O dinheiro que angarias vai direto para a tua aldeia, esteja ela a 100 km ou a 10 000 km.", 
      color: "accent" as const, 
      tags: ["Rápido", "Seguro"] 
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <span className="text-primary font-label font-bold tracking-widest uppercase text-xs mb-4 block">O Teu Legado</span>
          <h2 className="font-serif text-5xl md:text-7xl leading-tight">
            Traz a tua <span className="text-primary italic">Aldeia para o Futuro</span>
          </h2>
          <p className="text-muted-foreground text-lg mt-6 leading-relaxed">
            Mesmo longe, não deixes o teu coração de bater pela terra que te viu crescer. 
            Aqui, a tradição encontra a tecnologia e tu podes ser o elo que une gerações.
          </p>
        </div>
        <div className="hidden lg:block w-48 h-48 bg-surface-container rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
          <div className="p-6 flex flex-col h-full justify-between">
            <Heart className="text-primary h-10 w-10" />
            <span className="font-label text-xs font-bold leading-tight uppercase opacity-60">Preserva as tuas raízes</span>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {statsData.map((stat, i) => (
          <div key={i} className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <section className="mb-16">
        <h3 className="font-serif text-3xl mb-8 flex items-center gap-4">
          <span className="text-secondary">Porquê fazer parte?</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const c = colorClasses[feature.color];
            return (
              <div key={i} className="group bg-surface-container rounded-3xl p-6 transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-outline-variant/10 hover:ring-primary/50">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 ${c.bg} rounded-2xl flex items-center justify-center transition-colors`}>
                    <feature.icon className={`h-7 w-7 ${c.text}`} />
                  </div>
                </div>
                <h4 className="font-serif text-2xl mb-2">{feature.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{feature.desc}</p>
                <div className="flex gap-2 flex-wrap">
                  {feature.tags.map((tag, j) => (
                    <span key={j} className={`bg-surface-container-low px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${j === 0 ? c.text : 'text-muted-foreground'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Games Section */}
      {jogos.length > 0 && (
        <section className="mb-16" id="jogos">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-serif text-3xl flex items-center gap-4">
              <span className="text-secondary">Os Teus Jogos</span>
            </h3>
            <Button variant="outline" className="border-outline-variant/20">
              Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {jogos.slice(0, 4).map((jogo) => (
              <div key={jogo.id} className="group bg-surface-container rounded-3xl p-6 transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-outline-variant/10 hover:ring-primary/50">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                    {getJogoIcon(jogo.tipo)}
                  </div>
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary text-xs capitalize">
                    {jogo.tipo.replace("_", " ")}
                  </Badge>
                </div>
                <h4 className="font-serif text-xl mb-2 group-hover:text-primary transition-colors">{jogo.nome}</h4>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{jogo.descricao}</p>
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                  <div>
                    <span className="font-serif text-2xl font-bold text-primary">{jogo.preco.toFixed(2)}€</span>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Star className="h-3 w-3 text-accent" />
                      {jogo.stockAtual} disponíveis
                    </p>
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground font-bold">
                    Participar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Events Section */}
      {eventos.length > 0 && (
        <section className="mb-16" id="eventos">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-serif text-3xl flex items-center gap-4">
              <span className="text-primary">Eventos em Destaque</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {eventos.slice(0, 3).map((evento) => (
              <div key={evento.id} className="group bg-surface-container rounded-3xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-outline-variant/10 hover:ring-primary/50">
                {evento.imagemUrl && (
                  <div className="aspect-video w-full overflow-hidden">
                    {/* Nota: Se usares Next.js, troca <img> por <Image from 'next/image' /> */}
                    <img src={evento.imagemUrl} alt={`Imagem do evento ${evento.nome}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Home className="h-4 w-4 text-primary" />
                    <span>{evento.aldeia?.nome || "Aldeia desconhecida"}</span>
                  </div>
                  <h4 className="font-serif text-xl mb-2 group-hover:text-primary transition-colors">{evento.nome}</h4>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{evento.descricao}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(evento.dataInicio)} - {formatDate(evento.dataFim)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Aldeias Section */}
      <section className="mb-16" id="aldeias">
        <h3 className="font-serif text-3xl mb-8 flex items-center gap-4">
          <span className="text-accent">A Tua Aldeia</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {aldeias.slice(0, 8).map((aldeia) => (
            <div key={aldeia.id} className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                {aldeia.logoUrl ? (
                  <img src={aldeia.logoUrl} alt={`Logo de ${aldeia.nome}`} className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/30" />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm">{aldeia.nome}</p>
                  <p className="text-xs text-muted-foreground capitalize">{aldeia.tipoOrganizacao.replace("_", " ")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mb-16">
        <div className="bg-surface-container rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h3 className="font-serif text-4xl mb-4">O teu lugar é aqui</h3>
            <p className="text-muted-foreground text-lg mb-8">
              Mesmo que estejas do outro lado do mundo, a tua aldeia precisa de ti. Junta-te a milhares de corações que mantêm a tradição viva.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={onRegisterClick} className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-10 py-4 rounded-xl font-bold shadow-xl shadow-glow hover:scale-105 transition-transform flex items-center gap-3">
                Criar Conta Grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={onLoginClick} className="px-10 py-4 rounded-xl border-outline-variant/20 text-foreground">
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}