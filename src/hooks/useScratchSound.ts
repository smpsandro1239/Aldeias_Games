"use client";

import { useRef, useCallback } from "react";

export function useScratchSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playScratch = useCallback((intensity: number = 1) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      // Camada 1: Ruído de raspagem metálica
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200 + Math.random() * 600;

      const gain = ctx.createGain();
      gain.gain.value = 0.25 * intensity;

      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 80 + Math.random() * 40;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.08;

      noise.connect(filter);
      filter.connect(gain);
      osc.connect(oscGain);
      oscGain.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      osc.start();
      setTimeout(() => {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
        oscGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      }, 0);
    } catch {
      // Silent fail - audio may not be available
    }
  }, []);

  return { playScratch };
}
