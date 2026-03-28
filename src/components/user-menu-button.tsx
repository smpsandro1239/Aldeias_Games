"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, LogOut } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
}

interface UserMenuButtonProps {
  className?: string;
}

export function UserMenuButton({ className = "" }: UserMenuButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
    toast.success("Logout efetuado!");
    router.push("/");
  };

  return (
    <>
      <div className={`w-9 h-9 rounded-full bg-[#2e2928] overflow-hidden border border-[#ff734b]/20 relative ${className}`}>
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
              <p className="font-serif text-3xl text-[#ff734b]">5,55 €</p>
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
