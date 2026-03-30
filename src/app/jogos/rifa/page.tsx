"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  Verified,
  Ticket,
  Check,
  Phone,
  Mail,
  User,
  CreditCard,
  QrCode,
  Copy,
  Share2,
  MessageCircle,
  Wallet,
  Shuffle,
  TrendingUp,
  TrendingDown,
  Euro,
  LayoutGrid
} from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserMenuButton } from "@/components/user-menu-button";
import { toast } from "sonner";
import { PaymentSelector } from "@/components/payment";

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockInicial: number;
  stockAtual: number;
  totalAngariado: number;
  totalParticipacoes: number;
  evento?: {
    nome: string;
    aldeia?: {
      nome: string;
    };
  };
  premio?: {
    id: string;
    nome: string;
    descricao?: string;
    imagemUrl?: string;
  };
  premios?: Array<{
    id: string;
    nome: string;
    descricao?: string;
    valorDinheiroAlternative?: number;
  }>;
  configuracao?: string;
}

export default function RifaPage() {
  const router = useRouter();
  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [config, setConfig] = useState<{
    numeroInicial: number;
    numeroFinal: number;
    dataSorteio?: string;
    horaSorteio?: string;
    localSorteio?: string;
    numeroBlocos: number;
    permitirStripe: boolean;
    valorPremios: number | null;
  }>({ numeroInicial: 1, numeroFinal: 1000, numeroBlocos: 1, permitirStripe: false, valorPremios: null });
  const [loading, setLoading] = useState(true);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [numerosDisponiveis, setNumerosDisponiveis] = useState<number[]>([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(1);
  const [participante, setParticipante] = useState({
    nome: "",
    telefone: "",
    email: "",
    notificacao: "whatsapp" as "whatsapp" | "email" | "nenhum"
  });
  const [participacaoConfirmada, setParticipacaoConfirmada] = useState(false);
  const [numeroSorte, setNumeroSorte] = useState<string>("");
  const [saldo, setSaldo] = useState(0);
  const [paymentModalOpen, setCreditCardModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [numerosOcupados, setNumerosOcupados] = useState<number[]>([]);

  const randomOptions = [1, 2, 3, 5, 10, 20];
  const isAdmin = userRole === "super_admin" || userRole === "admin" || userRole === "aldeia_admin";

  useEffect(() => {
    fetchJogo();
    fetchSaldo();
    fetchNumerosOcupados();
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setUserRole(userData.role);
      setParticipante({
        nome: userData.nome || "",
        telefone: userData.telefone || "",
        email: userData.email || "",
        notificacao: "whatsapp"
      });
    }
  }, []);

  const fetchNumerosOcupados = async () => {
    try {
      const response = await fetch(`/api/participacoes?jogoId=${jogo?.id}`);
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const numeros = data.data
          .flatMap((p: any) => {
            if (p.dadosParticipacao) {
              try {
                return JSON.parse(p.dadosParticipacao);
              } catch {
                return [];
              }
            }
            return [];
          })
          .filter((n: any): n is number => typeof n === "number");
        setNumerosOcupados(numeros);
      }
    } catch (error) {
      console.error("Erro ao buscar números ocupados:", error);
    }
  };

  useEffect(() => {
    if (jogo && config.numeroInicial && config.numeroFinal && config.numeroBlocos) {
      const numerosPorBloco = Math.ceil((config.numeroFinal - config.numeroInicial + 1) / config.numeroBlocos);
      const numeros: number[] = [];
      const inicioBloco = config.numeroInicial + (blocoSelecionado - 1) * numerosPorBloco;
      const fimBloco = Math.min(inicioBloco + numerosPorBloco - 1, config.numeroFinal);
      for (let i = inicioBloco; i <= fimBloco; i++) {
        numeros.push(i);
      }
      setNumerosDisponiveis(numeros);
    }
  }, [blocoSelecionado, jogo, config]);

  const fetchJogo = async () => {
    try {
      const response = await fetch("/api/jogos?ativos=true&tipo=rifa");
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const jogoData = data.data[0];
        setJogo(jogoData);
        
        fetchNumerosOcupados();
        
        const configData = jogoData.configuracao ? JSON.parse(jogoData.configuracao) : { numeroInicial: 1, numeroFinal: 1000, numeroBlocos: 1, permitirStripe: false, valorPremios: null };
        const numeroBlocos = configData.numeroBlocos || 1;
        setConfig({
          numeroInicial: configData.numeroInicial || 1,
          numeroFinal: configData.numeroFinal || 1000,
          dataSorteio: configData.dataSorteio,
          horaSorteio: configData.horaSorteio,
          localSorteio: configData.localSorteio,
          numeroBlocos: numeroBlocos,
          permitirStripe: configData.permitirStripe || false,
          valorPremios: configData.valorPremios || null
        });
        
        const numerosPorBloco = Math.ceil((configData.numeroFinal - configData.numeroInicial + 1) / numeroBlocos);
        const numeros = [];
        const inicioBloco = configData.numeroInicial;
        const fimBloco = Math.min(inicioBloco + numerosPorBloco - 1, configData.numeroFinal);
        for (let i = inicioBloco; i <= fimBloco; i++) {
          numeros.push(i);
        }
        setNumerosDisponiveis(numeros);
      }
    } catch (error) {
      console.error("Erro ao carregar jogo:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleNumero = (num: number) => {
    if (numerosSelecionados.includes(num)) {
      setNumerosSelecionados(numerosSelecionados.filter(n => n !== num));
    } else {
      if (numerosSelecionados.length < 5) {
        setNumerosSelecionados([...numerosSelecionados, num]);
      } else {
        toast.warning("Máximo de 5 números por participação");
      }
    }
  };

  const selectRandomNumbers = (count: number) => {
    const available = numerosDisponiveis.filter(n => !numerosSelecionados.includes(n) && !numerosOcupados.includes(n));
    if (available.length === 0) {
      toast.warning("Não há números disponíveis neste bloco");
      return;
    }
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, 5 - numerosSelecionados.length));
    if (selected.length < count) {
      toast.warning(`Apenas ${selected.length} número(s) disponível(is)`);
    }
    setNumerosSelecionados([...numerosSelecionados, ...selected]);
  };

  const handleParticipar = async () => {
    if (!participante.nome.trim()) {
      toast.error("Por favor, insira o seu nome!");
      return;
    }
    if (numerosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um número!");
      return;
    }

    setCreditCardModalOpen(true);
  };

  const processarPagamento = async (metodo: "dinheiro" | "saldo" | "stripe") => {
    if (!jogo) return;

    const custoTotal = numerosSelecionados.length * (jogo.preco || 5);

    try {
      if (metodo === "dinheiro") {
        await criarParticipacao("dinheiro");
      } else if (metodo === "saldo") {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Precisa de login para usar saldo");
          return;
        }
        await criarParticipacao("saldo");
      } else if (metodo === "stripe") {
        toast.info("Stripe em implementação");
      }
    } catch (error) {
      console.error("Erro no pagamento:", error);
      toast.error("Erro ao processar pagamento");
    }
  };

  const criarParticipacao = async (metodo: "dinheiro" | "saldo") => {
    if (!jogo) return;

    const token = localStorage.getItem("token");

    const payload: Record<string, unknown> = {
      jogoId: jogo.id,
      dadosParticipacao: {
        numeros: numerosSelecionados
      },
      quantidade: numerosSelecionados.length,
      metodoPagamento: metodo
    };

    if (participante.nome && (participante.telefone || participante.email)) {
      payload.dadosCliente = {
        nome: participante.nome,
        telefone: participante.telefone || undefined,
        email: participante.email || undefined
      };
    }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/participacoes", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setNumeroSorte(data.data?.numero || numerosSelecionados[0].toString().padStart(5, "0"));
        setParticipacaoConfirmada(true);
        setCreditCardModalOpen(false);
        
        if (participante.notificacao === "whatsapp" && participante.telefone) {
          const telLimpo = participante.telefone.replace(/\D/g, "");
          const msg = encodeURIComponent(`🎉 Participação Confirmada!\n\nRifa: ${jogo.nome}\nNúmeros: ${numerosSelecionados.join(", ")}\n${config.dataSorteio ? `Sorteio: ${config.dataSorteio}${config.horaSorteio ? ` às ${config.horaSorteio}` : ''}` : ''}\n${config.localSorteio ? `Local: ${config.localSorteio}` : ''}\n\nObrigado por apoiar!`);
          const whatsappUrl = `https://wa.me/351${telLimpo}?text=${msg}`;
          window.open(whatsappUrl, "_blank");
        } else if (participante.notificacao === "email" && participante.email) {
          const subject = encodeURIComponent(`Confirmação de Participação - ${jogo.nome}`);
          const body = encodeURIComponent(`🎉 Participação Confirmada!\n\nRifa: ${jogo.nome}\nNúmeros: ${numerosSelecionados.join(", ")}\n${config.dataSorteio ? `Sorteio: ${config.dataSorteio}${config.horaSorteio ? ` às ${config.horaSorteio}` : ''}` : ''}\n${config.localSorteio ? `Local: ${config.localSorteio}` : ''}\n\nObrigado por apoiar!`);
          window.open(`mailto:${participante.email}?subject=${subject}&body=${body}`);
        }
        
        toast.success("Participação confirmada!");
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.error || "Erro ao participar");
      }
    } catch (error) {
      console.error("Erro ao participar:", error);
      toast.error("Erro ao participar");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#110d0c] text-[#eae0de] flex items-center justify-center">
        <div className="text-[#ff734b]">A carregar...</div>
      </div>
    );
  }

  if (participacaoConfirmada) {
    const numeroDisplay = numeroSorte || numerosSelecionados[0].toString().padStart(5, "0");
    const numerosVendidos = (jogo?.stockInicial || 0) - (jogo?.stockAtual || 0);
    const precoPorNumero = jogo?.preco || 5;
    const totalGasto = numerosSelecionados.length * precoPorNumero;
    
    return (
      <div className="min-h-screen bg-[#110d0c] text-[#eae0de]">
        <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-[#2e2928] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#ff734b]" />
            </button>
            <h1 className="font-serif text-xl tracking-wide text-[#ffb5a0] font-bold italic">Confirmação</h1>
          </div>
        </header>

        <main className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="font-serif text-2xl text-[#ffb5a0] font-bold">Participação Confirmada!</h2>
            <p className="text-[#e0bfb7] mt-2">Obrigado pela sua participação</p>
          </div>

          <div className="bg-surface-container rounded-3xl overflow-hidden mb-6">
            <div className="p-6 md:p-8 space-y-6">
              <div className="text-center border-b border-[#58413b]/15 pb-6">
                <p className="text-sm text-secondary font-semibold tracking-widest uppercase mb-2">Seus Números</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {numerosSelecionados.map((num) => (
                    <span key={num} className="bg-[#ff734b] text-[#110d0c] px-4 py-2 rounded-xl text-xl font-bold">
                      {num.toString().padStart(3, "0")}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-high rounded-xl p-4 text-center">
                  <p className="text-[10px] text-on-surface/50 uppercase">Total Gasto</p>
                  <p className="text-xl font-bold text-green-400">{totalGasto.toFixed(2)}€</p>
                </div>
                <div className="bg-surface-container-high rounded-xl p-4 text-center">
                  <p className="text-[10px] text-on-surface/50 uppercase">Números Jogados</p>
                  <p className="text-xl font-bold text-[#ff734b]">{numerosSelecionados.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-container-high rounded-xl p-3 text-center">
                  <p className="text-[10px] text-on-surface/50 uppercase">Total Números</p>
                  <p className="text-lg font-bold">{jogo?.stockInicial || 0}</p>
                </div>
                <div className="bg-surface-container-high rounded-xl p-3 text-center">
                  <p className="text-[10px] text-on-surface/50 uppercase">Vendidos</p>
                  <p className="text-lg font-bold text-yellow-400">{numerosVendidos}</p>
                </div>
                <div className="bg-surface-container-high rounded-xl p-3 text-center">
                  <p className="text-[10px] text-on-surface/50 uppercase">Disponíveis</p>
                  <p className="text-lg font-bold text-green-400">{jogo?.stockAtual || 0}</p>
                </div>
              </div>

              <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface/60">Angariado até agora:</span>
                  <span className="text-lg font-bold text-green-400">{jogo?.totalAngariado?.toFixed(2) || 0}€</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface/60">Participações:</span>
                  <span className="text-lg font-bold text-[#ff734b]">{jogo?.totalParticipacoes || 0}</span>
                </div>
              </div>

              <div className="space-y-3 text-center border-t border-[#58413b]/15 pt-6">
                <p className="text-on-surface/60 text-sm flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Sorteio: {config.dataSorteio ? `${config.dataSorteio}${config.horaSorteio ? ` às ${config.horaSorteio}` : ''}` : 'A definir'}
                </p>
                <p className="text-on-surface/60 text-sm flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {config.localSorteio || 'A definir'}
                </p>
              </div>

              <div className="bg-surface-container-highest/50 rounded-2xl p-4">
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 bg-white rounded-xl p-2">
                    <div className="w-full h-full bg-[#111] rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-white" />
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-on-surface/40">
                  Guarde este código para apresentação no dia do sorteio
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => {
              setParticipacaoConfirmada(false);
              setNumerosSelecionados([]);
            }}
            className="w-full py-6 bg-[#ff734b] text-[#110d0c] font-bold rounded-xl"
          >
            Participar Novamente
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de]">
      <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#2e2928] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#ff734b]" />
          </button>
          <h1 className="font-serif text-xl tracking-wide text-[#ffb5a0] font-bold italic">Rifa</h1>
        </div>
        <UserMenuButton />
      </header>

      <main className="px-4 pt-6 pb-24 max-w-2xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container to-[#3d1f1a] p-1">
          <div className="bg-surface-container-highest/90 backdrop-blur-md rounded-[1.9rem] p-6 md:p-8">
            <div className="mb-4 inline-block bg-secondary-container/10 border border-secondary-container/20 px-3 py-1 rounded-full">
              <span className="text-secondary text-xs font-bold tracking-widest uppercase">
                {jogo?.evento?.aldeia?.nome || "ASSOCIAÇÃO CULTURAL"}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-2">
              {jogo?.nome || "RIFA DE ANGARIAÇÃO DE FUNDOS"}
            </h2>
            <p className="text-primary text-lg font-medium">PARTICIPE E AJUDE A NOSSA CAUSA</p>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-1">Grande Prémio</p>
              <h3 className="text-2xl font-headline font-bold text-on-surface">
                {jogo?.premio?.nome || "Vale de 500€ + Cabaz de Produtos Locais"}
              </h3>
            </div>
            <div className="bg-primary-container text-on-primary-container px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg">
              <CreditCard className="w-5 h-5 font-bold" />
              <span className="text-2xl font-extrabold">{jogo?.preco || 5}€</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-high rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface/50 uppercase">Data</p>
                <p className="font-bold">{config.dataSorteio || '--/--/----'}</p>
              </div>
            </div>
            <div className="bg-surface-container-high rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface/50 uppercase">Hora</p>
                <p className="font-bold">{config.horaSorteio || '--:--'}</p>
              </div>
            </div>
            <div className="bg-surface-container-high rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface/50 uppercase">Local</p>
                <p className="font-bold">{config.localSorteio || 'A definir'}</p>
              </div>
            </div>
          </div>
        </div>

        {isAdmin && config.valorPremios && config.valorPremios > 0 && (
          <div className="bg-surface-container rounded-2xl p-6 border border-[#ff734b]/20">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#ff734b]" />
              <h3 className="text-lg font-headline font-bold text-[#ffb5a0]">Análise de Rentabilidade</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container-high rounded-xl p-4">
                <p className="text-[10px] text-on-surface/50 uppercase mb-1">Total Números</p>
                <p className="text-xl font-bold">{jogo?.stockInicial || 0}</p>
              </div>
              <div className="bg-surface-container-high rounded-xl p-4">
                <p className="text-[10px] text-on-surface/50 uppercase mb-1">Números Vendidos</p>
                <p className="text-xl font-bold">{(jogo?.stockInicial || 0) - (jogo?.stockAtual || 0)}</p>
              </div>
              <div className="bg-surface-container-high rounded-xl p-4">
                <p className="text-[10px] text-on-surface/50 uppercase mb-1">Valor Prémios</p>
                <p className="text-xl font-bold text-red-400">{config.valorPremios?.toFixed(2) || 0}€</p>
              </div>
              <div className="bg-surface-container-high rounded-xl p-4">
                <p className="text-[10px] text-on-surface/50 uppercase mb-1">Total Angariado</p>
                <p className="text-xl font-bold text-green-400">{jogo?.totalAngariado?.toFixed(2) || 0}€</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-surface-container-high rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#e0bfb7]">Lucro Projetado:</span>
                <span className={`text-lg font-bold ${(jogo?.totalAngariado || 0) - (config.valorPremios || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {((jogo?.totalAngariado || 0) - (config.valorPremios || 0)).toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-surface-container rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-[#58413b]/15 pb-4">
            <User className="w-5 h-5 text-secondary" />
            <h4 className="text-xl font-headline font-bold">Escolha os seus números</h4>
          </div>

          {config.numeroBlocos > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <LayoutGrid className="w-4 h-4 text-[#ff734b] flex-shrink-0" />
              {Array.from({ length: config.numeroBlocos }, (_, i) => i + 1).map((bloco) => (
                <button
                  key={bloco}
                  onClick={() => {
                    setBlocoSelecionado(bloco);
                    setNumerosSelecionados([]);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    blocoSelecionado === bloco
                      ? "bg-[#ff734b] text-[#110d0c]"
                      : "bg-surface-container-high text-[#e0bfb7] hover:bg-surface-container-highest"
                  }`}
                >
                  Bloco {bloco}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[#e0bfb7]">Selecionados: {numerosSelecionados.length}/5</p>
              <div className="flex gap-1">
                {randomOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() => selectRandomNumbers(count)}
                    disabled={numerosSelecionados.length >= 5}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-[#ff734b]/20 text-[#ff734b] hover:bg-[#ff734b]/30 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    <Shuffle className="w-3 h-3" />
                    {count}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-2 bg-surface-container-high rounded-xl">
              {numerosDisponiveis.map((num) => {
                const isSelected = numerosSelecionados.includes(num);
                const isOcupado = numerosOcupados.includes(num);
                
                return (
                  <button
                    key={num}
                    onClick={() => toggleNumero(num)}
                    disabled={isOcupado}
                    className={`
                      py-2 px-1 rounded-lg text-xs font-bold transition-all
                      ${isSelected 
                        ? "bg-secondary text-[#110d0c]" 
                        : isOcupado 
                        ? "bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-700/30"
                        : "bg-surface-container-highest text-on-surface hover:bg-[#58413b]/30"
                      }
                    `}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#e0bfb7]/60 mt-2 flex justify-between">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-surface-container-highest border border-gray-600/30"></span> Disponível
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-gray-800/50 border border-gray-700/30"></span> Ocupado
              </span>
            </p>
          </div>

          {numerosSelecionados.length > 0 && (
            <div className="bg-secondary-container/10 border border-secondary-container/20 rounded-xl p-4">
              <p className="text-xs text-secondary mb-2">Números selecionados:</p>
              <div className="flex flex-wrap gap-2">
                {numerosSelecionados.map((num) => (
                  <span key={num} className="bg-secondary text-[#110d0c] px-3 py-1 rounded-full text-sm font-bold">
                    {num.toString().padStart(3, "0")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-[#e0bfb7] uppercase tracking-wider">Nome Completo</label>
              <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
                <User className="w-5 h-5 text-[#ff734b]" />
                <input
                  type="text"
                  value={participante.nome}
                  onChange={(e) => setParticipante({ ...participante, nome: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-[#eae0de]"
                  placeholder="O seu nome"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[#e0bfb7] uppercase tracking-wider">Telemóvel</label>
              <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
                <Phone className="w-5 h-5 text-[#ff734b]" />
                <input
                  type="tel"
                  value={participante.telefone}
                  onChange={(e) => setParticipante({ ...participante, telefone: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-[#eae0de]"
                  placeholder="+351 000 000 000"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#e0bfb7] uppercase tracking-wider">Receber Notificação</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setParticipante({ ...participante, notificacao: "whatsapp" })}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  participante.notificacao === "whatsapp" 
                    ? "bg-[#25D366] text-white" 
                    : "bg-surface-container-high text-[#e0bfb7] hover:bg-surface-container-highest"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium">WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => setParticipante({ ...participante, notificacao: "email" })}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  participante.notificacao === "email" 
                    ? "bg-[#ff734b] text-white" 
                    : "bg-surface-container-high text-[#e0bfb7] hover:bg-surface-container-highest"
                }`}
              >
                <Mail className="w-4 h-4" />
                <span className="text-xs font-medium">Email</span>
              </button>
              <button
                type="button"
                onClick={() => setParticipante({ ...participante, notificacao: "nenhum" })}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  participante.notificacao === "nenhum" 
                    ? "bg-[#666] text-white" 
                    : "bg-surface-container-high text-[#e0bfb7] hover:bg-surface-container-highest"
                }`}
              >
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">Nenhum</span>
              </button>
            </div>
            <p className="text-[10px] text-[#e0bfb7]/60">
              Por predefinição, receberá notificação por WhatsApp
            </p>
          </div>

          <Button 
            onClick={handleParticipar}
            disabled={numerosSelecionados.length === 0 || !participante.nome}
            className="w-full py-6 bg-[#ff734b] text-[#110d0c] font-bold rounded-full text-lg transition-all hover:shadow-[0_0_20px_rgba(255,115,75,0.4)]"
          >
            <Ticket className="w-5 h-5 mr-2" />
            Confirmar Participação
          </Button>
        </div>

        <p className="text-center text-on-surface/40 text-xs">
          Apoie a cultura local. Todos os lucros revertem para a associação.
        </p>
      </main>

      <BottomNav />

      <Dialog open={paymentModalOpen} onOpenChange={setCreditCardModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#ff734b]" />
              Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant">Total a pagar</p>
              <p className="font-headline text-3xl text-primary">
                {numerosSelecionados.length * (jogo?.preco || 5)}€
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {numerosSelecionados.length} número(s) × {jogo?.preco || 5}€
              </p>
            </div>

            <div className="space-y-4">
              <PaymentSelector
                amount={numerosSelecionados.length * (jogo?.preco || 5)}
                onSelect={processarPagamento}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
