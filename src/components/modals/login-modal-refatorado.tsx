"use client";

import { useState, useCallback } from "react";
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

// Constants for quick login credentials (for testing)
const QUICK_LOGIN_CREDENTIALS = {
  SUPER_ADMIN: { email: "admin@aldeias.pt", password: "123456" },
  ADMIN_ALDEIA: { email: "admin.valeazinha@aldeias.pt", password: "123456" },
  VENDEDOR: { email: "vendedor1@valeazinha.pt", password: "123456" },
  JOGADOR: { email: "jogador1@valeazinha.pt", password: "123456" }
} as const;

type QuickLoginType = keyof typeof QUICK_LOGIN_CREDENTIALS;

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

  const quickLogin = useCallback(async (type: QuickLoginType) => {
    const credentials = QUICK_LOGIN_CREDENTIALS[type];
    setEmail(credentials.email);
    setPassword(credentials.password);
    setLoading(true);
    try {
      await onLogin(credentials.email, credentials.password);
      setEmail("");
      setPassword("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }, [onLogin]);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handleRegisterClick = useCallback(() => {
    onOpenChange(false);
    onRegisterClick();
  }, [onOpenChange, onRegisterClick]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="login-modal-description">
        <DialogHeader>
          <DialogTitle>Iniciar Sessão</DialogTitle>
          <DialogDescription id="login-modal-description">
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
                onChange={(e) => handleEmailChange(e.target.value)}
                required
                aria-describedby="email-error"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                aria-describedby="password-error"
              />
            </div>
            {error && (
              <p id="email-error password-error" className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            {/* Quick Login */}
            <div className="border-t pt-4 mt-2">
              <p className="text-xs text-muted-foreground mb-3">Quick Login (Testes):</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin('SUPER_ADMIN')}
                  disabled={loading}
                  className="h-9"
                  aria-label="Login rápido como Super Admin"
                >
                  Super Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin('ADMIN_ALDEIA')}
                  disabled={loading}
                  className="h-9"
                  aria-label="Login rápido como Admin da Aldeia"
                >
                  Admin Aldeia
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin('VENDEDOR')}
                  disabled={loading}
                  className="h-9"
                  aria-label="Login rápido como Vendedor"
                >
                  Vendedor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin('JOGADOR')}
                  disabled={loading}
                  className="h-9"
                  aria-label="Login rápido como Jogador"
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
                onClick={handleRegisterClick}
                className="text-primary hover:underline"
                aria-label="Ir para página de registo"
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