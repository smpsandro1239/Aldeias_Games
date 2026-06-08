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
import { Chrome } from "lucide-react";

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

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Iniciar Sessão</DialogTitle>
          <DialogDescription>
            Entre com as suas credenciais ou use a sua conta Google.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            type="button"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
          >
            <Chrome className="h-4 w-4" />
            Continuar com Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou com email</span>
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
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => (window.location.href = "/forgot-password")}
                  className="text-xs text-primary hover:underline"
                >
                  Esqueceu-se da password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A entrar..." : "Entrar"}
            </Button>
          </form>
        </div>

        <DialogFooter className="flex-col gap-2">
          <p className="text-sm text-center text-muted-foreground">
            Não tem conta?{" "}
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onRegisterClick();
              }}
              className="text-primary hover:underline"
            >
              Registe-se
            </button>
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
