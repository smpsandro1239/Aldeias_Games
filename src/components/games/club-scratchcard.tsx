"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";

type CellContent = {
  id: string;
  label?: string;
  color?: string;
  icon?: string;
};

type ClubScratchcardProps = {
  title?: string;
  subtitle?: string;
  colors?: { primary?: string; accent?: string; text?: string };
  grid?: CellContent[];
  ticketNumber?: string;
  logoSrc?: string | null;
  width?: number;
  height?: number;
  onCellRevealed?: (cellId: string) => void;
  revealThreshold?: number;
  premio?: string | null;
  revealed?: boolean;
};

export function ClubScratchcard({
  title = "Raspa e Ganha",
  subtitle = "Boa Sorte!",
  colors = { primary: "#0f766e", accent: "#f59e0b", text: "#ffffff" },
  grid,
  ticketNumber = "Nº 00001",
  logoSrc = null,
  width = 820,
  height = 480,
  onCellRevealed,
  revealThreshold = 60,
  premio,
  revealed = false,
}: ClubScratchcardProps) {
  const defaultGrid: CellContent[] = Array.from({ length: 9 }).map((_, i) => ({
    id: `cell-${i + 1}`,
    label: `PRÉMIO ${i + 1}`,
    color: ["#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e"][i % 9],
    icon: ["⚽", "🏆", "🎟️", "💶", "🎁", "📱", "🍀", "🥇", "🎉"][i % 9],
  }));

  const cells = grid && grid.length === 9 ? grid : defaultGrid;

  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const revealedCellsRef = useRef<Record<string, boolean>>({});
  const [revealedCount, setRevealedCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPremio, setShowPremio] = useState(false);

  useEffect(() => {
    if (revealed) {
      Object.keys(canvasRefs.current).forEach((key) => {
        const canvas = canvasRefs.current[key];
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
      setRevealedCount(9);
    }
  }, [revealed]);

  useEffect(() => {
    if (revealed) return;
    
    cells.forEach((c) => {
      const canvas = canvasRefs.current[c.id];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#C0C0C0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "rgba(255,255,255,0.12)");
      grad.addColorStop(0.5, "rgba(0,0,0,0.06)");
      grad.addColorStop(1, "rgba(255,255,255,0.06)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalCompositeOperation = "destination-out";
      revealedCellsRef.current[c.id] = false;
    });
  }, [cells, revealed]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>, cellId: string) => {
    if (revealed) return;
    
    const canvas = canvasRefs.current[cellId];
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    const draw = (clientX: number, clientY: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc((clientX - rect.left) * dpr, (clientY - rect.top) * dpr, Math.max(12, Math.min(canvas.width, canvas.height) * 0.06), 0, Math.PI * 2);
      ctx.fill();
    };
    
    draw(e.clientX, e.clientY);

    const handleMove = (ev: PointerEvent) => {
      draw(ev.clientX, ev.clientY);
    };
    
    const handleUp = (ev: PointerEvent) => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      
      const ctx2 = canvas.getContext("2d");
      if (!ctx2) return;
      
      const img = ctx2.getImageData(0, 0, canvas.width, canvas.height);
      let transparent = 0;
      for (let i = 3; i < img.data.length; i += 4) {
        if (img.data[i] === 0) transparent++;
      }
      const pct = (transparent / (canvas.width * canvas.height)) * 100;
      
      if (pct >= revealThreshold && !revealedCellsRef.current[cellId]) {
        revealedCellsRef.current[cellId] = true;
        ctx2.clearRect(0, 0, canvas.width, canvas.height);
        setRevealedCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 9) {
            setShowPremio(true);
            if (premio && premio !== "sem_premio") {
              setShowCelebration(true);
            }
          }
          return newCount;
        });
        onCellRevealed?.(cellId);
      }
    };
    
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
  }, [onCellRevealed, revealThreshold, revealed, premio]);

  useEffect(() => {
    if (revealed) return;
    
    const listeners: { el: HTMLCanvasElement; fn: (e: PointerEvent) => void }[] = [];
    cells.forEach((c) => {
      const el = canvasRefs.current[c.id];
      if (!el) return;
      const fn = (ev: PointerEvent) => handlePointerDown(ev as unknown as React.PointerEvent<HTMLCanvasElement>, c.id);
      el.addEventListener("pointerdown", fn);
      listeners.push({ el, fn });
    });
    return () => {
      listeners.forEach(({ el, fn }) => el.removeEventListener("pointerdown", fn));
    };
  }, [cells, handlePointerDown, revealed]);

  const cardStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    background: colors.primary,
    color: colors.text,
  };

  const gridAreaStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    padding: "12px",
    background: "#ffffff",
    borderRadius: 8,
  };

  return (
    <div className="mx-auto p-4">
      <div
        className="rounded-lg shadow-lg overflow-hidden"
        style={cardStyle}
        role="img"
        aria-label="Raspadinha do clube"
      >
        <div className="flex items-stretch h-full">
          <div className="w-1/3 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                {logoSrc ? (
                  <img src={logoSrc} alt="logo" className="w-12 h-12 object-contain rounded" />
                ) : (
                  <div className="w-12 h-12 bg-white/20 rounded flex items-center justify-center font-bold text-sm">
                    CLUBE
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-extrabold" style={{ color: colors.text }}>{title}</h1>
                  <div className="text-sm" style={{ color: colors.text }}>{subtitle}</div>
                </div>
              </div>

              <div className="mt-4 h-28 rounded bg-white/10 flex items-center justify-center text-sm text-center px-2" style={{ color: colors.text }}>
                {colors.accent && (
                  <span className="text-lg font-bold" style={{ color: colors.accent }}>
                    BOA SORTE!
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-sm font-semibold" style={{ color: colors.text }}>PARTICIPE E BOA SORTE!</div>
              <div className="mt-2 text-xs font-mono" style={{ color: colors.text }}>{ticketNumber}</div>
            </div>
          </div>

          <div className="w-2/3 p-4 flex items-center justify-center">
            <div style={gridAreaStyle} className="w-full">
              {cells.map((c) => {
                const isRevealed = revealed || revealedCellsRef.current[c.id];
                return (
                  <div key={c.id} className="relative rounded overflow-hidden" style={{ minHeight: 80 }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2" style={{ background: c.color ?? "#eee" }}>
                      <div className="text-2xl">{c.icon ?? ""}</div>
                      <div className="mt-2 text-sm font-bold">{c.label}</div>
                    </div>

                    {!isRevealed && (
                      <canvas
                        ref={(el) => {
                          if (!el) return;
                          const rect = el.getBoundingClientRect();
                          const dpr = window.devicePixelRatio || 1;
                          el.width = Math.max(1, Math.floor(rect.width * dpr));
                          el.height = Math.max(1, Math.floor(rect.height * dpr));
                          el.style.width = `${rect.width}px`;
                          el.style.height = `${rect.height}px`;
                          canvasRefs.current[c.id] = el;
                        }}
                        className="absolute inset-0 w-full h-full"
                        style={{ touchAction: "none", cursor: "crosshair" }}
                        onPointerDown={(e) => handlePointerDown(e, c.id)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showPremio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPremio(false)}>
          <div className="bg-white rounded-lg p-8 text-center max-w-md" onClick={(e) => e.stopPropagation()}>
            {showCelebration ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">PARABÉNS!</h2>
                <p className="text-lg font-semibold">{premio}</p>
                <p className="text-sm text-gray-500 mt-2">Contacte a organização para receber</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">😊</div>
                <h2 className="text-xl font-bold mb-2">Sem Prémio</h2>
                <p className="text-gray-500">Mas obrigado pela participação!</p>
              </>
            )}
            <button 
              className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
              onClick={() => setShowPremio(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}