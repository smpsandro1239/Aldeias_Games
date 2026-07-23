"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

interface AldeiaSaldo {
  aldeiaId: string;
  nome: string;
  slug: string;
  saldo: number;
}

interface VaultPinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VaultPinModal({ open, onOpenChange }: VaultPinModalProps) {
  const [pinEnabled, setPinEnabled] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"setup" | "verify" | "view">("verify");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [aldeias, setAldeias] = useState<AldeiaSaldo[]>([]);
  const [totalSaldo, setTotalSaldo] = useState<number>(0);
  const [showPin, setShowPin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    if (open) {
      setPin("");
      setConfirmPin("");
      setPassword("");
      setAldeias([]);
      setTotalSaldo(0);
      setShowPin(false);
      setMode("verify");
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setIsSuperAdmin(user.role === "super_admin");

      apiRequest("/api/users/vault-pin")
        .then((res) => {
          if (!res.ok) throw new Error("Erro");
          return res.json();
        })
        .then((d) => {
          setPinEnabled(d.data?.vaultPinEnabled ?? false);
          if (!d.data?.vaultPinEnabled) setMode("setup");
        })
        .catch(() => setPinEnabled(false))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleSetup = async () => {
    if (pin.length < 4) {
      toast.error("PIN deve ter pelo menos 4 dígitos");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs não coincidem");
      return;
    }
    if (!password) {
      toast.error("Insira a sua password");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("/api/users/vault-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "setup", pin, confirmPin, password }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("PIN configurado com sucesso!");
        setPinEnabled(true);
        setMode("verify");
        setPin("");
        setConfirmPin("");
        setPassword("");
      } else {
        toast.error(data.error || "Erro ao configurar PIN");
      }
    } catch {
      toast.error("Erro ao configurar PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!pin) {
      toast.error("Insira o PIN");
      return;
    }
    setVerifying(true);
    try {
      const res = await apiRequest("/api/users/vault-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "verify", pin }),
      });
      const data = await res.json();
      if (res.ok) {
        setAldeias(data.data.aldeias || []);
        setTotalSaldo(data.data.total || 0);
        setMode("view");
      } else {
        toast.error(data.error || "PIN incorreto");
        setPin("");
      }
    } catch {
      toast.error("Erro ao verificar PIN");
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (mode === "setup") handleSetup();
      else if (mode === "verify") handleVerify();
    }
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-sm bg-surface-container border border-primary/10 p-0 overflow-hidden max-h-[85vh] overflow-y-auto">
        <DialogHeader className="p-4 sm:p-6 pb-2">
          <DialogTitle className="font-serif text-lg sm:text-xl text-accent flex items-center gap-2">
            <Shield className="h-5 w-5 shrink-0" />
            Cofre Geral
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-pulse text-muted-foreground">A carregar...</div>
            </div>
          )}

          {!loading && mode === "setup" && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Configure um PIN de 4 a 6 dígitos para aceder ao cofre da aldeia.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Novo PIN</label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={handleKeyDown}
                      placeholder="****"
                      className="w-full bg-surface-container-low border border-primary/20 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-mono text-accent placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Confirmar PIN</label>
                  <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={handleKeyDown}
                    placeholder="****"
                    className="w-full bg-surface-container-low border border-primary/20 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-mono text-accent placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Password da conta</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-low border border-primary/20 rounded-xl px-4 py-3 text-center text-accent placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
              <button
                onClick={handleSetup}
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "A configurar..." : "Configurar PIN"}
              </button>
            </>
          )}

          {!loading && mode === "verify" && (
            <>
              <div className="text-center">
                <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Introduza o PIN para ver o saldo do cofre
                </p>
              </div>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={handleKeyDown}
                  placeholder="****"
                  autoFocus
                  className="w-full bg-surface-container-low border border-primary/20 rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] font-mono text-accent placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={handleVerify}
                disabled={verifying || !pin}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {verifying ? "A verificar..." : "Ver Saldo"}
              </button>
            </>
          )}

          {!loading && mode === "view" && (
            <>
              {isSuperAdmin && aldeias.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Saldo por Aldeia
                  </p>
                  {aldeias.map((a) => (
                    <div
                      key={a.aldeiaId}
                      className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3"
                    >
                      <span className="text-sm text-accent font-medium">{a.nome}</span>
                      <span className="font-mono text-sm text-primary">{formatCurrency(a.saldo)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-surface-container-low rounded-xl p-4 sm:p-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  {isSuperAdmin && aldeias.length > 1 ? "Saldo Total" : "Saldo do Cofre da Aldeia"}
                </p>
                <p className="font-serif text-3xl sm:text-4xl text-primary">{formatCurrency(totalSaldo)}</p>
              </div>

              <button
                onClick={() => {
                  setPin("");
                  setAldeias([]);
                  setTotalSaldo(0);
                  setMode("verify");
                }}
                className="w-full py-3 text-center text-secondary hover:bg-secondary/10 rounded-xl"
              >
                Voltar a verificar
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
