"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Gift, Trophy, Star, Clock, Award, Wallet, User, Heart, Home } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenuModal } from "@/components/user-menu-modal";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
  saldo?: number;
}

interface Premio {
  id: string;
  nome: string;
  descricao: string;
  data: string;
  tipo: "raspadinha" | "poio_vaca" | "rifa" | "tombola";
  valor?: number;
  premioEntregue?: boolean;
  jogoNome?: string;
}

interface HistoricoItem {
  id: string;
  jogoNome: string;
  tipo: string;
  data: string;
  resultado?: string;
  valor?: number;
}

export default function PremiosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState(0);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [numerosJogados, setNumerosJogados] = useState<{jogo: string; numeros: number[]}[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchPremios();
    fetchSaldo();
  }, []);

  const fetchSaldo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/users/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.saldo !== undefined) {
          setSaldo(data.data.saldo);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar saldo:", error);
    }
  };

  const fetchSaldo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch("/api/users/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.saldo !== undefined) {
          setSaldo(data.data.saldo);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar saldo:", error);
    }
  };

   const fetchPremios = async () => {
     try {
       const token = localStorage.getItem("token");
       if (!token) {
         setLoading(false);
         return;
       }

       // Fetch all participations with pagination
       const allParticipacoes: any[] = [];
       let page = 1;
       let hasMore = true;
       while (hasMore) {
         const res = await fetch(`/api/participacoes?page=${page}&limit=50`, {
           headers: { Authorization: `Bearer ${token}` },
         });
         if (res.ok) {
           const data = await res.json();
           allParticipacoes.push(...(data.data || []));
           hasMore = data.pagination?.hasNext || false;
           page++;
         } else {
           hasMore = false;
         }
       }

       // Process winning prizes
       const premiosList: Premio[] = allParticipacoes
         .filter((p: any) => p.ganhador)
         .map((p: any) => {
           let valor = 0;
           try {
             const dados = typeof p.dadosParticipacao === 'string'
               ? JSON.parse(p.dadosParticipacao)
               : p.dadosParticipacao;
             if (dados?.winningPrize?.valorDinheiroAlternative) {
               valor = dados.winningPrize.valorDinheiroAlternative;
             }
           } catch {}

           return {
             id: p.id,
             nome: p.resultadoRaspe || "Prémio",
             descricao: p.jogo?.nome || "Jogo",
             data: p.createdAt,
             tipo: p.jogo?.tipo || "raspadinha",
             valor,
             premioEntregue: p.premioEntregue || false,
             jogoNome: p.jogo?.nome,
           };
         });

       setPremios(premiosList);

       // Process history (all participations)
       const historicoList: HistoricoItem[] = allParticipacoes
         .map((p: any) => {
           let numeros: number[] = [];
           try {
             const dados = typeof p.dadosParticipacao === 'string'
               ? JSON.parse(p.dadosParticipacao)
               : p.dadosParticipacao;
             numeros = dados?.numeros || [];
           } catch {}
           return {
             id: p.id,
             jogoNome: p.jogo?.nome || "Jogo",
             tipo: p.jogo?.tipo || "jogo",
             data: p.createdAt,
             resultado: p.resultadoRaspe || (numeros.length > 0 ? numeros.join(", ") : "-"),
             valor: p.ganhador ? p.valorPago : 0,
           };
         });
       setHistorico(historicoList);

       // Process numbers played
       const numerosMap: {[key: string]: number[]} = {};
       allParticipacoes.forEach((p: any) => {
         try {
           const dados = typeof p.dadosParticipacao === 'string'
             ? JSON.parse(p.dadosParticipacao)
             : p.dadosParticipacao;
           if (dados?.numeros && dados.numeros.length > 0) {
             const jogoNome = p.jogo?.nome || "Jogo";
             if (!numerosMap[jogoNome]) {
               numerosMap[jogoNome] = [];
             }
             numerosMap[jogoNome].push(...dados.numeros);
           }
         } catch {}
       });
       const numerosList = Object.entries(numerosMap).map(([jogo, numeros]) => ({
         jogo,
         numeros: [...new Set(numeros)].sort((a, b) => a - b)
       }));
       setNumerosJogados(numerosList);

     } catch (error) {
       console.error("Erro ao carregar dados:", error);
     } finally {
       setLoading(false);
     }
   };



  const getTipoIcon = (tipo: Premio["tipo"]) => {
    switch (tipo) {
      case "raspadinha":
        return <Gift className="w-5 h-5" />;
      case "poio_vaca":
        return <Trophy className="w-5 h-5" />;
      case "rifa":
        return <Star className="w-5 h-5" />;
      case "tombola":
        return <Award className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const getTipoLabel = (tipo: Premio["tipo"]) => {
    switch (tipo) {
      case "raspadinha":
        return "Raspadinha";
      case "poio_vaca":
        return "Poio da Vaca";
      case "rifa":
        return "Rifa";
      case "tombola":
        return "Tombola";
      default:
        return "Prémio";
    }
  };

  return (
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body pb-32">
      {/* Header com logo e perfil */}
      <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="flex items-center gap-2">
              <Home className="text-[#ff734b] text-xl" />
              <span className="font-serif italic text-[#ff734b] text-lg font-bold">
                Aldeias Games
              </span>
            </button>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#2e2928] overflow-hidden border border-[#ff734b]/20 relative">
            {user ? (
              <button
                onClick={() => setUserMenuOpen(true)}
                className="w-full h-full bg-[#ff734b]/20 flex items-center justify-center hover:bg-[#ff734b]/30 transition-colors"
              >
                <User className="h-4 w-4 text-[#ff734b]" />
              </button>
            ) : (
              <button onClick={() => router.push("/")} className="w-full h-full flex items-center justify-center text-[#ff734b] font-bold text-lg">
                +
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Separador de navegação */}
      <div className="flex gap-2 px-4 py-3 border-b border-[#58413b]/20">
        <button
          onClick={() => setActiveTab("premios")}
          className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
            activeTab === "premios"
              ? "bg-[#ff734b] text-[#110d0c]"
              : "bg-[#2e2928] text-[#e0bfb7]"
          }`}
        >
          Os Teus Prémios
        </button>
        <button
          onClick={() => router.push("/jogos")}
          className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
            activeTab === "jogos"
              ? "bg-[#ff734b] text-[#110d0c]"
              : "bg-[#2e2928] text-[#e0bfb7]"
          }`}
        >
          Os Teus Jogos
        </button>
      </div>

      {/* Conteúdo principal */}
      <main className="px-4 pt-6 max-w-md mx-auto space-y-6">
        {/* Título e descrição */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-[#ff734b] mb-2">Os Teus Prémios</h1>
          <p className="text-[#e0bfb7] text-sm">Participa nos jogos da tua aldeia</p>
        </div>

        {/* Saldo Card - Always visible for logged users */}
        {user && (
          <div className="bg-gradient-to-br from-[#ff734b]/20 to-[#ff734b]/5 rounded-2xl p-4 border border-[#ff734b]/20">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-[#ff734b]" />
              <div>
                <p className="text-xs text-[#e0bfb7] uppercase tracking-wider">Saldo Disponível</p>
                <p className="text-2xl font-black text-[#ff734b]">{saldo.toFixed(2)}€</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Prémios */}
        {activeTab === "premios" && (
          <div>
            <h2 className="font-serif text-lg text-[#ffb5a0] mb-4">As Tuas Vitórias</h2>

            {loading ? (
              <div className="text-center py-12 text-[#e0bfb7]">A carregar os teus prémios...</div>
            ) : premios.length > 0 ? (
              <div className="space-y-3">
                {premios.map((premio) => (
                  <div
                    key={premio.id}
                    className="bg-[#1f1b19] rounded-2xl p-4 border border-[#58413b]/10 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#ff734b]/20 flex items-center justify-center text-[#ff734b]">
                      {getTipoIcon(premio.tipo)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-[#ffb5a0] font-bold">{premio.nome}</h3>
                        {premio.valor && (
                          <span className="text-xs bg-[#ff734b]/20 text-[#ff734b] px-2 py-0.5 rounded-full">
                            +{premio.valor}€
                          </span>
                        )}
                        {premio.premioEntregue && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            Recebido
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#e0bfb7]">{premio.jogoNome || premio.descricao}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-[#e0bfb7]/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(premio.data).toLocaleDateString("pt-PT")}
                        </span>
                        <span className="text-xs bg-[#2e2928] text-[#e0bfb7] px-2 py-0.5 rounded-full">
                          {getTipoLabel(premio.tipo)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-[#ff734b]/30 mx-auto mb-4" />
                <p className="text-[#e0bfb7]">Ainda não ganhaste nenhum prémio</p>
                <p className="text-sm text-[#e0bfb7]/60 mt-1">A sorte ainda não te sorriu. Participa e tenta a tua sorte!</p>
                <button
                  onClick={() => router.push("/jogos")}
                  className="mt-4 px-6 py-3 bg-[#ff734b] text-[#110d0c] font-bold rounded-xl"
                >
                  Participar Agora
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Histórico */}
        {activeTab === "historico" && (
          <div>
            <h2 className="font-serif text-lg text-[#ffb5a0] mb-4">Histórico de Jogos</h2>
            {historico.length === 0 ? (
              <div className="text-center py-12 text-[#e0bfb7]">Sem histórico de jogos</div>
            ) : (
              <div className="space-y-3">
                {historico.map((item) => (
                  <div key={item.id} className="bg-[#1f1b19] rounded-2xl p-4 border border-[#58413b]/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-[#ffb5a0] font-bold">{item.jogoNome}</h3>
                        <p className="text-sm text-[#e0bfb7]">{item.tipo}</p>
                      </div>
                      <div className="text-right">
                        {item.valor && item.valor > 0 && (
                          <p className="text-lg font-bold text-green-500">+{item.valor}€</p>
                        )}
                        <p className="text-xs text-[#e0bfb7]/60">
                          {new Date(item.data).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                    </div>
                    {item.resultado && (
                      <p className="text-sm text-[#e0bfb7] mt-2">Resultado: {item.resultado}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Números */}
        {activeTab === "numeros" && (
          <div>
            <h2 className="font-serif text-lg text-[#ffb5a0] mb-4">Os Teus Números</h2>
            {numerosJogados.length === 0 ? (
              <div className="text-center py-12 text-[#e0bfb7]">Ainda não jogaste nenhum número</div>
            ) : (
              <div className="space-y-4">
                {numerosJogados.map(({ jogo, numeros }) => (
                  <div key={jogo} className="bg-[#1f1b19] rounded-2xl p-4 border border-[#58413b]/10">
                    <h3 className="font-serif text-[#ffb5a0] font-bold mb-2">{jogo}</h3>
                    <div className="flex flex-wrap gap-2">
                      {numeros.map((num) => (
                        <span
                          key={num}
                          className="w-10 h-10 rounded-full bg-[#2e2928] border border-[#58413b]/20 flex items-center justify-center text-sm font-bold"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bg-[#1f1b19] rounded-2xl p-6 border border-[#58413b]/10">
          <h3 className="font-serif text-[#ffb5a0] font-bold mb-3">Como Ganhar Prémios?</h3>
          <ul className="space-y-3 text-sm text-[#e0bfb7]">
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-[#ff734b] mt-0.5" />
              <span>Participa nas Raspadinhas e descobre os teus prémios instantâneos</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-[#ff734b] mt-0.5" />
              <span>No Poio da Vaca, os mais rápidos podem trazer prémios para casa</span>
            </li>
            <li className="flex items-start gap-2">
              <Award className="w-4 h-4 text-[#ff734b] mt-0.5" />
              <span>As Tombolas e Rifas sorteiam prémios em dinheiro para a tua aldeia</span>
            </li>
          </ul>
        </div>
      </main>

      <UserMenuModal open={userMenuOpen} onOpenChange={setUserMenuOpen} />
      <BottomNav />
    </div>
  );
}
