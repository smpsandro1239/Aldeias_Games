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
    setEmail(email);
    setPassword(pass);
    setLoading(true);
    try {
      await onLogin(email, pass);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Iniciar Sessão</DialogTitle>
          <DialogDescription>
            Entre com as suas credenciais para aceder à plataforma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Quick Login */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Quick Login (Testes):</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("admin@aldeias.pt", "123456")}
                  disabled={loading}
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("aldeia@gmail.com", "123456")}
                  disabled={loading}
                >
                  Aldeia
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("vendedor@gmail.com", "123456")}
                  disabled={loading}
                >
                  Vendedor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin("smpsandro1239@gmail.com", "123456")}
                  disabled={loading}
                >
                  Jogador
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A entrar..." : "Entrar"}
            </Button>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
