"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, LogOut, Settings, Wallet } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
  saldo?: number;
}

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export function AppHeader({ title = "Aldeias Games", showBackButton = false, showMenuButton = true, onMenuClick }: AppHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [saldo, setSaldo] = useState<number>(0);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    // Fetch saldo
    const fetchSaldo = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await fetch("/api/wallet", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setSaldo(data.saldo || 0);
          }
        } catch (e) {
          console.error("Erro ao buscar saldo:", e);
        }
      }
    };
    fetchSaldo();
  }, []);

  const handleLogout = () => {
    setUser(null);
    setUserMenuOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout efetuado!");
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showMenuButton && onMenuClick && (
              <button onClick={onMenuClick} className="text-[#ff734b] text-xl">
                ☰
              </button>
            )}
            <button onClick={() => router.push("/")} className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Aldeias Games" width={24} height={24} className="h-6 w-6" />
              <span className="font-serif italic text-[#ff734b] text-lg font-bold">
                {title}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button 
                onClick={() => setUserMenuOpen(true)}
                className="w-9 h-9 rounded-full bg-[#2e2928] overflow-hidden border border-[#ff734b]/20 flex items-center justify-center hover:bg-[#ff734b]/30 transition-colors"
              >
                <User className="h-4 w-4 text-[#ff734b]" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* User Menu Modal */}
      <Dialog open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <DialogContent className="sm:max-w-md bg-[#1f1b19] border border-[#ff734b]/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-serif text-xl text-[#ffb5a0]">A minha Conta</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-[#2e2928] rounded-xl p-4 text-center">
              <p className="text-xs text-[#e0bfb7] mb-1">Bem-vindo</p>
              <p className="font-serif text-lg text-[#ffb5a0]">{user?.nome}</p>
              <p className="text-xs text-[#e0bfb7]/60 mt-1">{user?.email}</p>
            </div>
            <div className="bg-[#2e2928] rounded-xl p-4 text-center">
              <p className="text-xs text-[#e0bfb7] mb-1">O meu Saldo Aldeias</p>
              <p className="font-serif text-3xl text-[#ff734b]">{saldo.toFixed(2)} €</p>
            </div>
            <button 
              onClick={() => {
                setUserMenuOpen(false);
                router.push('/perfil');
              }}
              className="w-full py-3 text-center text-[#9cefff] hover:bg-[#9cefff]/10 rounded-xl flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" />
              Editar Perfil
            </button>
            {(user?.role === "super_admin" || user?.role === "aldeia_admin") && (
              <button 
                onClick={() => {
                  setUserMenuOpen(false);
                  router.push('/configuracoes');
                }}
                className="w-full py-3 text-center text-[#ff734b] hover:bg-[#ff734b]/10 rounded-xl flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="w-full py-3 text-center text-red-500 hover:bg-red-500/10 rounded-xl flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Terminar Sessão
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
