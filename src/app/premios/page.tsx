"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutHeader } from "@/components/layout-header";
import { Gift, Trophy, Star, Clock, Award, Wallet, User, Heart, Home } from "lucide-react";

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
  tipo: "raspadinha" | "poio_vaca" | "rifa" | "euromilhoes";
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
      case "euromilhoes":
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
      case "euromilhoes":
        return "Euromilhões";
      default:
        return "Prémio";
    }
  };

  return (
    <LayoutHeader>
      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Saldo Card - Always visible for logged users */}
        {user && (
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Disponível</p>
                <p className="text-2xl font-black text-primary">{saldo.toFixed(2)}€</p>
              </div>
            </div>
          </div>
        )}

        {/* Prémios */}
        <div>
            <h2 className="font-serif text-lg text-accent mb-4">A Tuas Vitórias</h2>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">A carregar os teus prémios...</div>
            ) : premios.length > 0 ? (
              <div className="space-y-3">
                {premios.map((premio) => (
                  <div
                    key={premio.id}
                    className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                      {getTipoIcon(premio.tipo)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-accent font-bold">{premio.nome}</h3>
                        {premio.valor && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            +{premio.valor}€
                          </span>
                        )}
                        {premio.premioEntregue && (
                          <span className="text-xs bg-primary/20 text-green-400 px-2 py-0.5 rounded-full">
                            Recebido
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{premio.jogoNome || premio.descricao}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(premio.data).toLocaleDateString("pt-PT")}
                        </span>
                        <span className="text-xs bg-surface-container-low text-muted-foreground px-2 py-0.5 rounded-full">
                          {getTipoLabel(premio.tipo)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Ainda não ganhaste nenhum prémio</p>
                <p className="text-sm text-muted-foreground/60 mt-1">A sorte ainda não te sorriu. Participa e tenta a tua sorte!</p>
                 <button
                   onClick={() => router.push("/jogos")}
                   className="mt-4 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl w-full sm:w-auto"
                 >
                  Participar Agora
                </button>
              </div>
            )}
           </div>

         <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
          <h3 className="font-serif text-accent font-bold mb-3">Como Ganhar Prémios?</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-primary mt-0.5" />
              <span>Participa nas Raspadinhas e descobre os teus prémios instantâneos</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-primary mt-0.5" />
              <span>No Poio da Vaca, os mais rápidos podem trazer prémios para casa</span>
            </li>
            <li className="flex items-start gap-2">
              <Award className="w-4 h-4 text-primary mt-0.5" />
              <span>Os Euromilhões e Rifas sorteiam prémios em dinheiro para a tua aldeia</span>
            </li>
          </ul>
        </div>
      </main>
    </LayoutHeader>
  );
}
