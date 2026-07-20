"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, LogOut, Settings, Wallet, House, Banknote, Shield } from "lucide-react";
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
  const { saldo } = useWallet();
  const [cashboxSaldo, setCashboxSaldo] = useState<number | null>(null);
  const [vaultPinOpen, setVaultPinOpen] = useState(false);

  const showCashbox = user?.role === "vendedor" || user?.role === "aldeia_admin" || user?.role === "super_admin";

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (userMenuOpen && showCashbox) {
      setCashboxSaldo(null);
      apiRequest("/api/vendedor/cashbox")
        .then(async (res) => {
          if (res.ok) {
            const d = await res.json();
            setCashboxSaldo(d.data?.saldo ?? 0);
          } else {
            setCashboxSaldo(0);
          }
        })
        .catch(() => setCashboxSaldo(0));
    }
  }, [userMenuOpen, showCashbox]);

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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {showMenuButton && onMenuClick && (
              <button onClick={onMenuClick} className="text-primary text-xl">
                ☰
              </button>
            )}
            <button onClick={() => router.push("/")} className="flex items-center gap-2">
              <House className="h-6 w-6 text-primary" />
              <span className="font-serif italic text-primary text-lg font-bold">
                {title}
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button 
                onClick={() => setUserMenuOpen(true)}
                className="w-9 h-9 rounded-full bg-surface-container-low overflow-hidden border border-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
              >
                <User className="h-4 w-4 text-primary" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* User Menu Modal */}
      <Dialog open={userMenuOpen} onOpenChange={setUserMenuOpen}>
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
                  {cashboxSaldo !== null ? `${cashboxSaldo.toFixed(2)} €` : "..."}
                </p>
              </div>
            )}
            {showCashbox && (
              <button
                onClick={() => {
                  setUserMenuOpen(false);
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
                setUserMenuOpen(false);
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
                  setUserMenuOpen(false);
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
