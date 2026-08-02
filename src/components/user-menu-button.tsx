"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  User, LogOut, Settings, Banknote, Shield, ChevronRight, LogIn,
  Ticket, Wallet, ScanSearch, Hash, Lock, ShieldCheck, ShieldAlert,
} from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import { VaultPinModal } from "@/components/modals/vault-pin-modal";
import { CarregarSaldoModal } from "@/components/modals/carregar-saldo-modal";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Administrador",
  aldeia_admin: "Administrador",
  vendedor: "Vendedor",
  user: "Jogador",
};

const ROLE_BADGE: Record<string, string> = {
  super_admin: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  aldeia_admin: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  vendedor: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  user: "bg-green-500/20 text-green-700 border-green-500/30",
};

interface UserMenuButtonProps {
  className?: string;
}

export function UserMenuButton({ className = "" }: UserMenuButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cashboxSaldo, setCashboxSaldo] = useState<number | null>(null);
  const [pinEnabled, setPinEnabled] = useState<boolean | null>(null);
  const [vaultPinOpen, setVaultPinOpen] = useState(false);
  const [carregarSaldoOpen, setCarregarSaldoOpen] = useState(false);
  const { logout } = useAuth();

  const showCashbox = user?.role === "vendedor" || user?.role === "aldeia_admin" || user?.role === "super_admin";

  const cashboxPath = user?.role === "super_admin"
    ? "/superadmindashboard/cofre"
    : user?.role === "aldeia_admin"
    ? "/admindashboard/cofre"
    : "/vendedordashboard?tab=cofre";

  const participacoesPath = user?.role === "user" ? "/participacoes" : "/numeros-jogados";

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

      apiRequest("/api/users/vault-pin")
        .then(async (res) => {
          if (res.ok) {
            const d = await res.json();
            setPinEnabled(d.data?.vaultPinEnabled ?? false);
          } else {
            setPinEnabled(false);
          }
        })
        .catch(() => setPinEnabled(null));
    }
  }, [userMenuOpen, showCashbox]);

  const handleLogout = () => {
    setUser(null);
    setUserMenuOpen(false);
    void logout();
    // Hard reload para limpar o estado do header e o cookie httpOnly
    window.location.href = "/";
  };

  return (
    <>
      <div className={`w-9 h-9 rounded-full bg-surface-container-low overflow-hidden border border-primary/20 relative ${className}`}>
        {user ? (
          <button 
            onClick={() => setUserMenuOpen(true)}
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

      <Dialog open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-primary/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-serif text-xl text-accent">A minha Conta</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            {!user ? (
              <div className="space-y-4">
                <div className="bg-surface-container-low rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Bem-vindo</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inicie sessão para aceder à sua conta, saldo e participações.
                  </p>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); router.push("/"); }}
                  className="w-full py-3 text-center text-primary bg-primary/10 hover:bg-primary/20 rounded-xl flex items-center justify-center gap-2 font-semibold"
                >
                  <LogIn className="h-4 w-4" />
                  Fazer Login / Registar
                </button>
              </div>
            ) : (
              <>
            <div className="bg-surface-container-low rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Bem-vindo</p>
              <p className="font-serif text-lg text-accent">{user?.nome}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{user?.email}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${ROLE_BADGE[user?.role || ""] || ROLE_BADGE.user}`}>
                {ROLE_LABEL[user?.role || ""] || user?.role || "Jogador"}
              </span>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">O meu Saldo Aldeias</p>
              <p className="font-serif text-3xl text-primary">0,00 €</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setUserMenuOpen(false); router.push(participacoesPath); }}
                className="bg-surface-container-low hover:bg-surface-container-high rounded-xl px-3 py-3 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <Ticket className="h-4 w-4 text-primary" />
                Minhas Participações
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); setCarregarSaldoOpen(true); }}
                className="bg-surface-container-low hover:bg-surface-container-high rounded-xl px-3 py-3 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <Wallet className="h-4 w-4 text-secondary" />
                Carregar Saldo
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); router.push('/verificar-raspadinha'); }}
                className="bg-surface-container-low hover:bg-surface-container-high rounded-xl px-3 py-3 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <ScanSearch className="h-4 w-4 text-primary" />
                Verificar Raspadinha
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); router.push('/numeros-jogados'); }}
                className="bg-surface-container-low hover:bg-surface-container-high rounded-xl px-3 py-3 flex flex-col items-center gap-1.5 text-xs font-medium transition-colors"
              >
                <Hash className="h-4 w-4 text-secondary" />
                Meus Números
              </button>
            </div>
            {showCashbox && (
              <div
                className="bg-surface-container-low rounded-xl p-4 text-center cursor-pointer hover:bg-surface-container-high transition-colors"
                onClick={() => { setUserMenuOpen(false); router.push(cashboxPath); }}
              >
                <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  Saldo na Caixa <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                </p>
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
                className="w-full flex items-center justify-between bg-surface-container-low hover:bg-surface-container-high rounded-xl px-4 py-3 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="h-4 w-4 text-primary" />
                  PIN do Cofre
                </span>
                {pinEnabled === null ? (
                  <span className="text-xs text-muted-foreground">A carregar...</span>
                ) : pinEnabled ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Configurado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                    <ShieldAlert className="h-3.5 w-3.5" /> Não configurado
                  </span>
                )}
              </button>
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
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <VaultPinModal open={vaultPinOpen} onOpenChange={setVaultPinOpen} />
      <CarregarSaldoModal
        open={carregarSaldoOpen}
        onOpenChange={setCarregarSaldoOpen}
        aldeiaId={user?.aldeiaId}
      />
    </>
  );
}
