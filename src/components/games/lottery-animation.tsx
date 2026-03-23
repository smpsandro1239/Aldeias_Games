"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LotteryAnimationProps {
  finalResult: string;
  isSpinning: boolean;
  onFinish?: () => void;
  type?: "number" | "coordinate";
}

export function LotteryAnimation({
  finalResult,
  isSpinning,
  onFinish,
  type = "number",
}: LotteryAnimationProps) {
  const [displayValue, setDisplayValue] = useState("?");
  const [counter, setCounter] = useState(0);

  const getRandomValue = useCallback(() => {
    if (type === "number") {
      return Math.floor(Math.random() * 999).toString().padStart(3, "0");
    } else {
      const letters = ["A", "B", "C", "D", "E"];
      const letter = letters[Math.floor(Math.random() * letters.length)];
      const num = Math.floor(Math.random() * 20) + 1;
      return `${letter}${num}`;
    }
  }, [type]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSpinning) {
      interval = setInterval(() => {
        setDisplayValue(getRandomValue());
        setCounter((prev) => prev + 1);
      }, 80);
    } else if (counter > 0) {
      // Quando para, mostra o resultado final
      setDisplayValue(finalResult);
      if (onFinish) onFinish();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpinning, finalResult, getRandomValue, onFinish, counter]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border-2 border-primary/20 shadow-inner">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayValue}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.05 }}
          className="text-6xl font-black tracking-tighter text-primary drop-shadow-md"
        >
          {displayValue}
        </motion.div>
      </AnimatePresence>
      <div className="mt-4 flex gap-1">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={isSpinning ? { scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] } : {}}
            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
            className="w-2 h-2 rounded-full bg-primary"
          />
        ))}
      </div>
    </div>
  );
}
