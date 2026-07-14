"use client";

import { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldOff, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface TwoFactorSetupProps {
  isMandatory?: boolean;
}

export function TwoFactorSetup({ isMandatory = false }: TwoFactorSetupProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupState, setSetupState] = useState<"idle" | "qr" | "verify" | "done">("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/auth/2fa");
      const data = await res.json();
      setEnabled(data.enabled || false);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setSetupState("qr");
      } else {
        toast.error(data.error || "Erro ao configurar 2FA");
      }
    } catch {
      toast.error("Erro ao configurar 2FA");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast.error("O código deve ter 6 dígitos");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code: verifyCode }),
      });
      const data = await res.json();
      if (data.success) {
        setEnabled(true);
        setSetupState("done");
        setVerifyCode("");
        toast.success("2FA ativado com sucesso!");
      } else {
        toast.error(data.error || "Código inválido");
      }
    } catch {
      toast.error("Erro ao verificar código");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      const data = await res.json();
      if (data.success) {
        setEnabled(false);
        setSetupState("idle");
        toast.success("2FA desativado");
      } else {
        toast.error(data.error || "Erro ao desativar 2FA");
      }
    } catch {
      toast.error("Erro ao desativar 2FA");
    } finally {
      setSubmitting(false);
    }
  };

  const resetSetup = () => {
    setSetupState("idle");
    setQrCode("");
    setSecret("");
    setVerifyCode("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {enabled ? (
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">
              {enabled ? "Autenticação em 2 Passos Ativa" : "Autenticação em 2 Passos"}
            </p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? "A sua conta está protegida com TOTP"
                : isMandatory
                  ? "Ativação obrigatória para contas administrativas"
                  : "Proteja a sua conta com uma aplicação autenticadora"}
            </p>
          </div>
        </div>

        {enabled && setupState !== "qr" && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-500/10 rounded-full">
              Ativo
            </span>
          </div>
        )}
      </div>

      {setupState === "qr" && (
        <div className="space-y-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-2">
              1. Escaneie o QR Code
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Use Google Authenticator, Authy ou outra app TOTP
            </p>
            <div className="inline-block bg-white p-3 rounded-xl">
              <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Ou introduza o código manualmente:</Label>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSecret ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {showSecret && (
              <div className="bg-background rounded-lg px-3 py-2 font-mono text-sm break-all text-foreground border border-outline-variant/10">
                {secret}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">2. Introduza o código de verificação</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-[0.5em] font-mono"
              />
              <Button
                onClick={handleVerify}
                disabled={submitting || verifyCode.length !== 6}
                className="px-6"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button variant="ghost" onClick={resetSetup} className="w-full text-sm" disabled={submitting}>
            Cancelar
          </Button>
        </div>
      )}

      {setupState === "done" && (
        <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/20 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-green-600 mx-auto" />
          <p className="text-sm font-medium text-green-700">2FA ativado com sucesso!</p>
          <p className="text-xs text-muted-foreground">
            A partir de agora, será necessário introduzir um código da app autenticadora ao iniciar sessão.
          </p>
        </div>
      )}

      {setupState === "idle" && !enabled && (
        <Button
          onClick={handleSetup}
          disabled={submitting}
          className="w-full"
          variant={isMandatory ? "default" : "outline"}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Shield className="w-4 h-4 mr-2" />
          )}
          {isMandatory ? "Ativar Agora (Obrigatório)" : "Ativar Autenticação em 2 Passos"}
        </Button>
      )}

      {setupState === "idle" && enabled && (
        <Button
          onClick={handleDisable}
          disabled={submitting || isMandatory}
          variant="ghost"
          className="w-full text-destructive hover:text-destructive"
          title={isMandatory ? "Administradores não podem desativar 2FA" : ""}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <ShieldOff className="w-4 h-4 mr-2" />
          )}
          Desativar 2FA
        </Button>
      )}
    </div>
  );
}
