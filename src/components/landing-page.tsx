"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gamepad2, Users, CreditCard, Shield, Sparkles, 
  Ticket, Leaf, Award, ArrowRight, Star, Clock, MapPin, PartyPopper, House 
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

export function LandingPage({ jogos, eventos, aldeias, onRegisterClick, onLoginClick }: LandingPageProps) {
  const getJogoIcon = (tipo: string) => {
    switch (tipo) {
      case "raspadinha": return <Sparkles className="text-3xl" />;
      case "poio_da_vaca": return <Leaf className="text-3xl" />;
      case "rifa": return <Ticket className="text-3xl" />;
      case "tombola": return <Award className="text-3xl" />;
      default: return <Gamepad2 className="text-3xl" />;
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <span className="text-[#ff734b] font-label font-bold tracking-widest uppercase text-xs mb-4 block">Portal de Angariação</span>
          <h2 className="font-serif text-5xl md:text-7xl leading-tight">
            Lança a tua <span className="text-[#ff734b] italic">Campanha Herança</span>
          </h2>
          <p className="text-[#e0bfb7] text-lg mt-6 leading-relaxed">
            Cria um evento de angariação de fundos único que combina tradição local com competição digital.
          </p>
        </div>
        <div className="hidden lg:block w-48 h-48 bg-[#1a1614] rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#ff734b]/20 to-transparent"></div>
          <div className="p-6 flex flex-col h-full justify-between">
            <PartyPopper className="text-[#9cefff] text-4xl" />
            <span className="font-label text-xs font-bold leading-tight uppercase opacity-60">Ready to boost your village?</span>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { icon: House, label: "Aldeias", value: "50+", color: "text-[#ff734b]" },
          { icon: Users, label: "Jogadores", value: "10K+", color: "text-[#9cefff]" },
          { icon: CreditCard, label: "Angariado", value: "€500K+", color: "text-[#ffc107]" },
          { icon: Shield, label: "Transparente", value: "100%", color: "text-[#ff734b]" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1a1614] rounded-2xl p-6 border border-[#58413b]/10">
            <div className="flex items-center gap-3 mb-3">
              <stat.icon className={`${stat.color} text-xl`} />
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Features Section */}
      <section className="mb-16">
        <h3 className="font-serif text-3xl mb-8 flex items-center gap-4">
          <span className="text-[#9cefff]">Porquê escolher-nos?</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Gamepad2, title: "Jogos Imersivos", desc: "Poio da Vaca, Rifas, Tombolas e Raspadinhas com experiência única.", color: "[#ff734b]", tags: ["High Engagement", "Traditional"] },
            { icon: Shield, title: "Sorteios Transparentes", desc: "Algoritmos SHA-256 auditáveis garantem justiça absoluta.", color: "[#9cefff]", tags: ["Blockchain", "Auditoria"] },
            { icon: CreditCard, title: "Pagamentos Instant", desc: "Stripe + MBWay integrados para transações rápidas.", color: "[#ffc107]", tags: ["MBWay", "Stripe"] },
          ].map((feature, i) => (
            <div key={i} className="group bg-[#1a1614] rounded-3xl p-6 transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-[#58413b]/10 hover:ring-[#ff734b]/50">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-[#2e2928] rounded-2xl flex items-center justify-center group-hover:bg-[#ff734b]/20 transition-colors">
                  <feature.icon className={`text-${feature.color} text-3xl`} />
                </div>
              </div>
              <h4 className="font-serif text-2xl mb-2">{feature.title}</h4>
              <p className="text-[#e0bfb7] text-sm leading-relaxed mb-4">{feature.desc}</p>
              <div className="flex gap-2 flex-wrap">
                {feature.tags.map((tag, j) => (
                  <span key={j} className={`bg-[#2e2928] px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${j === 0 ? `text-${feature.color}` : 'text-[#e0bfb7]'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Games Section */}
      {jogos.length > 0 && (
        <section className="mb-16" id="eventos">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-serif text-3xl flex items-center gap-4">
              <span className="text-[#9cefff]">Jogos em Destaque</span>
            </h3>
            <Button variant="outline" className="border-[#58413b]/20">
              Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {jogos.slice(0, 4).map((jogo) => (
              <div key={jogo.id} className="group bg-[#1a1614] rounded-3xl p-6 transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-[#58413b]/10 hover:ring-[#ff734b]/50">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-[#ff734b]/20 rounded-2xl flex items-center justify-center">
                    {getJogoIcon(jogo.tipo)}
                  </div>
                  <Badge variant="secondary" className="bg-[#9cefff]/20 text-[#9cefff] text-xs capitalize">
                    {jogo.tipo.replace("_", " ")}
                  </Badge>
                </div>
                <h4 className="font-serif text-xl mb-2 group-hover:text-[#ff734b] transition-colors">{jogo.nome}</h4>
                <p className="text-[#e0bfb7] text-sm mb-4 line-clamp-2">{jogo.descricao}</p>
                <div className="flex items-center justify-between pt-4 border-t border-[#58413b]/10">
                  <div>
                    <span className="font-serif text-2xl font-bold text-[#ff734b]">{jogo.preco.toFixed(2)}€</span>
                    <p className="text-xs text-[#e0bfb7] mt-1 flex items-center gap-1">
                      <Star className="h-3 w-3 text-[#ffc107]" />
                      {jogo.stockAtual} disponíveis
                    </p>
                  </div>
                  <Button size="sm" className="bg-[#ff734b] text-[#110d0c] font-bold">
                    Jogar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Events Section */}
      {eventos.length > 0 && (
        <section className="mb-16">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-serif text-3xl flex items-center gap-4">
              <span className="text-[#ff734b]">Eventos Ativos</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {eventos.slice(0, 6).map((evento) => (
              <div key={evento.id} className="group bg-[#1a1614] rounded-3xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-[#58413b]/10 hover:ring-[#ff734b]/50">
                {evento.imagemUrl && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={evento.imagemUrl} alt={evento.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-[#e0bfb7] mb-2">
                    <MapPin className="h-4 w-4 text-[#ff734b]" />
                    <span>{evento.aldeia?.nome}</span>
                  </div>
                  <h4 className="font-serif text-xl mb-2 group-hover:text-[#ff734b] transition-colors">{evento.nome}</h4>
                  <p className="text-[#e0bfb7] text-sm line-clamp-2 mb-4">{evento.descricao}</p>
                  <div className="flex items-center gap-2 text-xs text-[#e0bfb7]">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(evento.dataInicio).toLocaleDateString("pt-PT")} - {new Date(evento.dataFim).toLocaleDateString("pt-PT")}</span>
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
          <span className="text-[#ffc107]">Nossas Aldeias</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {aldeias.slice(0, 8).map((aldeia) => (
            <div key={aldeia.id} className="bg-[#1a1614] rounded-2xl p-4 border border-[#58413b]/10 hover:border-[#ff734b]/30 transition-colors">
              <div className="flex items-center gap-3">
                {aldeia.logoUrl ? (
                  <img src={aldeia.logoUrl} alt={aldeia.nome} className="h-10 w-10 rounded-xl object-cover ring-2 ring-[#ff734b]/30" />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-[#ff734b]/20 flex items-center justify-center">
                    <House className="h-5 w-5 text-[#ff734b]" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm">{aldeia.nome}</p>
                  <p className="text-xs text-[#e0bfb7] capitalize">{aldeia.tipoOrganizacao.replace("_", " ")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mb-16">
        <div className="bg-[#1a1614] rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff734b]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h3 className="font-serif text-4xl mb-4">Pronto para transformar a tua aldeia?</h3>
            <p className="text-[#e0bfb7] text-lg mb-8">Junta-te a dezenas de comunidades que já estão a angariar fundos de forma moderna e transparente.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={onRegisterClick} className="bg-gradient-to-r from-[#ff734b] to-[#ff734b]/80 text-[#110d0c] px-10 py-4 rounded-xl font-bold shadow-xl shadow-[#ff734b]/20 hover:scale-105 transition-transform flex items-center gap-3">
                Criar Conta Grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="outline" onClick={onLoginClick} className="px-10 py-4 rounded-xl border-[#58413b]/20 text-[#eae0de]">
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
