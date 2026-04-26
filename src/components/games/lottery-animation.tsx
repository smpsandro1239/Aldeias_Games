"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [showResult, setShowResult] = useState(false);

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
      setShowResult(false);
      interval = setInterval(() => {
        setDisplayValue(getRandomValue());
        setCounter((prev) => prev + 1);
      }, 60);
    } else if (counter > 0) {
      setDisplayValue(finalResult);
      setShowResult(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpinning, finalResult, getRandomValue, onFinish, counter]);

  return (
    <div className="relative flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />
      
      <div className="relative z-10 w-full">
        <div className="flex justify-center mb-6">
          {isSpinning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="p-4 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.5)]"
            >
              <Sparkles className="w-8 h-8 text-foreground" />
            </motion.div>
          ) : showResult ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="p-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full shadow-[0_0_40px_rgba(251,191,36,0.6)]"
            >
              <Trophy className="w-8 h-8 text-foreground" />
            </motion.div>
          ) : null}
        </div>

        <div className="relative bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 shadow-2xl border-2 border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEwIDBoMTB2MTBIMTB6TTAgMTBoMTB2MTBIMHoiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-30" />
          
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

          <AnimatePresence mode="wait">
            <motion.div
              key={displayValue}
              initial={isSpinning ? { y: 30, opacity: 0, rotateX: -30 } : false}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              exit={{ y: -30, opacity: 0, rotateX: 30 }}
              transition={{ duration: 0.1 }}
              className={cn(
                "text-7xl md:text-8xl font-black tracking-wider text-center",
                isSpinning
                  ? "text-foreground/80 drop-shadow-lg"
                  : showResult
                  ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(251,191,36,0.8)]"
                  : "text-foreground"
              )}
            >
              {displayValue}
            </motion.div>
          </AnimatePresence>

          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-1/2"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      delay: i * 0.15,
                    }}
                    className="w-2 h-2 rounded-full bg-yellow-400"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-center mt-6">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={
                isSpinning
                  ? {
                      scale: [1, 1.8, 1],
                      opacity: [0.2, 1, 0.2],
                      x: [0, (i % 2 === 0 ? 1 : -1) * 10],
                    }
                  : showResult
                  ? {
                      scale: [1, 1.5],
                      opacity: [0.5, 1],
                    }
                  : {}
              }
              transition={{
                repeat: isSpinning ? Infinity : 0,
                duration: isSpinning ? 0.8 : 0.5,
                delay: i * 0.1,
              }}
              className={cn(
                "w-3 h-3 rounded-full mx-1",
                isSpinning
                  ? "bg-accent"
                  : showResult
                  ? "bg-yellow-400"
                  : "bg-foreground/30"
              )}
            />
          ))}
        </div>

        {!isSpinning && !showResult && (
          <p className="text-center text-foreground/50 text-sm mt-4">
            A sortear...
          </p>
        )}

        {showResult && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-foreground/80 text-lg font-bold mt-4"
          >
            <Star className="w-5 h-5 inline mr-2 text-primary" />
            Resultado Final!
          </motion.p>
        )}
      </div>
    </div>
  );
}