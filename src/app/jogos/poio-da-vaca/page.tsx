"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Grid2X2, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Ticket,
  Star,
  Map,
  Award,
  ArrowLeft,
  Home,
  Shuffle,
  Plus,
  Minus
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
  const [selectedSquares, setSelectedSquares] = useState<number[]>([]);
  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [loading, setLoading] = useState(true);

  const randomOptions = [1, 3, 5, 10, 15, 20, 30];

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
  const gridSize = config.numerosPorLetra || 20;
  const totalCells = config.letras.length * gridSize;
  
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const letraIndex = Math.floor(i / gridSize);
    const numero = (i % gridSize) + 1;
    return { id: i + 1, label: `${config.letras[letraIndex]}${numero}`, letra: config.letras[letraIndex], row: Math.floor(i / gridSize), col: i % gridSize };
  });

  const handleSquareClick = (id: number) => {
    setSelectedSquares(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      return [...prev, id];
    });
  };

  const handleRandomPlay = (count: number) => {
    const available = cells.filter(c => !selectedSquares.includes(c.id));
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count).map(c => c.id);
    setSelectedSquares(prev => [...prev, ...selected]);
    toast.success(`${count} квадрадо${count > 1 ? 's' : ''} selecionado${count > 1 ? 's' : ''}!`);
  };

  const handleClearSelection = () => {
    setSelectedSquares([]);
  };

  const handleBet = () => {
    if (selectedSquares.length === 0) {
      toast.error("Selecione pelo menos um quadrado!");
      return;
    }
    const labels = selectedSquares.map(id => cells[id - 1].label).join(", ");
    toast.success(`Aposta em ${selectedSquares.length} quadrado${selectedSquares.length > 1 ? 's' : ''}: ${labels}`);
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
            <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
          </button>
          <Grid2X2 className="w-6 h-6 text-primary-container" />
          <h1 className="font-headline text-2xl tracking-wide text-primary-container font-bold italic">Poio da Vaca</h1>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container-high">
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <span className="text-xs">User</span>
          </div>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-6">
        {/* Hero Section & Prize */}
        <section className="relative space-y-4 px-2">
          <div className="text-xs font-semibold tracking-widest text-secondary-container uppercase mb-2">Grande Evento</div>
          <h2 className="font-headline text-3xl leading-tight text-on-surface max-w-[80%]">Onde a Sorte Encontra a Tradição</h2>
          
          <div className="glass-card rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 blur-3xl -mr-8 -mt-8"></div>
            <div className="flex flex-col gap-2 relative z-10">
              <span className="text-primary-container font-bold text-sm">GRANDE PRÉMIO</span>
              <p className="font-headline text-xl text-on-surface">Novilho de Raça ou 1000€ em Cartão</p>
              <div className="mt-3 flex items-center gap-2 text-on-surface-variant text-sm bg-surface-container-highest/50 self-start px-3 py-1 rounded-full">
                <Star className="w-3 h-3 text-primary-container" />
                <span>Sorteio Local Certificado</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Selection Buttons */}
        <section className="px-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-lg">快速选择 (Quick Select)</h3>
            <button 
              onClick={handleClearSelection}
              className="text-xs text-on-surface-variant hover:text-error transition-colors"
            >
              Limpar tudo
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {randomOptions.map(count => (
              <button
                key={count}
                onClick={() => handleRandomPlay(count)}
                className="px-4 py-2 bg-surface-container-high rounded-xl text-sm font-bold hover:bg-primary-container/20 hover:text-primary-container transition-colors"
              >
                +{count}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-2">
            <span className="bg-primary-container/20 px-2 py-1 rounded-lg text-primary-container font-bold">
              {selectedSquares.length}
            </span>
            <span>quadrado{selectedSquares.length !== 1 ? 's' : ''} selecionado{selectedSquares.length !== 1 ? 's' : ''}</span>
          </div>
        </section>

        {/* The Field - Square Grid */}
        <section className="space-y-4 px-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-headline text-xl">O Campo (The Field)</h3>
            <p className="text-on-surface-variant text-sm">Escolha os seus quadrados. A vaca será solta e o primeiro cocó determina o vencedor!</p>
          </div>

          {/* Square Field Container */}
          <div className="bg-surface-container-low rounded-[2rem] p-3">
            {/* Square Grid - maintains aspect ratio */}
            <div className="relative w-full aspect-square mb-4">
              <div 
                className="absolute inset-0 grid gap-0.5"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${config.letras.length}, 1fr)`
                }}
              >
                {cells.map((cell) => {
                  const isSelected = selectedSquares.includes(cell.id);
                  const isAvailable = true;
                  
                  return (
                    <button
                      key={cell.id}
                      onClick={() => handleSquareClick(cell.id)}
                      className={`
                        relative flex items-center justify-center text-[10px] font-medium transition-all duration-150 rounded-sm
                        ${isSelected 
                          ? "bg-primary-container text-on-primary-container font-bold shadow-md z-10" 
                          : "bg-surface-container-highest/60 text-on-surface-variant/50 hover:bg-surface-container-high hover:text-on-surface-variant"
                        }
                      `}
                      title={cell.label}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Grid overlay for visual structure */}
              <div className="absolute inset-0 pointer-events-none border border-outline-variant/20 rounded-lg"></div>
            </div>

            {/* Letter labels at bottom */}
            <div className="flex justify-between px-1 mb-3">
              {config.letras.map((letra: string, i: number) => (
                <span key={letra} className="text-[10px] font-bold text-on-surface-variant">{letra}</span>
              ))}
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-surface-container-high/40 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Data e Hora</span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-container" />
                  <span className="text-xs font-semibold">16/08/2026, 17:00</span>
                </div>
              </div>
              <div className="p-3 bg-surface-container-high/40 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">Localização</span>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-container" />
                  <span className="text-xs font-semibold">Campo da Feira</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Info */}
        <section className="px-2">
          <div className="bg-surface-container p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant">Preço por quadrado</p>
              <p className="font-headline text-2xl text-primary">{jogo?.preco || 5}€</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Total</p>
              <p className="font-headline text-2xl text-secondary">
                {selectedSquares.length * (jogo?.preco || 5)}€
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="pb-6 px-2">
          <Button 
            onClick={handleBet}
            disabled={selectedSquares.length === 0}
            className="w-full bg-primary-container text-on-primary-container font-bold py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl shadow-primary-container/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Ticket className="w-5 h-5" />
            <span className="text-lg">
              {selectedSquares.length === 0 
                ? "Selecione quadrados" 
                : `Apostar em ${selectedSquares.length} quadrado${selectedSquares.length > 1 ? 's' : ''}`
              }
            </span>
          </Button>
          <p className="text-center text-on-surface-variant/50 text-[10px] mt-3 px-4">
            Ao apostar, concorda com os regulamentos da Aldeias Games e das autoridades locais.
          </p>
        </section>

        {/* How it works */}
        <section className="px-2 pb-4">
          <div className="bg-surface-container-low p-4 rounded-[1.5rem] flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-surface-container-high flex items-center justify-center text-3xl">
              🐄
            </div>
            <div className="space-y-1">
              <h4 className="font-headline text-base">Como funciona?</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Uma vaca é solta no campo quadrado. Quando defecar pela primeira vez, verificamos as coordenadas (X,Y) do cocó e o quadrado correspondente é o vencedor!
              </p>
            </div>
          </div>
        </section>
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
          <Ticket className="w-6 h-6" style={{ fill: "currentColor" }} />
          <span className="font-sans text-[11px] font-medium tracking-tight">Apostas</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant/60 p-2 hover:bg-surface-container-high transition-colors rounded-xl">
          <Award className="w-6 h-6" />
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
