"use client";

import { useState, useCallback, useMemo, useReducer } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3X3, Layers, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/audio-utils";

// Constants for game modes to avoid magic strings
const GAME_MODES = {
  INDIVIDUAL: 'individual',
  CARTAO: 'cartao'
} as const;

type GameMode = typeof GAME_MODES[keyof typeof GAME_MODES];

// Constants for selection states
const SELECTION_STATES = {
  AVAILABLE: 'available',
  SELECTED: 'selected',
  OCCUPIED: 'occupied',
  PLAYED_BY_USER: 'played_by_user'
} as const;

type SelectionState = typeof SELECTION_STATES[keyof typeof SELECTION_STATES];

// Haptic feedback helper
const hapticFeedback = useCallback((duration: number = 10): void => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate?.(duration);
    } catch {
      // Ignorar erros de haptic feedback
    }
  }
}, []);

interface NumeroCoordenada {
  letra: string;
  numero: number;
}

interface NumeroOcupado extends NumeroCoordenada {}

interface NumeroJogado extends NumeroCoordenada {}

interface PoioDaVacaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letras: string[];
  numerosPorLetra: number;
  numerosOcupados: NumeroOcupado[];
  numerosJogados?: NumeroJogado[];
  precoIndividual: number;
  precoCartao: number;
  onSelect: (selecao: NumeroCoordenada[]) => void;
  onConfirm: () => void;
  onConfirmWithPayment?: () => void;
  saldoDisponivel?: number;
  onMBWayPayment?: (telefone: string) => Promise<void>;
  onSaldoPayment?: () => Promise<void>;
}

// Reducer actions
type Action =
  | { type: 'SET_SELECAO'; payload: NumeroCoordenada[] }
  | { type: 'SET_MODO'; payload: GameMode }
  | { type: 'SET_LETRA_ATIVA'; payload: string }
  | { type: 'SET_VER_PAINEL_COMPLETO'; payload: boolean }
  | { type: 'RESET_SELECAO' };

// Initial state
const getInitialState = (letras: string[]) => ({
  selecao: [] as NumeroCoordenada[],
  modo: GAME_MODES.INDIVIDUAL as GameMode,
  letraAtiva: letras[0] || 'A',
  verPainelCompleto: false,
});

// Reducer
function poioDaVacaReducer(state: ReturnType<typeof getInitialState>, action: Action): ReturnType<typeof getInitialState> {
  switch (action.type) {
    case 'SET_SELECAO':
      return { ...state, selecao: action.payload };
    case 'SET_MODO':
      return { ...state, modo: action.payload };
    case 'SET_LETRA_ATIVA':
      return { ...state, letraAtiva: action.payload };
    case 'SET_VER_PAINEL_COMPLETO':
      return { ...state, verPainelCompleto: action.payload };
    case 'RESET_SELECAO':
      return { ...state, selecao: [] };
    default:
      return state;
  }
}

export function PoioDaVacaModal({
  open,
  onOpenChange,
  letras,
  numerosPorLetra,
  numerosOcupados,
  numerosJogados,
  precoIndividual,
  precoCartao,
  onSelect,
  onConfirm,
  onConfirmWithPayment,
  saldoDisponivel = 0,
  onMBWayPayment,
  onSaldoPayment,
}: PoioDaVacaModalProps) {
  const [state, dispatch] = useReducer(poioDaVacaReducer, getInitialState(letras));

  // Hook customizado para verificar estado dos números
  const useNumeroState = useCallback((letra: string, numero: number): SelectionState => {
    if (numerosJogados?.some(j => j.letra === letra && j.numero === numero)) {
      return SELECTION_STATES.PLAYED_BY_USER;
    }
    if (numerosOcupados.some(o => o.letra === letra && o.numero === numero)) {
      return SELECTION_STATES.OCCUPIED;
    }
    if (state.selecao.some(s => s.letra === letra && s.numero === numero)) {
      return SELECTION_STATES.SELECTED;
    }
    return SELECTION_STATES.AVAILABLE;
  }, [numerosOcupados, numerosJogados, state.selecao]);

  const isOcupado = useCallback((letra: string, numero: number) => {
    return useNumeroState(letra, numero) === SELECTION_STATES.OCCUPIED;
  }, [useNumeroState]);

  const isJogadoPorMim = useCallback((letra: string, numero: number) => {
    return useNumeroState(letra, numero) === SELECTION_STATES.PLAYED_BY_USER;
  }, [useNumeroState]);

  const isSelecionado = useCallback((letra: string, numero: number) => {
    return useNumeroState(letra, numero) === SELECTION_STATES.SELECTED;
  }, [useNumeroState]);

  const toggleNumero = useCallback((letra: string, numero: number) => {
    if (isOcupado(letra, numero) || isJogadoPorMim(letra, numero)) return;

    if (state.modo === GAME_MODES.CARTAO) {
      const numerosDaLetra = Array.from({ length: numerosPorLetra }, (_, i) => i + 1);
      const cartaoCompleto = numerosDaLetra.map((n) => ({ letra, numero: n }));

      const cartaoSelecionado = state.selecao.filter((s) => s.letra === letra);
      if (cartaoSelecionado.length === numerosPorLetra) {
        dispatch({ type: 'SET_SELECAO', payload: state.selecao.filter((s) => s.letra !== letra) });
        playSound('click');
      } else {
        dispatch({ type: 'SET_SELECAO', payload: [...state.selecao.filter((s) => s.letra !== letra), ...cartaoCompleto] });
        playSound('success');
        hapticFeedback(8);
      }
    } else {
      if (isSelecionado(letra, numero)) {
        dispatch({ type: 'SET_SELECAO', payload: state.selecao.filter((s) => !(s.letra === letra && s.numero === numero)) });
        playSound('click');
      } else {
        dispatch({ type: 'SET_SELECAO', payload: [...state.selecao, { letra, numero }] });
        playSound('success');
        hapticFeedback(8);
      }
    }
  }, [state.modo, state.selecao, numerosPorLetra, isOcupado, isJogadoPorMim, isSelecionado]);

  const getNumeroAriaLabel = useCallback((letra: string, numero: number): string => {
    const estado = useNumeroState(letra, numero);

    switch (estado) {
      case SELECTION_STATES.PLAYED_BY_USER:
        return `Número ${letra}${numero}, já jogado por si`;
      case SELECTION_STATES.OCCUPIED:
        return `Número ${letra}${numero}, ocupado`;
      case SELECTION_STATES.SELECTED:
        return `Número ${letra}${numero}, selecionado. Pressione novamente para desmarcar`;
      default:
        return `Número ${letra}${numero}, disponível`;
    }
  }, [useNumeroState]);

  const getValorTotal = useCallback(() => {
    if (state.modo === GAME_MODES.CARTAO) {
      const cartoesCompletos = letras.filter((l) => {
        const nums = state.selecao.filter((s) => s.letra === l);
        return nums.length === numerosPorLetra;
      }).length;
      return cartoesCompletos * precoCartao;
    }
    return state.selecao.length * precoIndividual;
  }, [state.modo, state.selecao, letras, numerosPorLetra, precoCartao, precoIndividual]);

  const handleConfirm = useCallback(() => {
    onSelect(state.selecao);
    if (onConfirmWithPayment) {
      onConfirmWithPayment();
    } else {
      onConfirm();
    }
    dispatch({ type: 'RESET_SELECAO' });
  }, [state.selecao, onSelect, onConfirmWithPayment, onConfirm]);

  const cartaoCompletoAtual = useMemo(() => {
    const numsLetra = state.selecao.filter((s) => s.letra === state.letraAtiva);
    return numsLetra.length === numerosPorLetra;
  }, [state.selecao, state.letraAtiva, numerosPorLetra]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="relative bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 p-6 pb-4">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-30" />

          <DialogHeader className="relative text-center text-foreground mb-4">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-center mb-2"
            >
              <div className="p-3 bg-foreground/10 rounded-full backdrop-blur-sm border border-white/20">
                <Grid3X3 className="w-8 h-8 text-emerald-400" />
              </div>
            </motion.div>
            <DialogTitle className="text-2xl font-black tracking-wide text-foreground drop-shadow-lg">
              POIO DA VACA
            </DialogTitle>
            <DialogDescription className="text-foreground/70">
              Selecione as coordenadas do seu jogo
            </DialogDescription>
          </DialogHeader>

          <div className="relative flex justify-center">
            <Tabs value={state.modo} onValueChange={(v) => dispatch({ type: 'SET_MODO', payload: v as GameMode })}>
              <TabsList className="bg-foreground/10 backdrop-blur-sm border border-white/20">
                <TabsTrigger
                  value={GAME_MODES.INDIVIDUAL}
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-foreground"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Individual
                  <span className="ml-2 text-xs opacity-70">({precoIndividual.toFixed(2)}€)</span>
                </TabsTrigger>
                <TabsTrigger
                  value={GAME_MODES.CARTAO}
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-foreground"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Cartão Completo
                  <span className="ml-2 text-xs opacity-70">({precoCartao.toFixed(2)}€)</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: 'SET_VER_PAINEL_COMPLETO', payload: !state.verPainelCompleto })}
              className="bg-foreground dark:bg-slate-800"
              aria-pressed={state.verPainelCompleto}
              aria-label={state.verPainelCompleto ? "Alternar para visualização por letra" : "Alternar para visualização completa do painel"}
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              {state.verPainelCompleto ? "Ver por Letra" : "Ver Painel Completo"}
            </Button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {state.verPainelCompleto ? (
              <div className="flex-1 overflow-y-auto space-y-3">
                {letras.map((letra) => (
                  <motion.div
                    key={letra}
                    layout
                    className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 bg-foreground dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        Letra {letra}
                      </span>
                      {state.selecao.filter((s) => s.letra === letra).length === numerosPorLetra && (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                          Cartão completo
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-10 gap-1.5">
                      {Array.from({ length: numerosPorLetra }, (_, i) => i + 1).map((numero) => {
                        const ocupado = isOcupado(letra, numero);
                        const jogadoPorMim = isJogadoPorMim(letra, numero);
                        const selecionado = isSelecionado(letra, numero);
                        const disabled = ocupado || jogadoPorMim;

                        return (
                          <motion.button
                            key={numero}
                            whileHover={!disabled ? { scale: 1.15 } : {}}
                            whileTap={!disabled ? { scale: 0.9 } : {}}
                            onClick={() => toggleNumero(letra, numero)}
                            disabled={disabled}
                            className={cn(
                              "h-10 rounded-xl text-xs font-bold transition-all shadow-sm",
                              jogadoPorMim && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-not-allowed border-2 border-green-400",
                              ocupado && !jogadoPorMim && "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed border-2 border-slate-300 dark:border-slate-600",
                              !disabled && !selecionado && "bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400",
                              selecionado && "bg-gradient-to-r from-emerald-500 to-teal-600 text-foreground border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                            )}
                          >
                            {letra}{numero}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
                  {letras.map((letra) => {
                    const isComplete = state.selecao.filter((s) => s.letra === letra).length === numerosPorLetra;
                    return (
                      <motion.button
                        key={letra}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => dispatch({ type: 'SET_LETRA_ATIVA', payload: letra })}
                        className={cn(
                          "min-w-[50px] h-12 rounded-xl font-black text-sm transition-all border-2",
                          state.letraAtiva === letra
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-foreground border-emerald-400 shadow-lg shadow-emerald-500/30"
                            : isComplete
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-400"
                            : "bg-foreground dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                        )}
                        aria-pressed={state.letraAtiva === letra}
                        aria-label={`Selecionar letra ${letra}${isComplete ? ' - cartão completo' : ''}`}
                      >
                        {letra}
                        {isComplete && <CheckCircle className="w-3 h-3 ml-1 inline" aria-hidden="true" />}
                      </motion.button>
                    );
                  })}
                </div>

                 <div className="flex-1 overflow-y-auto">
                    <div
                      className="grid grid-cols-5 sm:grid-cols-8 gap-2"
                      role="grid"
                      aria-label={`Números da letra ${state.letraAtiva}`}
                    >
                    <AnimatePresence mode="popLayout">
                      {Array.from({ length: numerosPorLetra }, (_, i) => i + 1).map((numero) => {
                        const estado = useNumeroState(state.letraAtiva, numero);
                        const ocupado = estado === SELECTION_STATES.OCCUPIED;
                        const jogadoPorMim = estado === SELECTION_STATES.PLAYED_BY_USER;
                        const selecionado = estado === SELECTION_STATES.SELECTED;
                        const disabled = ocupado || jogadoPorMim;

                        return (
                          <motion.button
                            key={numero}
                            whileHover={!disabled ? { scale: 1.15 } : {}}
                            whileTap={!disabled ? { scale: 0.9 } : {}}
                            onClick={() => toggleNumero(state.letraAtiva, numero)}
                            disabled={disabled}
                            aria-label={getNumeroAriaLabel(state.letraAtiva, numero)}
                            aria-pressed={selecionado}
                            aria-disabled={disabled}
                            tabIndex={disabled ? -1 : 0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleNumero(state.letraAtiva, numero);
                              }
                            }}
                            className={cn(
                              "h-14 rounded-2xl text-base font-bold transition-all shadow-md",
                              jogadoPorMim && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-not-allowed border-2 border-green-500",
                              ocupado && !jogadoPorMim && "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed border-2 border-slate-300 dark:border-slate-600",
                              !disabled && !selecionado && "bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:shadow-emerald-500/20",
                              selecionado && "bg-gradient-to-r from-emerald-500 to-teal-600 text-foreground border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                            )}
                          >
                            <span className="relative">
                              {state.letraAtiva}{numero}
                              {selecionado && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1"
                                >
                                  <CheckCircle className="w-4 h-4 text-foreground" />
                                </motion.span>
                              )}
                            </span>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400">Os meus números</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <XCircle className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400">Ocupados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-foreground border-2 border-slate-200 dark:bg-slate-800 dark:border-slate-700" />
                  <span className="text-slate-600 dark:text-slate-400">Disponíveis</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {state.selecao.length} seleção(ões)
                </span>
                <motion.div
                  key={getValorTotal()}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-foreground font-black text-lg shadow-lg"
                  aria-label={`Valor total: ${getValorTotal().toFixed(2)} euros`}
                >
                  {getValorTotal().toFixed(2)}€
                </motion.div>
              </div>
            </div>

            {state.selecao.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
                role="list"
                aria-label="Números selecionados"
              >
                {state.selecao.slice(0, 16).map((s, i) => (
                  <motion.span
                    key={`${s.letra}${s.numero}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-foreground text-xs font-bold rounded-lg shadow-md"
                    role="listitem"
                    aria-label={`Número selecionado: ${s.letra}${s.numero}`}
                  >
                    {s.letra}{s.numero}
                  </motion.span>
                ))}
                {state.selecao.length > 16 && (
                  <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg" aria-label={`Mais ${state.selecao.length - 16} números selecionados`}>
                    +{state.selecao.length - 16}
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-foreground dark:bg-slate-950">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                playSound('success');
                hapticFeedback(20);
                handleConfirm();
              }}
              disabled={state.selecao.length === 0}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-foreground font-bold shadow-lg hover:shadow-xl transition-all"
              aria-label={`Confirmar seleção de ${state.selecao.length} números por ${getValorTotal().toFixed(2)} euros`}
            >
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              Confirmar ({getValorTotal().toFixed(2)}€)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}