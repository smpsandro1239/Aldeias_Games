"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Euro,
  User,
  Phone,
  Mail,
  UserPlus,
  MessageCircle,
  Bell,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentSelector } from "@/components/payment";
import { LayoutHeader } from "@/components/layout-header";
import { ParticipacaoConfirmacaoModal } from "@/components/modals/participacao-confirmacao-modal";

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
  valorCompraVaca: number | null;
  valorMercadoVaca: number | null;
  rentabilidadePercentual: number | null;
  totalAngariado: number;
  totalParticipacoes: number;
}

interface Jogador {
  id?: string;
  nome: string;
  telefone?: string;
  email?: string;
}

interface Aposta {
  id?: string;
  jogoId: string;
  numeros: number[];
  jogadorNome?: string | null;
  jogadorTelefone?: string | null;
  jogadorEmail?: string | null;
  jogador?: {
    nome: string;
    telefone?: string;
    email?: string;
  };
  vendedorId?: string | null;
  data?: string;
  createdAt?: string;
  pago: boolean;
  isPropria?: boolean;
}

interface Dimensoes {
  x: number;
  y: number;
  total: number;
}

function calcularRentabilidade(
  custoQuadrado: number,
  valorMercadoVaca: number,
  valorCompraVaca: number,
  totalQuadrados: number
): number {
  if (custoQuadrado <= 0 || totalQuadrados <= 0) return 0;
  
  const receitaTotal = custoQuadrado * totalQuadrados;
  const custoPremio = valorCompraVaca > 0 ? valorCompraVaca : valorMercadoVaca;
  
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
      cor: "text-primary",
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
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmacaoModalOpen, setConfirmacaoModalOpen] = useState(false);
  const [participacaoCriada, setParticipacaoCriada] = useState<any>(null);
  const [notificationSent, setNotificationSent] = useState(false);
  const [saldo, setSaldo] = useState(0);
  const [pagamentoPendente, setPagamentoPendente] = useState<any>(null);
  const [jogadorForm, setJogadorForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    notificacao: "whatsapp" as "whatsapp" | "email" | "nenhum"
  });
  const [vendedorId, setVendedorId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAldeiaId, setUserAldeiaId] = useState<string | null>(null);
  const [userNome, setUserNome] = useState<string | null>(null);

  const randomOptions = [1, 3, 5, 10, 15, 20, 30];

  const isAdmin = userRole === "super_admin" || userRole === "admin" || userRole === "aldeia_admin";
  const isVendedor = userRole === "vendedor";

  const numerosOcupados = apostas.flatMap(a => a.numeros);
  
  const apostasParaLista = isVendedor 
    ? apostas.filter(a => a.vendedorId === vendedorId)
    : isAdmin 
    ? apostas 
    : userNome 
    ? apostas.filter(a => a.jogadorNome === userNome)
    : [];

  useEffect(() => {
    fetchJogo();
    fetchApostas();
    fetchSaldo();
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.id) setVendedorId(user.id);
        if (user.role) setUserRole(user.role);
        if (user.aldeiaId) setUserAldeiaId(user.aldeiaId);
        if (user.nome) {
          setUserNome(user.nome);
          setJogadorForm(prev => ({
            ...prev,
            nome: user.nome || "",
            telefone: user.telefone || "",
            email: user.email || ""
          }));
        }
      } catch (e) {}
    }
  }, []);

  const fetchSaldo = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.saldo !== undefined) {
        setSaldo(data.saldo);
      }
    } catch (e) {
      console.error("Erro ao buscar saldo:", e);
    }
  };

  const fetchJogo = async () => {
    try {
      const jogoId = new URL(window.location.href).searchParams.get('id');

      let url = "/api/jogos?ativos=true&tipo=poio_da_vaca";
      if (jogoId) {
        url = `/api/jogos/${jogoId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      let jogoData;
      if (jogoId) {
        jogoData = data.data || data;
      } else if (data.data && data.data.length > 0) {
        jogoData = data.data[0];
      }

      if (jogoData) {
        setJogo(jogoData);
      }
    } catch (error) {
      console.error("Erro ao carregar jogo:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApostas = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      let userParam = "";
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userParam = "&user=" + btoa(JSON.stringify(userData));
      }

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`/api/apostas?tipo=poio_da_vaca${userParam}`, {
        headers
      });
      const data = await response.json();
      if (data.data) {
        const apostasConvertidas = data.data.map((a: any) => ({
          ...a,
          numeros: typeof a.numeros === 'string' ? JSON.parse(a.numeros) : a.numeros
        }));
        setApostas(apostasConvertidas);
      }
    } catch (error) {
      console.error("Erro ao carregar apostas:", error);
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
    const y = row + 1;
    return { 
      id: i + 1, 
      x, 
      y,
      label: `${x}-${y}`,
      display: `X${x}Y${y}`
    };
  });

  const handleSquareClick = (id: number) => {
    if (numerosOcupados.includes(id)) {
      toast.error("Este quadrado já foi escolhido por outro jogador!");
      return;
    }
    setSelectedSquares(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      return [...prev, id];
    });
  };

  const handleRandomPlay = (count: number) => {
    const available = cells.filter(c => !selectedSquares.includes(c.id) && !numerosOcupados.includes(c.id));
    if (available.length < count) {
      toast.error(`Apenas ${available.length} quadrado${available.length !== 1 ? 's' : ''} disponível${available.length !== 1 ? 's' : ''}!`);
      return;
    }
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
    
    const numerosIndisponiveis = selectedSquares.filter(n => numerosOcupados.includes(n));
    if (numerosIndisponiveis.length > 0) {
      toast.error("Alguns quadrados selecionados já foram escolhidos por outro jogador!");
      return;
    }
    
    setBetModalOpen(true);
  };

  const handleSubmitBet = async () => {
    if (!jogadorForm.nome.trim()) {
      toast.error("Por favor, insira o nome do jogador!");
      return;
    }
    
    if (!vendedorId && !jogadorForm.telefone.trim() && !jogadorForm.email.trim()) {
      toast.error("Por favor, insira um telemóvel ou email do jogador!");
      return;
    }
    
    if (!jogo) {
      toast.error("Erro: Jogo não encontrado!");
      return;
    }

    const custoTotal = selectedSquares.length * custoPorQuadrado;
    
    setPagamentoPendente({
      jogoId: jogo.id,
      numeros: selectedSquares,
      jogador: {
        nome: jogadorForm.nome,
        telefone: jogadorForm.telefone || undefined,
        email: jogadorForm.email || undefined
      },
      vendedorId: vendedorId || undefined,
      custoTotal,
    });

    setBetModalOpen(false);
    setPaymentModalOpen(true);
  };

   const processarPagamento = async (metodo: "dinheiro" | "mbway" | "stripe" | "saldo" | "transferencia") => {
     if (!pagamentoPendente) return;

     // Check if user is allowed to use dinheiro method
     const user = JSON.parse(localStorage.getItem("user") || "{}");
     const userRole = user.role;
     
     // Only vendedor, aldeia_admin, and super_admin can use dinheiro
     const canUseDinheiro = ['vendedor', 'aldeia_admin', 'super_admin'].includes(userRole);
     
    if (metodo === "dinheiro" && !canUseDinheiro) {
      toast.error("Apenas vendedores e administradores podem pagar em dinheiro");
      return;
    }

    try {
        if (metodo === "dinheiro") {
          await criarAposta(true, "dinheiro");
        } else if (metodo === "saldo") {
          const token = localStorage.getItem("token");
          if (!token) {
            toast.error("Precisa de sessão para usar saldo");
            return;
          }
          // criarAposta will handle the saldo payment via the apostas API
          await criarAposta(true, "saldo");
        } else if (metodo === "mbway") {
          const token = localStorage.getItem("token");
          if (!token) {
            toast.error("Precisa de sessão para usar MBWay");
            return;
          }
          const tel = jogadorForm.telefone;
          if (!tel) {
            toast.error("Telefone obrigatório para MBWay");
            return;
          }
          const res = await fetch("/api/pagamentos/mbway", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              telefone: tel,
              valor: pagamentoPendente.custoTotal,
              descricao: `Aposta Poio da Vaca - ${pagamentoPendente.numeros.length} números`
            })
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || "Erro ao iniciar pagamento MBWay");
            return;
          }
          toast.success("Pagamento MBWay enviado! Confirme no seu telemóvel.");
          await criarAposta(true, "mbway");
        } else if (metodo === "stripe") {
         toast.info("Stripe em implementação");
       }
     } catch (error) {
       console.error("Erro no pagamento:", error);
       toast.error("Erro ao processar pagamento");
     }
   };

  const criarAposta = async (pago: boolean, metodoPagamento: string = "dinheiro") => {
    if (!pagamentoPendente) return;

    const usarSaldo = metodoPagamento === "saldo";

    try {
      const aposta = {
        ...pagamentoPendente,
        pago,
        usarSaldo
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/apostas", {
        method: "POST",
        headers,
        body: JSON.stringify(aposta)
      });

      if (response.ok) {
        const novaAposta = await response.json();
        setApostas(prev => [...prev, novaAposta.data]);
        setPaymentModalOpen(false);
        
        const labels = pagamentoPendente.numeros.map((id: number) => cells[id - 1]?.display || `N${id}`).join(", ");
        
        if (jogadorForm.notificacao === "whatsapp" && jogadorForm.telefone) {
          const telLimpo = jogadorForm.telefone.replace(/\D/g, "");
          const msg = encodeURIComponent(`🎉 Aposta registada!\n\nJogo: Poio da Vaca\nNúmeros: ${labels}\nPagamento: ${pago ? "Confirmado" : "Pendente"}\nObrigado por participar!`);
          const whatsappUrl = `https://wa.me/351${telLimpo}?text=${msg}`;
          window.open(whatsappUrl, "_blank");
        } else if (jogadorForm.notificacao === "email" && jogadorForm.email) {
          const subject = encodeURIComponent("Aposta Registada - Poio da Vaca");
          const body = encodeURIComponent(`🎉 Aposta registada!\n\nJogo: Poio da Vaca\nNúmeros: ${labels}\nPagamento: ${pago ? "Confirmado" : "Pendente"}\n\nObrigado por participar!\n\nAldeias Games`);
          window.open(`mailto:${jogadorForm.email}?subject=${subject}&body=${body}`);
        }
        
        toast.success(`Aposta registada${pago ? " e paga" : ""} para ${jogadorForm.nome}!`);
        setSelectedSquares([]);
        setJogadorForm({ nome: "", telefone: "", email: "", notificacao: "whatsapp" });
        setPagamentoPendente(null);
        fetchSaldo();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao registar aposta.");
      }
    } catch (error) {
      console.error("Erro ao submeter aposta:", error);
      toast.error("Erro ao registar aposta.");
    }
  };

  const custoPorQuadrado = jogo?.custoQuadrado || jogo?.preco || 5;
  const valorMercado = jogo?.valorMercadoVaca || jogo?.valorPremioVaca || jogo?.custoPremioDinheiro || 1000;
  const valorCompra = jogo?.valorCompraVaca || 800;
  
  const rentabilidade = calcularRentabilidade(custoPorQuadrado, valorMercado, valorCompra, totalCells);
  const statusRentabilidade = getRentabilidadeStatus(rentabilidade);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">A carregar...</div>
      </div>
    );
  }

   return (
     <LayoutHeader>
       <div className="min-h-screen bg-background text-foreground font-body">
         {/* TopAppBar local (apenas botão voltar e título) */}
         <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center justify-between px-4 py-3">
           <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
               <ArrowLeft className="w-5 h-5 text-primary" />
             </button>
             <Grid2X2 className="text-primary" />
             <h1 className="font-serif text-xl tracking-wide text-accent font-bold italic">Poio da Vaca</h1>
           </div>
         </header>

         <main className="px-4 pt-6 space-y-6">
        {/* Hero Section & Prize */}
        <section className="relative space-y-4 px-2">
          <div className="relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-10 -mt-10" />
            <div className="relative glass-card rounded-3xl p-6 overflow-hidden">
              <p className="text-xs font-semibold tracking-widest text-secondary uppercase mb-2">Grande Evento</p>
              <h2 className="font-serif text-3xl leading-tight text-foreground max-w-[80%]">Onde a Sorte Encontra a Tradição</h2>
              
              <div className="flex flex-col gap-2 mt-4">
                {isAdmin ? (
                  <span className="text-primary font-bold text-sm">GRANDE PRÉMIO</span>
                ) : (
                  <span className="text-primary font-bold text-sm">VALOR EM JOGO</span>
                )}
                <p className="font-serif text-xl text-accent">
                  {valorMercado > 500 ? "Vaca de Raça" : `${valorMercado}€ em Cartão`}
                </p>
                <div className="mt-3 flex items-center gap-2 text-muted-foreground text-sm bg-surface-container-low/50 self-start px-3 py-1 rounded-full">
                  <Star className="w-3 h-3 text-primary" style={{ fontVariationSettings: "'FILL' 1" }} />
                  <span>Sorteio Local Certificado</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rentabilidade Info - Only for Admins */}
        {isAdmin && (
          <section className="px-2">
            <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <h3 className="font-serif text-lg text-accent">Análise de Rentabilidade</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase">Receita Total</p>
                  <p className="font-serif text-xl text-primary">{custoPorQuadrado * totalCells}€</p>
                </div>
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase">Custo Real (Contabilidade)</p>
                  <p className="font-serif text-xl text-red-400">{valorCompra}€</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="flex justify-between bg-surface-container-low p-2 rounded-lg">
                  <span className="text-on-surface-variant">Valor Mercado (Jogadores):</span>
                  <span className="font-bold">{valorMercado}€</span>
                </div>
                <div className="flex justify-between bg-surface-container-low p-2 rounded-lg">
                  <span className="text-on-surface-variant">Valor Compra (Contabilidade):</span>
                  <span className="font-bold">{valorCompra}€</span>
                </div>
              </div>
              
              <div className={`p-3 rounded-xl ${rentabilidade >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
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
        )}

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
          <div className="bg-surface-container-low rounded-2xl p-2 sm:p-3">
            {/* Axis Labels */}
            <div className="flex justify-between px-2 sm:px-8 mb-1">
              <span className="text-[8px] sm:text-[10px] text-on-surface-variant">X →</span>
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
                  const isOccupied = numerosOcupados.includes(cell.id);
                  
                  return (
                    <button
                      key={cell.id}
                      onClick={() => handleSquareClick(cell.id)}
                      disabled={isOccupied}
                      className={`
                        relative flex items-center justify-center text-[10px] sm:text-xs font-medium transition-all duration-150 rounded-sm
                        ${isSelected 
                          ? "bg-primary-container text-on-primary-container font-bold shadow-md z-10" 
                          : isOccupied
                          ? "bg-red-900/30 text-red-400/50 cursor-not-allowed border border-red-900/30"
                          : "bg-surface-container-highest/60 text-on-surface-variant/50 hover:bg-surface-container-high hover:text-on-surface-variant"
                        }
                      `}
                      title={isOccupied ? `${cell.display} - Já escolhido` : cell.display}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : isOccupied ? (
                        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
              <span className="text-[8px] sm:text-[10px] text-on-surface-variant">↑ Y</span>
              <span className="text-[8px] sm:text-[10px] text-on-surface-variant">X →</span>
            </div>
            
            {/* Legend */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-primary-container"></div>
                <span className="text-on-surface-variant">Selecionado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-900/30 border border-red-900/30"></div>
                <span className="text-on-surface-variant">Ocupado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-surface-container-highest/60"></div>
                <span className="text-on-surface-variant">Disponível</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-on-surface-variant">Total: {totalCells}</span>
              </div>
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

        {/* Apostas Registadas - conforme permissões */}
        {apostasParaLista.length > 0 && (isAdmin || isVendedor || userNome) && (
          <section className="px-2">
            <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-lg text-accent">
                  {isAdmin ? "Todas as Apostas" : isVendedor ? "As Minhas Vendas" : "As Minhas Apostas"}
                </h3>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-auto">
                  {apostasParaLista.length}
                </span>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {apostasParaLista.map((aposta) => {
                  const numerosArray = Array.isArray(aposta.numeros) ? aposta.numeros : [];
                  const numerosFormatados = numerosArray.map((n: number) => cells[n - 1]?.display || `N${n}`).join(", ");
                  const mostraDetalhes = isAdmin || (isVendedor && aposta.vendedorId === vendedorId);
                  const isMinhaAposta = userNome && aposta.jogadorNome === userNome;
                  
                  return (
                    <div 
                      key={aposta.id} 
                      className={`p-3 rounded-xl ${isMinhaAposta ? 'bg-secondary/10 border border-secondary/20' : 'bg-surface-container-low'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-accent text-sm">{numerosFormatados}</p>
                          {mostraDetalhes && (
                            <>
                              <p className="text-xs text-muted-foreground mt-1">
                                👤 {aposta.jogadorNome || "Anónimo"}
                              </p>
                              {aposta.jogadorTelefone && (
                                <p className="text-xs text-muted-foreground/60">
                                  📞 {aposta.jogadorTelefone}
                                </p>
                              )}
                              {aposta.jogadorEmail && (
                                <p className="text-xs text-muted-foreground/60">
                                  ✉️ {aposta.jogadorEmail}
                                </p>
                              )}
                            </>
                          )}
                          {isMinhaAposta && !mostraDetalhes && (
                            <p className="text-xs text-secondary mt-1">✓ A tua aposta</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground/60">
                            {aposta.createdAt ? new Date(aposta.createdAt).toLocaleDateString("pt-PT") : '-'}
                          </p>
                          <p className="text-xs text-muted-foreground/60">
                            {aposta.createdAt ? new Date(aposta.createdAt).toLocaleTimeString("pt-PT", { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                          {mostraDetalhes && aposta.vendedorId && (
                            <p className="text-[10px] text-muted-foreground/40 mt-1">
                              Vendedor: {String(aposta.vendedorId).slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

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

      {/* Modal de Registo de Aposta */}
      <Dialog open={betModalOpen} onOpenChange={setBetModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Identificar Jogador
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <p className="text-xs text-on-surface-variant">
              Registar aposta para: <strong>{selectedSquares.map(id => cells[id - 1].display).join(", ")}</strong>
            </p>
            
            <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome do Jogador *</label>
                <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                  <User className="w-5 h-5 text-primary" />
                  <input
                    type="text"
                    value={jogadorForm.nome}
                    onChange={(e) => setJogadorForm({ ...jogadorForm, nome: e.target.value })}
                    className="flex-1 bg-transparent outline-none text-foreground"
                    placeholder="Nome completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Telemóvel</label>
                <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <input
                    type="tel"
                    value={jogadorForm.telefone}
                    onChange={(e) => setJogadorForm({ ...jogadorForm, telefone: e.target.value })}
                    className="flex-1 bg-transparent outline-none text-foreground"
                    placeholder="912 345 678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Ou Email</label>
                <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <input
                    type="email"
                    value={jogadorForm.email}
                    onChange={(e) => setJogadorForm({ ...jogadorForm, email: e.target.value })}
                    className="flex-1 bg-transparent outline-none text-foreground"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Receber Notificação</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setJogadorForm({ ...jogadorForm, notificacao: "whatsapp" })}
                    className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                      jogadorForm.notificacao === "whatsapp" 
                        ? "bg-[#25D366] text-foreground" 
                        : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setJogadorForm({ ...jogadorForm, notificacao: "email" })}
                    className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                      jogadorForm.notificacao === "email" 
                        ? "bg-primary text-foreground" 
                        : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-medium">Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setJogadorForm({ ...jogadorForm, notificacao: "nenhum" })}
                    className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                      jogadorForm.notificacao === "nenhum" 
                        ? "bg-[#666] text-foreground" 
                        : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-xs font-medium">Nenhum</span>
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  Por predefinição, receberá notificação por WhatsApp
                </p>
              </div>
            </div>

            <div className="bg-surface-container-high rounded-xl p-4">
              <p className="text-xs text-on-surface-variant mb-1">Total a pagar</p>
              <p className="font-headline text-2xl text-primary">{selectedSquares.length * custoPorQuadrado}€</p>
            </div>

            <button 
              onClick={handleSubmitBet}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              Confirmar Aposta
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <Euro className="w-5 h-5 text-primary" />
              Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant">Total a pagar</p>
              <p className="font-headline text-3xl text-primary">{pagamentoPendente?.custoTotal || 0}€</p>
            </div>

            <div className="space-y-4">
              <PaymentSelector
                amount={pagamentoPendente?.custoTotal || 0}
                onSelect={processarPagamento}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </LayoutHeader>
  );
}
