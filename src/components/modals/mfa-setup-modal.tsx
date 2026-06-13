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
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";

interface MFASetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MFASetupModal({ open, onOpenChange, onSuccess }: MFASetupModalProps) {
  const [step, setFase] = useState<'init' | 'verify'>('init');
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/auth/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setFase('verify');
      } else {
        toast.error(data.error || "Erro ao iniciar MFA");
      }
    } catch (e) {
      toast.error("Erro de ligação");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/api/auth/mfa/verify", {
        method: "POST",
        body: JSON.stringify({ token })
      });
      if (res.ok) {
        toast.success("MFA ativado com sucesso!");
        onSuccess();
        onOpenChange(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Código inválido");
      }
    } catch (e) {
      toast.error("Erro ao verificar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent">
            <ShieldCheck className="text-primary" />
            Configurar Autenticação 2FA
          </DialogTitle>
          <DialogDescription>
            Adicione uma camada extra de segurança à sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6 text-center">
          {step === 'init' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Irá precisar de uma aplicação de autenticação (como Google Authenticator ou Microsoft Authenticator).
              </p>
              <Button onClick={handleStartSetup} className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Começar Configuração"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center p-2 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code MFA" className="w-48 h-48" />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="mfaToken">Introduza o código de 6 dígitos</Label>
                <Input
                  id="mfaToken"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                />
              </div>
              <Button onClick={handleVerifyToken} className="w-full" disabled={loading || token.length < 6}>
                {loading ? "A verificar..." : "Verificar e Ativar"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
