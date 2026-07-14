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
  onLogin: (email: string, password: string, totpCode?: string) => Promise<{ success: boolean; requiresTwoFactor?: boolean; error?: string }>;
  onRegisterClick: () => void;
}

export function LoginModal({ open, onOpenChange, onLogin, onRegisterClick }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await onLogin(email, password, requiresTwoFactor ? totpCode : undefined);

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setLoading(false);
        return;
      }

      if (!result.success) {
        setError(result.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      setEmail("");
      setPassword("");
      setTotpCode("");
      setRequiresTwoFactor(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setRequiresTwoFactor(false);
    setTotpCode("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{requiresTwoFactor ? "Verificação 2FA" : "Iniciar Sessão"}</DialogTitle>
          <DialogDescription>
            {requiresTwoFactor
              ? "Introduza o código de 6 dígitos da sua aplicação autenticadora."
              : "Entre com as suas credenciais para aceder à plataforma."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!requiresTwoFactor ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="modal-email">Email</Label>
                  <Input
                    id="modal-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="modal-password">Password</Label>
                  <Input
                    id="modal-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="modal-totp">Código 2FA</Label>
                <Input
                  id="modal-totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  required
                  autoFocus
                  className="text-center text-lg tracking-[0.5em]"
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A entrar..." : requiresTwoFactor ? "Verificar Código" : "Entrar"}
            </Button>
            {requiresTwoFactor && (
              <Button type="button" variant="ghost" onClick={handleBack} disabled={loading}>
                Voltar
              </Button>
            )}
            {!requiresTwoFactor && (
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
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
