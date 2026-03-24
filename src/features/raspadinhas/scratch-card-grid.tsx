"use client";

import React, { useRef, useEffect, useState } from 'react';

interface ScratchCardGridProps {
  onComplete?: () => void;
  prize?: string;
  isRevealed?: boolean;
}

export const ScratchCardGrid: React.FC<ScratchCardGridProps> = ({
  onComplete,
  prize = "€50.00",
  isRevealed = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchedPercentage, setScratchedPercentage] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with scratch texture simulation
    ctx.fillStyle = '#2b2421';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add pattern-like texture
    ctx.strokeStyle = '#322a26';
    ctx.lineWidth = 2;
    for(let i = 0; i < canvas.width + canvas.height; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - canvas.height, canvas.height);
      ctx.stroke();
    }

    // Add text
    ctx.font = 'bold 12px Plus Jakarta Sans';
    ctx.fillStyle = '#f0e3dd';
    ctx.textAlign = 'center';
    ctx.fillText('RASPE AQUI', canvas.width / 2, canvas.height / 2 + 5);

  }, []);

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Check percentage (simplified)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparentPixels++;
    }
    const percentage = (transparentPixels / (canvas.width * canvas.height)) * 100;
    setScratchedPercentage(percentage);

    if (percentage > 50 && onComplete) {
      onComplete();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      scratch(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && e.touches[0]) {
      scratch(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    }
  };

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-surface-container-lowest/50 border border-primary/20 flex flex-col items-center justify-center">
      {/* Prize Content (Hidden Under Canvas) */}
      <div className="flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-tertiary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
          monetization_on
        </span>
        <span className="text-[10px] font-bold uppercase text-on-surface-variant">{prize}</span>
      </div>

      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className={`absolute inset-0 w-full h-full cursor-pointer transition-opacity duration-500 ${isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onMouseDown={() => setIsDrawing(true)}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDrawing(true)}
        onTouchEnd={() => setIsDrawing(false)}
        onTouchMove={handleTouchMove}
      />
    </div>
  );
};
