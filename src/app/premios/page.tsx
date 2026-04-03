"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Trophy, Star, Clock, Award, Wallet, User, LogOut } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenuModal } from "@/components/user-menu-modal";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
}

interface Premio {
  id: string;
  nome: string;
  descricao: string;
  data: string;
  tipo: "raspadinha" | "poio_vaca" | "rifa" | "tombola";
  valor?: number;
}

export default function PremiosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const premios: Premio[] = [
    {
      id: "1",
      nome: "Vale de 25€",
      descricao: "Raspadinha Premium - Sorteio de Natal",
      data: "2024-12-20",
      tipo: "raspadinha",
      valor: 25,
    },
    {
      id: "2",
      nome: "2º Lugar - Poio da Vaca",
      descricao: "Campanha Aldeia de São Brás",
      data: "2024-11-15",
      tipo: "poio_vaca",
      valor: 50,
    },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    setUserMenuOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
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
      <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-[#2e2928] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#ff734b]" />
          </button>
          <h1 className="font-serif text-xl tracking-wide text-[#ffb5a0] font-bold italic">Os Meus Prémios</h1>
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
      </header>

      <main className="px-4 pt-6 space-y-6">
        {user && (
          <div className="bg-[#1f1b19] rounded-2xl p-4 border border-[#ff734b]/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#e0bfb7]">Saldo Total Ganho</p>
                <p className="font-serif text-3xl text-[#ff734b] font-bold">75,00 €</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-[#ff734b]/20 flex items-center justify-center">
                <Wallet className="w-7 h-7 text-[#ff734b]" />
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="font-serif text-lg text-[#ffb5a0] mb-4">Histórico de Prémios</h2>
          
          {premios.length > 0 ? (
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
                    </div>
                    <p className="text-sm text-[#e0bfb7]">{premio.descricao}</p>
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
              <Gift className="w-16 h-16 text-[#ff734b]/30 mx-auto mb-4" />
              <p className="text-[#e0bfb7]">Ainda não ganhaste nenhum prémio</p>
              <p className="text-sm text-[#e0bfb7]/60 mt-1">Participa nos jogos para teres a chance de ganhar!</p>
              <button
                onClick={() => router.push("/jogos")}
                className="mt-4 px-6 py-3 bg-[#ff734b] text-[#110d0c] font-bold rounded-xl"
              >
                Jogar Agora
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#1f1b19] rounded-2xl p-6 border border-[#58413b]/10">
          <h3 className="font-serif text-[#ffb5a0] font-bold mb-3">Como Ganhar Prémios?</h3>
          <ul className="space-y-3 text-sm text-[#e0bfb7]">
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-[#ff734b] mt-0.5" />
              <span>Participa nas Raspadinhas e descobre prémios instantâneos</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-[#ff734b] mt-0.5" />
              <span>No Poio da Vaca, os primeiros a不全完成 podem ganhar prémios</span>
            </li>
            <li className="flex items-start gap-2">
              <Award className="w-4 h-4 text-[#ff734b] mt-0.5" />
              <span>As Tombolas e Rifas sortearm prémios em dinheiro</span>
            </li>
          </ul>
        </div>
      </main>

       {/* User Menu Modal */}
       <UserMenuModal open={userMenuOpen} onOpenChange={setUserMenuOpen} />

      <BottomNav />
    </div>
  );
}
