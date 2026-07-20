"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, LogOut, Settings, Banknote, Shield } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/components/providers/wallet-provider";
import { apiRequest } from "@/lib/api-client";
import { VaultPinModal } from "@/components/modals/vault-pin-modal";

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
  const [loading, setLoading] = useState<boolean>(true);
  const { saldo, loading: walletLoading } = useWallet();
  const [cashboxSaldo, setCashboxSaldo] = useState<number | null>(null);
  const [vaultPinOpen, setVaultPinOpen] = useState(false);

  const showCashbox = user?.role === "vendedor" || user?.role === "aldeia_admin" || user?.role === "super_admin";

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user data:", e);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open && showCashbox) {
      setCashboxSaldo(null);
      const token = localStorage.getItem("token");
      if (token) {
        apiRequest("/api/vendedor/cashbox", {
          headers: { Authorization: `Bearer ${token}` },
        }).then(async (res) => {
          if (res.ok) {
            const d = await res.json();
            setCashboxSaldo(d.data?.saldo ?? 0);
          } else {
            const err = await res.json().catch(() => ({}));
            console.error("Cashbox API error:", res.status, err);
            setCashboxSaldo(0);
          }
        }).catch((err) => {
          console.error("Cashbox fetch failed:", err);
          setCashboxSaldo(0);
        });
      }
    }
  }, [open, showCashbox]);

  const handleLogout = () => {
    setUser(null);
    onOpenChange(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout efetuado!");
    router.push("/");
  };

  if (loading || walletLoading) {
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
    <>
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
          {showCashbox && (
            <div className="bg-surface-container-low rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Saldo na Caixa</p>
              <p className="font-serif text-2xl text-accent flex items-center justify-center gap-2">
                <Banknote className="h-5 w-5" />
                {cashboxSaldo !== null ? `${cashboxSaldo.toFixed(2)} €` : "A carregar..."}
              </p>
            </div>
          )}
          {showCashbox && (
            <button
              onClick={() => {
                onOpenChange(false);
                setVaultPinOpen(true);
              }}
              className="w-full py-3 text-center text-primary hover:bg-primary/10 rounded-xl flex items-center justify-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Ver Cofre Geral
            </button>
          )}
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
    <VaultPinModal open={vaultPinOpen} onOpenChange={setVaultPinOpen} />
    </>
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
