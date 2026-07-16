"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
  saldo?: number;
}

interface UserMenuModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserMenuModal({ open, onOpenChange }: UserMenuModalProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [saldo, setSaldo] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUserData = async () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error("Error parsing user data:", e);
          localStorage.removeItem("user");
        }
        
        // Fetch real balance from API
        try {
          const token = localStorage.getItem("token");
          if (token) {
            const response = await fetch("/api/wallet", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              setSaldo(data.saldo || 0);
            } else {
              console.error("Failed to fetch balance");
              setSaldo(0);
            }
          } else {
            setSaldo(0);
          }
        } catch (error) {
          console.error("Error fetching balance:", error);
          setSaldo(0);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = () => {
    setUser(null);
    onOpenChange(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout efetuado!");
    router.push("/");
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-primary/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-serif text-xl text-accent">A minha Conta</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4 text-center">
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">O meu Saldo Aldeias</p>
              <p className="font-serif text-3xl text-primary animate-pulse">0.00 €</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface-container border border-primary/10 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-serif text-xl text-accent">A minha Conta</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="bg-surface-container-low rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Bem-vindo</p>
            <p className="font-serif text-lg text-accent">{user?.nome}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{user?.email}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">O meu Saldo Aldeias</p>
            <p className="font-serif text-3xl text-primary">{saldo.toFixed(2)} €</p>
          </div>
          <button 
            onClick={() => {
              onOpenChange(false);
              router.push('/perfil');
            }}
            className="w-full py-3 text-center text-secondary hover:bg-secondary/10 rounded-xl flex items-center justify-center gap-2"
          >
            <User className="h-4 w-4" />
            Editar Perfil
          </button>
          {(user?.role === "super_admin" || user?.role === "aldeia_admin") && (
            <button 
              onClick={() => {
                onOpenChange(false);
                router.push('/configuracoes');
              }}
              className="w-full py-3 text-center text-primary hover:bg-primary/10 rounded-xl flex items-center justify-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurações
            </button>
          )}
          <button 
            onClick={handleLogout}
            className="w-full py-3 text-center text-destructive hover:bg-destructive/10 rounded-xl flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Terminar Sessão
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Botão de utilizador para o header
interface UserButtonProps {
  onClick: () => void;
}

export function UserButton({ onClick }: UserButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  return (
    <div className="w-9 h-9 rounded-full bg-surface-container-low overflow-hidden border border-primary/20 relative">
      {user ? (
        <button 
          onClick={onClick}
          className="w-full h-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
        >
          <User className="h-4 w-4 text-primary" />
        </button>
      ) : (
        <button onClick={() => router.push("/")} className="w-full h-full flex items-center justify-center text-primary font-bold text-lg">
          +
        </button>
      )}
    </div>
  );
}
