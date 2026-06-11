"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, Shield, Building2, User, ShoppingCart } from "lucide-react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegisterClick: () => void;
}

export function LoginModal({ open, onOpenChange, onLogin, onRegisterClick }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin(email, password);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await onLogin(email, pass);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-serif text-accent italic">Aldeia Viva</DialogTitle>
          <DialogDescription>
            Inicie sessão para aceder à sua comunidade.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Quick Login Section */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acesso Rápido (Demo)</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("admin@aldeias.pt", "123456")}
                disabled={loading}
                className="h-12 flex flex-col gap-0.5 items-center justify-center border-primary/20 hover:bg-primary/5"
              >
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold">Admin Global</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("admin.valeazinha@aldeias.pt", "123456")}
                disabled={loading}
                className="h-12 flex flex-col gap-0.5 items-center justify-center border-secondary/20 hover:bg-secondary/5"
              >
                <Building2 className="h-4 w-4 text-secondary" />
                <span className="text-[10px] font-bold">Admin Aldeia</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("vendedor1@valeazinha.pt", "123456")}
                disabled={loading}
                className="h-12 flex flex-col gap-0.5 items-center justify-center border-accent/20 hover:bg-accent/5"
              >
                <ShoppingCart className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-bold">Vendedor</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => quickLogin("jogador1@valeazinha.pt", "123456")}
                disabled={loading}
                className="h-12 flex flex-col gap-0.5 items-center justify-center border-muted-foreground/20 hover:bg-muted-foreground/5"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-bold">Jogador</span>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground italic">Ou use credenciais</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border-primary/20 focus:ring-primary/50"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => (window.location.href = "/forgot-password")}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Esqueceu-se?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl border-primary/20 focus:ring-primary/50"
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <Button type="submit" className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold" disabled={loading}>
              {loading ? "A processar..." : "Entrar Agora"}
            </Button>
          </form>

          <Button
            variant="ghost"
            type="button"
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-outline-variant/20 hover:bg-surface-container-low transition-all"
            onClick={handleGoogleLogin}
          >
            <Chrome className="h-5 w-5" />
            <span className="font-semibold">Continuar com Google</span>
          </Button>
        </div>

        <DialogFooter className="flex-col gap-2 sm:justify-center">
          <p className="text-sm text-center text-muted-foreground">
            Ainda não faz parte?{" "}
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onRegisterClick();
              }}
              className="text-primary font-bold hover:underline"
            >
              Criar Conta Grátis
            </button>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
