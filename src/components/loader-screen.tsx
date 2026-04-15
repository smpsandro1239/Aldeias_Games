"use client";

import { House } from "lucide-react";
import { motion } from "framer-motion";

interface LoaderScreenProps {
  message?: string;
}

export function LoaderScreen({ message = "A Iniciar" }: LoaderScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#110d0c] text-[#eae0de] font-body selection:bg-[#ff734b]/30 overflow-hidden">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
      
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff734b]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9cefff]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="flex flex-col items-center z-20">
        <div className="mb-4">
          <House className="text-[#ff734b] text-5xl" style={{ fontWeight: 200 }} />
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#ff734b] tracking-tight italic">
          Aldeias Games
        </h1>
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#58413b]/30 to-transparent my-6 max-w-lg"></div>
        
        <p className="font-body text-[#e0bfb7] text-sm md:text-base tracking-[0.15em] uppercase font-bold">
          Onde a Tradição, Forja o Presente
        </p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <div className="relative w-32 h-1 bg-[#393432]/20 rounded-full overflow-hidden">
            <div 
              className="digital-loader absolute inset-0 rounded-full shadow-[0_0_15px_rgba(0,218,243,0.4)]"
              style={{
                height: '2px',
                width: '140px',
                background: 'linear-gradient(90deg, transparent, #00daf3, transparent)',
                animation: 'pulse-cyan 3s infinite ease-in-out',
              }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#e0bfb7]/40 font-bold">
            {message}&nbsp;
          </span>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-12 hidden md:block border-l border-[#ff734b]/20 pl-4 py-2">
        <p className="text-[10px] text-[#eae0de]/30 uppercase tracking-[0.2em] leading-relaxed">
          Legado Ancestral<br />Tecnologia Digital
        </p>
      </div>
      <div className="absolute top-12 right-12 hidden md:block">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#9cefff] shadow-[0_0_8px_#00daf3]"></div>
          <span className="text-[10px] text-[#eae0de]/50 uppercase tracking-[0.3em] font-bold">Sistema Ativo</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-cyan {
          0%, 100% { transform: scaleX(0); opacity: 0.3; }
          50% { transform: scaleX(1); opacity: 1; }
        }
        .digital-loader {
          animation: pulse-cyan 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}