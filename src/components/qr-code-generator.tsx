"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  QrCode, 
  Download, 
  Share2, 
  Copy, 
  Check,
  ExternalLink,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";

interface QRCodeGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    jogoId?: string;
    eventoId?: string;
    aldeiaSlug?: string;
    type: "jogo" | "evento" | "aldeia";
  };
  title?: string;
}

export function QRCodeGenerator({ open, onOpenChange, data, title }: QRCodeGeneratorProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      generateQR();
    }
  }, [open, data]);

  const generateQR = async () => {
    setLoading(true);
    
    // Build the URL
    let baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    let path = "";

    switch (data.type) {
      case "jogo":
        path = `/jogo/${data.jogoId}`;
        break;
      case "evento":
        path = `/evento/${data.eventoId}`;
        break;
      case "aldeia":
        path = `/aldeia/${data.aldeiaSlug}`;
        break;
    }

    const fullUrl = `${baseUrl}${path}`;
    setQrUrl(fullUrl);

    setLoading(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Aldeias Games",
          text: `Participa neste jogo! ${qrUrl}`,
          url: qrUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    // Create a canvas and download as PNG
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 300);
      
      // Add QR code placeholder (in production, use a QR library)
      ctx.fillStyle = "#000000";
      ctx.fillRect(20, 20, 260, 260);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(30, 30, 240, 240);
      
      // Simple QR pattern
      ctx.fillStyle = "#000000";
      // Corner squares
      ctx.fillRect(40, 40, 60, 60);
      ctx.fillRect(200, 40, 60, 60);
      ctx.fillRect(40, 200, 60, 60);
      // Center pattern
      ctx.fillRect(130, 130, 40, 40);
      
      const link = document.createElement("a");
      link.download = `qr-${data.type}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
    
    toast.success("QR Code descarregado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-container border-primary/20 p-0 max-w-sm overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* QR Code Display */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-foreground p-4 rounded-2xl"
            >
              {loading ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <div className="animate-pulse text-muted-foreground">A gerar...</div>
                </div>
              ) : (
                <div className="w-48 h-48 bg-black relative">
                  {/* Simple QR placeholder - in production use a QR library */}
                  <div className="absolute inset-4 bg-foreground p-2">
                    <div className="w-full h-full grid grid-cols-8 gap-0.5">
                      {Array.from({ length: 64 }).map((_, i) => (
                        <div
                          key={i}
                          className={`${
                            // Create a simple pattern
                            (i % 7 === 0 || i % 7 === 1) && i < 16
                              ? "bg-black"
                              : (i % 5 === 0 && i > 40)
                              ? "bg-black"
                              : (i === 27 || i === 28 || i === 35 || i === 36)
                              ? "bg-black"
                              : "bg-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Link para partilhar
            </Label>
            <div className="flex gap-2">
              <Input
                value={qrUrl}
                readOnly
                className="bg-surface-container-low border-transparent text-foreground text-sm flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="border-primary/30"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-surface-container-low rounded-xl p-4 flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Mostra este QR Code aos jogadores. Ao scanear, serão direcionados diretamente para o jogo!
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Partilhar
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              <Download className="h-4 w-4 mr-2" />
              Descarregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick share button component
interface QuickShareProps {
  url: string;
  title: string;
  description?: string;
}

export function QuickShare({ url, title, description }: QuickShareProps) {
  const [showQR, setShowQR] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="border-primary/30 text-primary"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copiar Link
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQR(true)}
          className="border-primary/30 text-primary"
        >
          <QrCode className="h-4 w-4 mr-2" />
          QR Code
        </Button>
      </div>

      <QRCodeGenerator
        open={showQR}
        onOpenChange={setShowQR}
        data={{
          type: "jogo",
          jogoId: url.split("/").pop(),
        }}
        title={title}
      />
    </>
  );
}
