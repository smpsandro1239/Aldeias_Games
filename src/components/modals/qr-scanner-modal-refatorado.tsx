"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, Keyboard, Check, X, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";

// Constants for scan modes to avoid magic strings
const SCAN_MODES = {
  CAMERA: 'camera',
  MANUAL: 'manual'
} as const;

type ScanMode = typeof SCAN_MODES[keyof typeof SCAN_MODES];

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pedidoId: string, password: string) => Promise<void>;
}

export function QRScannerModal({ open, onOpenChange, onConfirm }: QRScannerModalProps) {
  const [modo, setModo] = useState<ScanMode>(SCAN_MODES.CAMERA);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open && modo === SCAN_MODES.CAMERA) {
      startCamera();
    }
    return () => stopCamera();
  }, [open, modo]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Não foi possível aceder à câmera");
      setModo(SCAN_MODES.MANUAL);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setScanning(false);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!password || password.length < 6) {
      toast.error("Password inválida");
      return;
    }
    setLoading(true);
    try {
      await onConfirm("", password);
      setPassword("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao confirmar");
    } finally {
      setLoading(false);
    }
  }, [password, onConfirm]);

  const handleModeChange = useCallback((newMode: ScanMode) => {
    setModo(newMode);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value.toUpperCase());
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface-container border-primary/20" aria-describedby="qr-scanner-description">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" aria-hidden="true" />
            Ler Código de Carregamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4" id="qr-scanner-description">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={modo === SCAN_MODES.CAMERA ? "default" : "outline"}
              onClick={() => handleModeChange(SCAN_MODES.CAMERA)}
              className={`flex-1 ${modo === SCAN_MODES.CAMERA ? "bg-primary" : ""}`}
              disabled={scanning}
              aria-pressed={modo === SCAN_MODES.CAMERA}
            >
              <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
              Câmera
            </Button>
            <Button
              type="button"
              variant={modo === SCAN_MODES.MANUAL ? "default" : "outline"}
              onClick={() => handleModeChange(SCAN_MODES.MANUAL)}
              className={`flex-1 ${modo === SCAN_MODES.MANUAL ? "bg-primary" : ""}`}
              aria-pressed={modo === SCAN_MODES.MANUAL}
            >
              <Keyboard className="w-4 h-4 mr-2" aria-hidden="true" />
              Manual
            </Button>
          </div>

          {/* Camera View */}
          {modo === SCAN_MODES.CAMERA && (
            <div className="relative aspect-square bg-[#0a0908] rounded-2xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                aria-label="Vídeo da câmera para escanear QR code"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse" aria-hidden="true" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-sm text-muted-foreground bg-black/50 px-4 py-2 rounded-full">
                  Aponte a câmera para o QR Code do jogador
                </p>
              </div>
            </div>
          )}

          {/* Manual Input */}
          {modo === SCAN_MODES.MANUAL && (
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Password de 6 dígitos
                </label>
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Ex: ABC123"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  aria-describedby="password-description"
                />
              </div>
              <p id="password-description" className="text-xs text-muted-foreground/60 text-center">
                O jogador deve mostrar-te a password de 6 dígitos
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" aria-hidden="true" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading || password.length < 6}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="w-4 h-4 mr-2" aria-hidden="true" />
              )}
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}