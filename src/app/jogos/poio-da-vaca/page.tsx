"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Grid4X4, 
  CheckCircle, 
  CalendarToday, 
  LocationOn, 
  ConfirmationNumber,
  Stars,
  Home,
  Map,
  EmojiEvents,
  ArrowBack
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  configuracao: string;
}

export default function PoioDaVacaPage() {
  const router = useRouter();
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);
  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJogo();
  }, []);

  const fetchJogo = async () => {
    try {
      const response = await fetch("/api/jogos?ativos=true&tipo=poio_da_vaca");
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        setJogo(data.data[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar jogo:", error);
    } finally {
      setLoading(false);
    }
  };

  const config = jogo?.configuracao ? JSON.parse(jogo.configuracao) : { letras: ["A", "B", "C", "D", "E"], numerosPorLetra: 20 };
  const totalCells = config.letras.length * config.numerosPorLetra;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const letraIndex = Math.floor(i / config.numerosPorLetra);
    const numero = (i % config.numerosPorLetra) + 1;
    return { id: i + 1, label: `${config.letras[letraIndex]}${numero}`, letra: config.letras[letraIndex] };
  });

  const handleSquareClick = (id: number) => {
    setSelectedSquare(id);
  };

  const handleBet = () => {
    if (!selectedSquare) {
      toast.error("Selecione um quadrado primeiro!");
      return;
    }
    toast.success(`Aposta no quadrado ${cells[selectedSquare - 1].label} registada!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <div className="text-on-surface-variant">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-body pb-32">
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 bg-surface-container-low transition-colors duration-300 shadow-lg flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-high rounded-full transition-colors">
            <ArrowBack className="w-5 h-5 text-on-surface-variant" />
          </button>
          <Grid4X4 className="w-6 h-6 text-primary-container" />
          <h1 className="font-headline text-2xl tracking-wide text-primary-container font-bold italic">Poio da Vaca</h1>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-high">
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <span className="text-xs">User</span>
          </div>
        </div>
      </header>

      <main className="px-6 pt-8 space-y-8">
        {/* Hero Section & Prize */}
        <section className="relative space-y-4">
          <div className="text-xs font-semibold tracking-widest text-secondary-container uppercase mb-2">Grande Evento</div>
          <h2 className="font-headline text-4xl leading-tight text-on-surface max-w-[80%]">Onde a Sorte Encontra a Tradição</h2>
          
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 blur-3xl -mr-10 -mt-10"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <span className="text-primary-container font-bold text-sm">GRANDE PRÉMIO</span>
              <p className="font-headline text-2xl text-on-surface">Novilho de Raça ou 1000€ em Cartão</p>
              <div className="mt-4 flex items-center gap-2 text-on-surface-variant text-sm bg-surface-container-highest/50 self-start px-3 py-1 rounded-full">
                <Stars className="w-3 h-3 text-primary-container" />
                <span>Sorteio Local Certificado</span>
              </div>
            </div>
          </div>
        </section>

        {/* The Field (O Campo) */}
        <section className="space-y-6">
          <div className="flex flex-col gap-1">
            <h3 className="font-headline text-2xl">O Campo</h3>
            <p className="text-on-surface-variant text-sm">Escolha o seu quadrado e espere pela sorte!</p>
          </div>

          {/* Bento Field Container */}
          <div className="bg-surface-container-low rounded-[2rem] p-4 md:p-6">
            <div className="grid grid-cols-5 md:grid-cols-8 gap-1 md:gap-2 aspect-square mb-6 max-w-lg mx-auto">
              {cells.map((cell) => (
                <button
                  key={cell.id}
                  onClick={() => handleSquareClick(cell.id)}
                  className={`
                    rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200
                    ${selectedSquare === cell.id 
                      ? "bg-primary-container text-on-primary-container scale-110 shadow-lg z-10 font-bold" 
                      : "bg-surface-container-highest text-on-surface-variant/40 hover:bg-surface-container-high hover:text-on-surface-variant"
                    }
                  `}
                >
                  {selectedSquare === cell.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    cell.id
                  )}
                </button>
              ))}
            </div>

            {/* Event Details In-Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container-high/40 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Data e Hora</span>
                <div className="flex items-center gap-2">
                  <CalendarToday className="w-4 h-4 text-primary-container" />
                  <span className="text-sm font-semibold">16/08/2026, 17:00</span>
                </div>
              </div>
              <div className="p-4 bg-surface-container-high/40 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Localização</span>
                <div className="flex items-center gap-2">
                  <LocationOn className="w-4 h-4 text-primary-container" />
                  <span className="text-sm font-semibold">Campo da Feira</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="pb-10">
          <Button 
            onClick={handleBet}
            className="w-full bg-primary-container text-on-primary-container font-bold py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl shadow-primary-container/20"
          >
            <ConfirmationNumber className="w-5 h-5" />
            <span className="text-lg">Apostar no Quadrado {selectedSquare ? cells[selectedSquare - 1].label : ""}</span>
          </Button>
          <p className="text-center text-on-surface-variant/50 text-[10px] mt-4 px-10">
            Ao apostar, concorda com os regulamentos da Aldeias Games e das autoridades locais.
          </p>
        </section>

        {/* Extra Info Card */}
        <div className="bg-surface-container-low p-6 rounded-[2rem] flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-surface-container-high">
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🐄
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="font-headline text-lg">Novilho de Raça</h4>
            <p className="text-sm text-on-surface-variant">Criado organicamente nas montanhas locais. Um símbolo da nossa herança.</p>
          </div>
        </div>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/15 shadow-2xl flex justify-around items-center px-4 pb-6 pt-2 rounded-t-3xl md:hidden">
        <button onClick={() => router.push('/')} className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:bg-surface-container-high transition-colors rounded-xl">
          <Home className="w-6 h-6" />
          <span className="font-sans text-[11px] font-medium tracking-tight">Início</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:bg-surface-container-high transition-colors rounded-xl">
          <Map className="w-6 h-6" />
          <span className="font-sans text-[11px] font-medium tracking-tight">O Campo</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary-container bg-surface-container-high/60 rounded-xl p-2 scale-90 transition-transform">
          <ConfirmationNumber className="w-6 h-6" style={{ fill: "currentColor" }} />
          <span className="font-sans text-[11px] font-medium tracking-tight">Apostas</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:bg-surface-container-high transition-colors rounded-xl">
          <EmojiEvents className="w-6 h-6" />
          <span className="font-sans text-[11px] font-medium tracking-tight">Prémios</span>
        </button>
      </nav>

      <style jsx global>{`
        .glass-card {
          background: rgba(46, 41, 40, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
      `}</style>
    </div>
  );
}
