"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScratchCardGrid } from './scratch-card-grid';
import { Card } from '@/components/ui/card';

interface GameData {
  nome: string;
  descricao?: string;
  logo?: string;
  eventos: any[];
}

export const RaspadinhaGameView: React.FC<{ data: GameData }> = ({ data }) => {
  const [balance] = useState(124.50);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isWinner, setIsWinner] = useState(false);

  const prizes = ["€50.00", "€50.00", "€50.00", "€5.00", "€10.00", "€5.00", "€2.00", "€100.00", "€5.00"];

  const handleReveal = () => {
    setRevealedCount(prev => {
      const next = prev + 1;
      if (next === 9) setIsWinner(true);
      return next;
    });
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen overflow-x-hidden selection:bg-secondary selection:text-surface relative">
      <div className="fixed inset-0 bg-tile-pattern pointer-events-none z-0"></div>

      {/* Top Navigation */}
      <header className="flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50 bg-[#2b2421]/60 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">menu</span>
          <h1 className="font-headline text-xl font-bold tracking-tight text-primary italic font-black text-2xl" style={{ fontFamily: 'Noto Serif' }}>
            {data.nome}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-surface-container-lowest px-4 py-1.5 rounded-full flex items-center gap-2 outline outline-1 outline-outline-variant/20 shadow-inner">
            <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>wallet</span>
            <span className="text-sm font-bold tracking-wide">€{balance.toFixed(2)}</span>
          </div>
          <button className="material-symbols-outlined text-on-surface-variant hover:text-secondary transition-colors">
            volume_up
          </button>
        </div>
      </header>

      <main className="relative z-10 px-6 pt-8 pb-32 max-w-5xl mx-auto">
        <section className="mb-16">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-2/3">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-tertiary/10 text-tertiary text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full">Série Ouro</span>
                <h2 className="font-headline text-3xl font-black italic tracking-tight text-on-surface">Ouro de Portugal</h2>
              </div>

              {/* Scratch Card Area */}
              <div className="relative group aspect-[4/3] w-full bg-surface-container rounded-[2rem] p-4 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 border-[12px] border-surface-container-high/50 rounded-[2rem] pointer-events-none"></div>
                <div className="h-full w-full bg-gradient-to-br from-surface-container-high to-surface-container-highest rounded-[1.5rem] relative p-8">
                  <div className="grid grid-cols-3 gap-4 w-full h-full">
                    {prizes.map((prize, idx) => (
                      <ScratchCardGrid key={idx} prize={prize} onComplete={handleReveal} />
                    ))}
                  </div>

                  {/* Winner Modal */}
                  <AnimatePresence>
                    {isWinner && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card px-8 py-6 rounded-3xl text-center border border-secondary/30 shadow-[0_0_50px_rgba(0,218,243,0.2)]"
                      >
                        <h3 className="text-secondary font-black text-2xl tracking-tighter italic uppercase mb-1 leading-none">Ganhou!</h3>
                        <p className="text-on-surface font-headline text-4xl font-black">€50.00</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Sidebar Controls */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
              <div className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/5">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Prémio Máximo</p>
                <h4 className="text-4xl font-black font-headline text-primary mb-6">€25.000</h4>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                    <span className="text-sm text-on-surface-variant">Custo do Bilhete</span>
                    <span className="text-sm font-bold">€2.00</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                    <span className="text-sm text-on-surface-variant">Probabilidades</span>
                    <span className="text-sm font-bold">1 em 3.4</span>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-br from-[#ff734b] to-[#fc5929] text-on-primary font-bold py-4 rounded-2xl shadow-[0_10px_30px_rgba(255,115,75,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span>Comprar Outra</span>
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container p-4 rounded-3xl flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-secondary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant leading-tight">Último Ganho</span>
                  <span className="text-xs font-black">€5.00</span>
                </div>
                <div className="bg-surface-container p-4 rounded-3xl flex flex-col items-center justify-center text-center">
                  <span className="material-symbols-outlined text-tertiary mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant leading-tight">Ranking</span>
                  <span className="text-xs font-black">#24</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section>
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="font-headline text-2xl font-bold">Explorar Raspadinhas</h2>
            <a className="text-secondary text-sm font-bold uppercase tracking-widest hover:underline" href="#">Ver Todas</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-surface-container-high rounded-[2.5rem] overflow-hidden border-none">
              <div className="h-40 bg-orange-900/20 relative"></div>
              <div className="p-6">
                <span className="bg-inverse-on-surface text-on-surface text-[9px] font-black uppercase px-2 py-0.5 rounded-sm mb-2 inline-block">Bronze</span>
                <h3 className="font-headline text-xl font-bold mb-4">Tesouro da Vila</h3>
                <div className="flex justify-between items-center">
                  <span className="text-primary font-bold">€1.00</span>
                  <button className="bg-surface-variant hover:bg-surface-bright text-on-surface-variant p-2 rounded-xl">
                    <span className="material-symbols-outlined">shopping_bag</span>
                  </button>
                </div>
              </div>
            </Card>
            {/* Add more cards similar to above */}
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-3 pb-8 bg-[#1e1816]/80 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.4)] rounded-t-[2rem]">
        <NavButton icon="home" label="Início" />
        <NavButton icon="layers" label="Raspadinhas" active />
        <NavButton icon="confirmation_number" label="Rifas" />
        <NavButton icon="person" label="Perfil" />
      </nav>
    </div>
  );
};

const NavButton = ({ icon, label, active = false }: { icon: string, label: string, active?: boolean }) => (
  <a className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 duration-200 ${active ? 'bg-gradient-to-br from-[#ff734b] to-[#fc5929] text-white rounded-2xl shadow-[0_0_15px_rgba(255,115,75,0.4)]' : 'text-[#b4a9a3] hover:text-secondary'}`} href="#">
    <span className="material-symbols-outlined">{icon}</span>
    <span className="font-body text-[10px] font-bold uppercase tracking-widest mt-1">{label}</span>
  </a>
);
