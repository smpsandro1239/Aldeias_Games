"use client";

import { useState, useMemo } from "react";
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

interface PoioDaVacaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letras: string[];
  numerosPorLetra: number;
  numerosOcupados: { letra: string; numero: number }[];
  numerosJogados?: { letra: string; numero: number }[];
  precoIndividual: number;
  precoCartao: number;
  onSelect: (selecao: { letra: string; numero: number }[]) => void;
  onConfirm: () => void;
  onConfirmWithPayment?: () => void;
  saldoDisponivel?: number;
  onMBWayPayment?: (telefone: string) => Promise<void>;
  onSaldoPayment?: () => Promise<void>;
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
  const [selecao, setSelecao] = useState<{ letra: string; numero: number }[]>([]);
  const [modo, setModo] = useState<"individual" | "cartao">("individual");
  const [letraAtiva, setLetraAtiva] = useState(letras[0]);
  const [verPainelCompleto, setVerPainelCompleto] = useState(false);

  const isOcupado = (letra: string, numero: number) => {
    return numerosOcupados.some((o) => o.letra === letra && o.numero === numero);
  };

  const isJogadoPorMim = (letra: string, numero: number) => {
    if (!numerosJogados) return false;
    return numerosJogados.some(
      (j: { letra: string; numero: number }) =>
        j.letra === letra && j.numero === numero
    );
  };

  const isSelecionado = (letra: string, numero: number) => {
    return selecao.some((s) => s.letra === letra && s.numero === numero);
  };

  const toggleNumero = (letra: string, numero: number) => {
    if (isOcupado(letra, numero) || isJogadoPorMim(letra, numero)) return;

    if (modo === "cartao") {
      const numerosDaLetra = Array.from({ length: numerosPorLetra }, (_, i) => i + 1);
      const cartaoCompleto = numerosDaLetra.map((n) => ({ letra, numero: n }));

      const cartaoSelecionado = selecao.filter((s) => s.letra === letra);
      if (cartaoSelecionado.length === numerosPorLetra) {
        setSelecao(selecao.filter((s) => s.letra !== letra));
      } else {
        setSelecao([...selecao.filter((s) => s.letra !== letra), ...cartaoCompleto]);
      }
    } else {
      if (isSelecionado(letra, numero)) {
        setSelecao(selecao.filter((s) => !(s.letra === letra && s.numero === numero)));
      } else {
        setSelecao([...selecao, { letra, numero }]);
      }
    }
  };

  const getValorTotal = () => {
    if (modo === "cartao") {
      const cartoesCompletos = letras.filter((l) => {
        const nums = selecao.filter((s) => s.letra === l);
        return nums.length === numerosPorLetra;
      }).length;
      return cartoesCompletos * precoCartao;
    }
    return selecao.length * precoIndividual;
  };

  const handleConfirm = () => {
    onSelect(selecao);
    if (onConfirmWithPayment) {
      onConfirmWithPayment();
    } else {
      onConfirm();
    }
    setSelecao([]);
  };

  const cartaoCompletoAtual = useMemo(() => {
    const numsLetra = selecao.filter((s) => s.letra === letraAtiva);
    return numsLetra.length === numerosPorLetra;
  }, [selecao, letraAtiva, numerosPorLetra]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="relative bg-gradient-to-br from-emerald-950 via-teal-900 to-cyan-950 p-6 pb-4">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-30" />

          <DialogHeader className="relative text-center text-white mb-4">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-center mb-2"
            >
              <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                <Grid3X3 className="w-8 h-8 text-emerald-400" />
              </div>
            </motion.div>
            <DialogTitle className="text-2xl font-black tracking-wide text-white drop-shadow-lg">
              POIO DA VACA
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Selecione as coordenadas do seu jogo
            </DialogDescription>
          </DialogHeader>

          <div className="relative flex justify-center">
            <Tabs value={modo} onValueChange={(v) => setModo(v as "individual" | "cartao")}>
              <TabsList className="bg-white/10 backdrop-blur-sm border border-white/20">
                <TabsTrigger
                  value="individual"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Individual
                  <span className="ml-2 text-xs opacity-70">({precoIndividual.toFixed(2)}€)</span>
                </TabsTrigger>
                <TabsTrigger
                  value="cartao"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
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
              onClick={() => setVerPainelCompleto(!verPainelCompleto)}
              className="bg-white dark:bg-slate-800"
            >
              <Grid3X3 className="w-4 h-4 mr-2" />
              {verPainelCompleto ? "Ver por Letra" : "Ver Painel Completo"}
            </Button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {verPainelCompleto ? (
              <div className="flex-1 overflow-y-auto space-y-3">
                {letras.map((letra) => (
                  <motion.div
                    key={letra}
                    layout
                    className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        Letra {letra}
                      </span>
                      {selecao.filter((s) => s.letra === letra).length === numerosPorLetra && (
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
                              selecionado && "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-2 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
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
                    const isComplete = selecao.filter((s) => s.letra === letra).length === numerosPorLetra;
                    return (
                      <motion.button
                        key={letra}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLetraAtiva(letra)}
                        className={cn(
                          "min-w-[50px] h-12 rounded-xl font-black text-sm transition-all border-2",
                          letraAtiva === letra
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30"
                            : isComplete
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-400"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                        )}
                      >
                        {letra}
                        {isComplete && <CheckCircle className="w-3 h-3 ml-1 inline" />}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                    <AnimatePresence mode="popLayout">
                      {Array.from({ length: numerosPorLetra }, (_, i) => i + 1).map((numero) => {
                        const ocupado = isOcupado(letraAtiva, numero);
                        const jogadoPorMim = isJogadoPorMim(letraAtiva, numero);
                        const selecionado = isSelecionado(letraAtiva, numero);
                        const disabled = ocupado || jogadoPorMim;

                        return (
                          <motion.button
                            key={numero}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={!disabled ? { scale: 1.1 } : {}}
                            whileTap={!disabled ? { scale: 0.9 } : {}}
                            onClick={() => toggleNumero(letraAtiva, numero)}
                            disabled={disabled}
                            className={cn(
                              "h-14 rounded-2xl text-base font-bold transition-all shadow-md",
                              jogadoPorMim && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-not-allowed border-2 border-green-500",
                              ocupado && !jogadoPorMim && "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed border-2 border-slate-300 dark:border-slate-600",
                              !disabled && !selecionado && "bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:shadow-emerald-500/20",
                              selecionado && "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                            )}
                          >
                            <span className="relative">
                              {letraAtiva}{numero}
                              {selecionado && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1"
                                >
                                  <CheckCircle className="w-4 h-4 text-white" />
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
                  <div className="w-5 h-5 rounded-lg bg-white border-2 border-slate-200 dark:bg-slate-800 dark:border-slate-700" />
                  <span className="text-slate-600 dark:text-slate-400">Disponíveis</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {selecao.length} seleção(ões)
                </span>
                <motion.div
                  key={getValorTotal()}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-black text-lg shadow-lg"
                >
                  {getValorTotal().toFixed(2)}€
                </motion.div>
              </div>
            </div>

            {selecao.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2"
              >
                {selecao.slice(0, 16).map((s, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-lg shadow-md"
                  >
                    {s.letra}{s.numero}
                  </motion.span>
                ))}
                {selecao.length > 16 && (
                  <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg">
                    +{selecao.length - 16}
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selecao.length === 0}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Confirmar ({getValorTotal().toFixed(2)}€)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}