"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, Keyboard, Check, X, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pedidoId: string, password: string) => Promise<void>;
}

export function QRScannerModal({ open, onOpenChange, onConfirm }: QRScannerModalProps) {
  const [modo, setModo] = useState<"camera" | "manual">("camera");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open && modo === "camera") {
      startCamera();
    }
    return () => stopCamera();
  }, [open, modo]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Não foi possível aceder à câmera");
      setModo("manual");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleConfirm = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1f1b19] border-[#ff734b]/20">
        <DialogHeader>
          <DialogTitle className="text-[#eae0de] flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-[#ff734b]" />
            Ler Código de Carregamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={modo === "camera" ? "default" : "outline"}
              onClick={() => setModo("camera")}
              className={`flex-1 ${modo === "camera" ? "bg-[#ff734b]" : ""}`}
              disabled={scanning}
            >
              <Camera className="w-4 h-4 mr-2" />
              Câmera
            </Button>
            <Button
              type="button"
              variant={modo === "manual" ? "default" : "outline"}
              onClick={() => setModo("manual")}
              className={`flex-1 ${modo === "manual" ? "bg-[#ff734b]" : ""}`}
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Manual
            </Button>
          </div>

          {/* Camera View */}
          {modo === "camera" && (
            <div className="relative aspect-square bg-[#0a0908] rounded-2xl overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-[#ff734b] rounded-lg animate-pulse" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-sm text-[#e0bfb7] bg-black/50 px-4 py-2 rounded-full">
                  Aponte a câmera para o QR Code do jogador
                </p>
              </div>
            </div>
          )}

          {/* Manual Input */}
          {modo === "manual" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                  Password de 6 dígitos
                </label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value.toUpperCase())}
                  placeholder="Ex: ABC123"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>
              <p className="text-xs text-[#e0bfb7]/60 text-center">
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
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={loading || password.length < 6}
              className="flex-1 bg-[#ff734b] text-[#110d0c]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}