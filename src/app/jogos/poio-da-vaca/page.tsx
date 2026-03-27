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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Euro
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  configuracao: string;
  dimensoesCampo: string | null;
  custoQuadrado: number | null;
  valorPremioVaca: number | null;
  custoPremioDinheiro: number | null;
  rentabilidadePercentual: number | null;
  totalAngariado: number;
  totalParticipacoes: number;
}

interface Dimensoes {
  x: number;
  y: number;
  total: number;
}

function calcularRentabilidade(
  custoQuadrado: number,
  valorPremio: number,
  totalQuadrados: number,
  custoVacaFisica: number
): number {
  if (custoQuadrado <= 0 || totalQuadrados <= 0) return 0;
  
  const receitaTotal = custoQuadrado * totalQuadrados;
  const custoPremio = valorPremio > 0 ? valorPremio : custoVacaFisica;
  
  if (receitaTotal === 0) return 0;
  
  const lucro = receitaTotal - custoPremio;
  const rentabilidade = (lucro / receitaTotal) * 100;
  
  return Math.round(rentabilidade * 100) / 100;
}

function getRentabilidadeStatus(rentabilidade: number): {
  label: string;
  cor: string;
  icon: typeof TrendingUp;
  descricao: string;
} {
  if (rentabilidade >= 50) {
    return {
      label: "Excelente",
      cor: "text-green-400",
      icon: TrendingUp,
      descricao: "Rentabilidade muito elevada - ótimo negócio!"
    };
  }
  if (rentabilidade >= 30) {
    return {
      label: "Bom",
      cor: "text-green-300",
      icon: TrendingUp,
      descricao: "Rentabilidade boa - negócio rentável"
    };
  }
  if (rentabilidade >= 10) {
    return {
      label: "Aceitável",
      cor: "text-yellow-400",
      icon: TrendingUp,
      descricao: "Rentabilidade moderada"
    };
  }
  if (rentabilidade >= 0) {
    return {
      label: "Baixo",
      cor: "text-orange-400",
      icon: AlertTriangle,
      descricao: "Rentabilidade baixa - margem reduzida"
    };
  }
  return {
    label: "Negativo",
    cor: "text-red-400",
    icon: TrendingDown,
    descricao: "Prejuízo garantido - ajuste preços!"
  };
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

  const dimensoes: Dimensoes = jogo?.dimensoesCampo 
    ? JSON.parse(jogo.dimensoesCampo)
    : { x: 10, y: 10, total: 100 };
  
  const totalCells = dimensoes.x * dimensoes.y;
  
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const row = Math.floor(i / dimensoes.x);
    const col = i % dimensoes.x;
    const x = col + 1;
    const y = dimensoes.y - row;
    return { 
      id: i + 1, 
      x, 
      y,
      label: `${x}-${y}`,
      display: `X${x}Y${y}`
    };
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
    toast.success(`${count} quadrado${count > 1 ? 's' : ''} selecionado${count > 1 ? 's' : ''}!`);
  };

  const handleClearSelection = () => {
    setSelectedSquares([]);
  };

  const handleBet = () => {
    if (selectedSquares.length === 0) {
      toast.error("Selecione pelo menos um quadrado!");
      return;
    }
    const labels = selectedSquares.map(id => cells[id - 1].display).join(", ");
    toast.success(`Aposta em ${selectedSquares.length} quadrado${selectedSquares.length > 1 ? 's' : ''}: ${labels}`);
  };

  const custoPorQuadrado = jogo?.custoQuadrado || jogo?.preco || 5;
  const valorPremio = jogo?.valorPremioVaca || jogo?.custoPremioDinheiro || 1000;
  const custoVacaFisica = 800;
  const rentabilidade = calcularRentabilidade(custoPorQuadrado, valorPremio, totalCells, custoVacaFisica);
  const statusRentabilidade = getRentabilidadeStatus(rentabilidade);

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
              <p className="font-headline text-xl text-on-surface">
                {valorPremio > 500 ? "Vaca de Raça" : `${valorPremio}€ em Cartão"}`}
              </p>
              <div className="mt-3 flex items-center gap-2 text-on-surface-variant text-sm bg-surface-container-highest/50 self-start px-3 py-1 rounded-full">
                <Star className="w-3 h-3 text-primary-container" />
                <span>Sorteio Local Certificado</span>
              </div>
            </div>
          </div>
        </section>

        {/* Rentabilidade Info */}
        <section className="px-2">
          <div className="bg-surface-container rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-on-surface-variant" />
              <h3 className="font-headline text-lg">Análise de Rentabilidade</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface-container-low p-3 rounded-xl">
                <p className="text-[10px] text-on-surface-variant uppercase">Receita Total Esperada</p>
                <p className="font-headline text-xl text-primary">{custoPorQuadrado * totalCells}€</p>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl">
                <p className="text-[10px] text-on-surface-variant uppercase">Custo do Prémio</p>
                <p className="font-headline text-xl text-error">{valorPremio}€</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-xl ${rentabilidade >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">Rentabilidade:</span>
                <span className={`font-headline text-2xl ${statusRentabilidade.cor}`}>
                  {rentabilidade}%
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">{statusRentabilidade.descricao}</p>
            </div>
            
            <div className="mt-3 text-xs text-on-surface-variant/60">
              Campo: {dimensoes.x}×{dimensoes.y} = {totalCells} quadrados • {custoPorQuadrado}€ cada
            </div>
          </div>
        </section>

        {/* Quick Selection Buttons */}
        <section className="px-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-lg">Seleção Rápida</h3>
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

        {/* The Field - Square Grid with X/Y */}
        <section className="space-y-4 px-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-headline text-xl">O Campo</h3>
            <p className="text-on-surface-variant text-sm">Escolha os seus quadrados. A vaca é solta no campo e o primeiro "coco" determina o vencedor!</p>
            <p className="text-xs text-on-surface-variant/60 mt-1">
              Coordenadas: X (esquerda→direita) × Y (baixo→cima)
            </p>
          </div>

          {/* Square Field Container */}
          <div className="bg-surface-container-low rounded-[2rem] p-3">
            {/* Axis Labels */}
            <div className="flex justify-between px-8 mb-1">
              <span className="text-[10px] text-on-surface-variant">X →</span>
            </div>
            
            {/* Square Grid - maintains aspect ratio */}
            <div className="relative w-full aspect-square mb-2">
              <div 
                className="absolute inset-0 grid gap-0.5"
                style={{ 
                  gridTemplateColumns: `repeat(${dimensoes.x}, 1fr)`,
                  gridTemplateRows: `repeat(${dimensoes.y}, 1fr)`
                }}
              >
                {cells.map((cell) => {
                  const isSelected = selectedSquares.includes(cell.id);
                  
                  return (
                    <button
                      key={cell.id}
                      onClick={() => handleSquareClick(cell.id)}
                      className={`
                        relative flex items-center justify-center text-[8px] font-medium transition-all duration-150 rounded-sm
                        ${isSelected 
                          ? "bg-primary-container text-on-primary-container font-bold shadow-md z-10" 
                          : "bg-surface-container-highest/60 text-on-surface-variant/50 hover:bg-surface-container-high hover:text-on-surface-variant"
                        }
                      `}
                      title={cell.display}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        cell.id
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Grid overlay for visual structure */}
              <div className="absolute inset-0 pointer-events-none border border-outline-variant/20 rounded-lg"></div>
            </div>

            {/* Y axis label */}
            <div className="flex justify-between px-1">
              <span className="text-[10px] text-on-surface-variant">↑ Y</span>
              <span className="text-[10px] text-on-surface-variant">X →</span>
            </div>
            
            {/* Coordinate explanation */}
            <div className="mt-3 p-2 bg-surface-container-high/40 rounded-lg">
              <p className="text-[10px] text-on-surface-variant text-center">
                O campo tem <strong>{dimensoes.x}×{dimensoes.y} = {totalCells}</strong> quadrados
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Info */}
        <section className="px-2">
          <div className="bg-surface-container p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-on-surface-variant">Preço por quadrado</p>
              <p className="font-headline text-2xl text-primary">{custoPorQuadrado}€</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-on-surface-variant">Total</p>
              <p className="font-headline text-2xl text-secondary">
                {selectedSquares.length * custoPorQuadrado}€
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
                Uma vaca é solta no campo quadrado. Quando defecar pela primeira vez, verificamos as coordenadas (X,Y) do "coco" e o quadrado correspondente é o vencedor!
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
