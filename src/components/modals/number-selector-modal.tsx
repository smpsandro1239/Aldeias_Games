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
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Ticket, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroInicial: number;
  numeroFinal: number;
  numerosOcupados: number[];
  numerosSelecionados: number[];
  onSelect: (numeros: number[]) => void;
  onConfirm: () => void;
  onConfirmWithPayment?: () => void;
  preco: number;
  saldoDisponivel?: number;
  onMBWayPayment?: (telefone: string) => Promise<void>;
  onSaldoPayment?: () => Promise<void>;
}

export function NumberSelectorModal({
  open,
  onOpenChange,
  numeroInicial,
  numeroFinal,
  numerosOcupados,
  numerosSelecionados,
  onSelect,
  onConfirm,
  preco,
  saldoDisponivel = 0,
  onMBWayPayment,
  onSaldoPayment,
  onConfirmWithPayment,
}: NumberSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const todosNumeros = useMemo(() => {
    return Array.from(
      { length: numeroFinal - numeroInicial + 1 },
      (_, i) => numeroInicial + i
    );
  }, [numeroInicial, numeroFinal]);

  const numerosFiltrados = useMemo(() => {
    if (!searchTerm) return todosNumeros;
    const term = searchTerm.toLowerCase();
    return todosNumeros.filter((n) => n.toString().includes(term));
  }, [todosNumeros, searchTerm]);

  const numerosDisponiveis = useMemo(() => {
    return numerosFiltrados.filter((n) => !numerosOcupados.includes(n));
  }, [numerosFiltrados, numerosOcupados]);

  const toggleNumero = (numero: number) => {
    if (numerosOcupados.includes(numero)) return;

    if (numerosSelecionados.includes(numero)) {
      onSelect(numerosSelecionados.filter((n) => n !== numero));
    } else {
      onSelect([...numerosSelecionados, numero]);
    }
  };

  const valorTotal = numerosSelecionados.length * preco;

  const getNumeroColor = (numero: number) => {
    if (numerosOcupados.includes(numero)) return "ocupado";
    if (numerosSelecionados.includes(numero)) return "selecionado";
    return "disponivel";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col p-0">
        <div className="relative bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 p-6 pb-4">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEwIDBoMTB2MTBIMTB6TTAgMTBoMTB2MTBIMHoiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-30" />

          <DialogHeader className="relative text-center text-white mb-4">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-center mb-2"
            >
              <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm border border-white/20">
                <Ticket className="w-8 h-8 text-pink-400" />
              </div>
            </motion.div>
            <DialogTitle className="text-2xl font-black tracking-wide text-white drop-shadow-lg">
              SELECIONE OS SEUS NÚMEROS
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Escolha os números da sua sorte!
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Pesquisar número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-pink-500"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-slate-50 dark:bg-slate-900">
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
              <AnimatePresence mode="popLayout">
                {numerosFiltrados.map((numero) => {
                  const status = getNumeroColor(numero);
                  return (
                    <motion.button
                      key={numero}
                      layout
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileHover={status !== "ocupado" ? { scale: 1.1 } : {}}
                      whileTap={status !== "ocupado" ? { scale: 0.95 } : {}}
                      onClick={() => toggleNumero(numero)}
                      disabled={status === "ocupado"}
                      className={cn(
                        "h-12 rounded-xl text-sm font-bold transition-all shadow-sm",
                        status === "ocupado" && "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-2 border-slate-300 dark:border-slate-700",
                        status === "disponivel" && "bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900 hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500",
                        status === "selecionado" && "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-2 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                      )}
                    >
                      <span className={cn(
                        "relative",
                        status === "selecionado" && "after:content-['✓'] after:absolute after:-top-1 after:-right-1 after:text-xs after:bg-white after:rounded-full after:p-0.5"
                      )}>
                        {numero}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400">Selecionados</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <XCircle className="w-3 h-3 text-slate-400" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400">Ocupados</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-5 h-5 rounded-lg bg-white border-2 border-slate-200 dark:bg-slate-800 dark:border-slate-700" />
                  <span className="text-slate-600 dark:text-slate-400">Disponíveis</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {numerosSelecionados.length} número(s)
                </span>
                <motion.div
                  key={valorTotal}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-black text-lg shadow-lg"
                >
                  {valorTotal.toFixed(2)}€
                </motion.div>
              </div>
            </div>

            {numerosSelecionados.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-2 mb-2"
              >
                {numerosSelecionados.slice(0, 12).map((n) => (
                  <motion.span
                    key={n}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-lg shadow-md"
                  >
                    #{n}
                  </motion.span>
                ))}
                {numerosSelecionados.length > 12 && (
                  <span className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg">
                    +{numerosSelecionados.length - 12}
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
              onClick={onConfirmWithPayment || onConfirm}
              disabled={numerosSelecionados.length === 0}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {onConfirmWithPayment ? "Escolher Pagamento" : `Confirmar (${valorTotal.toFixed(2)}€)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}