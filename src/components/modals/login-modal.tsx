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
import { LogIn, Shield, ArrowLeft, KeyRound } from "lucide-react";

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
        <DialogHeader className="bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-blue-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-indigo-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-indigo-600/20 p-2 rounded-lg">
              {requiresTwoFactor ? <Shield className="h-5 w-5 text-indigo-600" /> : <LogIn className="h-5 w-5 text-indigo-600" />}
            </div>
            {requiresTwoFactor ? "Verificação 2FA" : "Iniciar Sessão"}
          </DialogTitle>
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
                  <Label htmlFor="modal-email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Input
                      id="modal-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="modal-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="modal-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <KeyRound className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="modal-totp" className="text-sm font-medium">Código 2FA</Label>
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
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A entrar..." : requiresTwoFactor ? "Verificar Código" : "Entrar"}
            </Button>
            {requiresTwoFactor && (
              <Button type="button" variant="ghost" onClick={handleBack} disabled={loading} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar
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
                  className="text-indigo-600 hover:text-indigo-500 hover:underline font-medium"
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
