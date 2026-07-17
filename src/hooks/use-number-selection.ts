"use client";

import { useState, useCallback } from "react";

interface UseNumberSelectionOptions {
  maxSelection?: number;
}

export function useNumberSelection({ maxSelection = 20 }: UseNumberSelectionOptions = {}) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggle = useCallback((num: number, occupied: number[] = []) => {
    if (occupied.includes(num)) return;

    setSelected((prev) => {
      if (prev.includes(num)) {
        return prev.filter((n) => n !== num);
      }
      if (prev.length >= maxSelection) {
        return prev;
      }
      return [...prev, num];
    });
  }, [maxSelection]);

  const selectRandom = useCallback((count: number, totalNumbers: number, occupied: number[] = []) => {
    const available = [];
    for (let i = 1; i <= totalNumbers; i++) {
      if (!occupied.includes(i) && !selected.includes(i)) {
        available.push(i);
      }
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const randomSelection = shuffled.slice(0, Math.min(count, maxSelection));
    setSelected(randomSelection);
  }, [selected, maxSelection]);

  const clear = useCallback(() => {
    setSelected([]);
  }, []);

  const isSelected = useCallback((num: number) => {
    return selected.includes(num);
  }, [selected]);

  const isAtLimit = selected.length >= maxSelection;

  return {
    selected,
    setSelected,
    toggle,
    selectRandom,
    clear,
    isSelected,
    isAtLimit,
    count: selected.length,
  };
}
