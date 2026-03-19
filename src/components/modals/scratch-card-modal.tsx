"use client";

import { useRef, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ScratchCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  premio: string | null;
  onReveal: () => Promise<void>;
  jaRevelado: boolean;
}

export function ScratchCardModal({
  open,
  onOpenChange,
  premio,
  onReveal,
  jaRevelado,
}: ScratchCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [revealed, setRevealed] = useState(jaRevelado);
  const [scratchedPercent, setScratchedPercent] = useState(0);

  useEffect(() => {
    if (!open) {
      setRevealed(jaRevelado);
      setScratchedPercent(0);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Configurar canvas
    canvas.width = 300;
    canvas.height = 150;

    // Preencher com cor de raspadinha
    ctx.fillStyle = "#C0C0C0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Adicionar texto
    ctx.fillStyle = "#666";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("RASPE AQUI", canvas.width / 2, canvas.height / 2);

    // Adicionar padrão
    ctx.strokeStyle = "#999";
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }
  }, [open, jaRevelado]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching || revealed) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pos = getMousePos(e);

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Calcular percentagem raspada
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }
    const percent = (transparent / (pixels.length / 4)) * 100;
    setScratchedPercent(percent);

    if (percent > 50 && !revealed) {
      setRevealed(true);
      onReveal();
    }
  };

  const handleRevealAll = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setRevealed(true);
    setScratchedPercent(100);
    await onReveal();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Raspadinha da Sorte</DialogTitle>
          <DialogDescription>
            Raspe para descobrir o seu prémio!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {/* Área da raspadinha */}
          <div className="relative">
            {/* Prémio por baixo */}
            <div
              className={`absolute inset-0 flex items-center justify-center text-center p-4 transition-opacity ${
                revealed ? "opacity-100" : "opacity-0"
              }`}
            >
              <div>
                <p className="text-sm text-muted-foreground">O seu prémio:</p>
                <p className="text-2xl font-bold text-primary">
                  {premio || "Sem Prémio"}
                </p>
              </div>
            </div>

            {/* Canvas para raspar */}
            {!revealed && (
              <canvas
                ref={canvasRef}
                className="cursor-crosshair touch-none border-2 border-gray-300 rounded-lg"
                onMouseDown={() => setIsScratching(true)}
                onMouseUp={() => setIsScratching(false)}
                onMouseLeave={() => setIsScratching(false)}
                onMouseMove={scratch}
                onTouchStart={() => setIsScratching(true)}
                onTouchEnd={() => setIsScratching(false)}
                onTouchMove={scratch}
              />
            )}
          </div>

          {/* Progresso */}
          {!revealed && (
            <div className="w-full mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{Math.round(scratchedPercent)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${scratchedPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Botão revelar tudo */}
          {!revealed && (
            <Button variant="outline" className="mt-4" onClick={handleRevealAll}>
              Revelar Tudo
            </Button>
          )}

          {/* Mensagem de prémio */}
          {revealed && premio && premio !== "sem_premio" && (
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-green-600">
                🎉 Parabéns! Ganhou!
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contacto com a organização para receber o seu prémio.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
