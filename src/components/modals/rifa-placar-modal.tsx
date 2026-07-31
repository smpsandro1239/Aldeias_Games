"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, ShoppingCart, Eye, CheckCircle2, XCircle, Trash2, Ticket } from "lucide-react";

// Constants for purchase modes to avoid magic strings
const PURCHASE_MODES = {
  SEQUENCIAL: 'sequencial',
  ESCOLHER: 'escolher'
} as const;

type PurchaseMode = typeof PURCHASE_MODES[keyof typeof PURCHASE_MODES];

// Constants for tab values
const TAB_VALUES = {
  COMPRAR: 'comprar',
  MINHAS: 'minhas'
} as const;

type TabValue = typeof TAB_VALUES[keyof typeof TAB_VALUES];

// Constants for block size and validation
const GAME_CONSTANTS = {
  BLOCO_SIZE: 20,
  MIN_QUANTIDADE: 1,
  MAX_QUANTIDADE_RAPIDA: 10,
} as const;

interface RifaComprada {
  id: string;
  numero: number;
  jogoId: string;
  createdAt: string;
}

interface RifaPlacarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroInicial: number;
  numeroFinal: number;
  numerosOcupados: number[];
  rifasCompradas?: RifaComprada[];
  onComprar: (quantidade: number, modo: PurchaseMode, numeros?: number[]) => Promise<void>;
  preco: number;
  loading?: boolean;
}

export function RifaPlacarModal({
  open,
  onOpenChange,
  numeroInicial,
  numeroFinal,
  numerosOcupados,
  rifasCompradas = [],
  onComprar,
  preco,
  loading = false,
}: RifaPlacarModalProps) {
  const [activeTab, setActiveTab] = useState<TabValue>(TAB_VALUES.COMPRAR);
  const [quantidadeRapida, setQuantidadeRapida] = useState<number | 'bloco' | null>(null);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCompra, setLoadingCompra] = useState(false);

  // Cálculos memoizados
  const todosNumeros = useMemo(() => Array.from(
    { length: numeroFinal - numeroInicial + 1 },
    (_, i) => numeroInicial + i
  ), [numeroInicial, numeroFinal]);

  const numerosFiltrados = useMemo(() =>
    searchTerm
      ? todosNumeros.filter((n) => n.toString().includes(searchTerm))
      : todosNumeros,
    [todosNumeros, searchTerm]
  );

  const numerosDisponiveis = useMemo(() =>
    todosNumeros.filter(n => !numerosOcupados.includes(n)),
    [todosNumeros, numerosOcupados]
  );

  const totalBlocos = useMemo(() =>
    Math.ceil(numerosDisponiveis.length / GAME_CONSTANTS.BLOCO_SIZE),
    [numerosDisponiveis.length]
  );

  const getBlocoInfo = useCallback((blocoIndex: number) => {
    const inicio = blocoIndex * GAME_CONSTANTS.BLOCO_SIZE;
    const fim = Math.min(inicio + GAME_CONSTANTS.BLOCO_SIZE, numerosDisponiveis.length);
    const blocosNumeros = numerosDisponiveis.slice(inicio, fim);
    const ocupadosNoBloco = blocosNumeros.filter(n => numerosOcupados.includes(n)).length;
    return {
      inicio: blocosNumeros[0],
      fim: blocosNumeros[blocosNumeros.length - 1],
      total: blocosNumeros.length,
      ocupados: ocupadosNoBloco,
      disponiveis: blocosNumeros.length - ocupadosNoBloco
    };
  }, [numerosDisponiveis, numerosOcupados]);

  const valorTotal = useMemo(() => numerosSelecionados.length * preco, [numerosSelecionados.length, preco]);

  // Handlers
  const toggleNumero = useCallback((numero: number) => {
    if (numerosOcupados.includes(numero)) return;

    setNumerosSelecionados(prev =>
      prev.includes(numero)
        ? prev.filter((n) => n !== numero)
        : [...prev, numero]
    );
  }, [numerosOcupados]);

  const handleCompraRapida = useCallback(async (quantidade: number | 'bloco') => {
    setLoadingCompra(true);
    try {
      const qtd = quantidade === 'bloco' ? GAME_CONSTANTS.BLOCO_SIZE : quantidade;
      await onComprar(qtd, PURCHASE_MODES.SEQUENCIAL);
      setQuantidadeRapida(null);
    } finally {
      setLoadingCompra(false);
    }
  }, [onComprar]);

  const handleCompraEscolher = useCallback(async () => {
    if (numerosSelecionados.length === 0) return;
    setLoadingCompra(true);
    try {
      await onComprar(numerosSelecionados.length, PURCHASE_MODES.ESCOLHER, numerosSelecionados);
      setNumerosSelecionados([]);
      onOpenChange(false);
    } finally {
      setLoadingCompra(false);
    }
  }, [numerosSelecionados, onComprar, onOpenChange]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const limparSelecao = useCallback(() => {
    setNumerosSelecionados([]);
  }, []);

  const rifasPorBloco = useMemo(() => {
    const blocos: Record<number, RifaComprada[]> = {};
    rifasCompradas.forEach(r => {
      const blocoIndex = Math.floor((r.numero - numeroInicial) / GAME_CONSTANTS.BLOCO_SIZE);
      if (!blocos[blocoIndex]) blocos[blocoIndex] = [];
      blocos[blocoIndex].push(r);
    });
    return blocos;
  }, [rifasCompradas, numeroInicial]);

  const getNumeroAriaLabel = useCallback((numero: number) => {
    const ocupado = numerosOcupados.includes(numero);
    const selecionado = numerosSelecionados.includes(numero);

    if (ocupado) return `Número ${numero}, ocupado`;
    if (selecionado) return `Número ${numero}, selecionado. Pressione novamente para desmarcar`;
    return `Número ${numero}, disponível. Pressione para selecionar`;
  }, [numerosOcupados, numerosSelecionados]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="rifa-placar-description">
        <DialogHeader className="bg-gradient-to-r from-rose-600/10 via-pink-600/10 to-fuchsia-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-rose-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-rose-600/20 p-2 rounded-lg">
              <Ticket className="h-5 w-5 text-rose-600" />
            </div>
            Comprar Rifas
          </DialogTitle>
          <DialogDescription id="rifa-placar-description">
            Selecione a quantidade ou escolha números específicos
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2" aria-label="Opções de rifa">
            <TabsTrigger value={TAB_VALUES.COMPRAR} aria-label="Comprar rifas">
              Comprar
            </TabsTrigger>
            <TabsTrigger value={TAB_VALUES.MINHAS} aria-label={`Ver minhas rifas (${rifasCompradas.length})`}>
              Minhas Rifas ({rifasCompradas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comprar" className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Opções rápidas */}
            <div className="space-y-2">
              <Label>Compra Rápida</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompraRapida(2)}
                  disabled={loadingCompra || numerosDisponiveis.length < 2}
                  aria-label="Comprar 2 rifas sequenciais"
                >
                  2 (€{(2 * preco).toFixed(2)})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompraRapida(5)}
                  disabled={loadingCompra || numerosDisponiveis.length < 5}
                  aria-label="Comprar 5 rifas sequenciais"
                >
                  5 (€{(5 * preco).toFixed(2)})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompraRapida(10)}
                  disabled={loadingCompra || numerosDisponiveis.length < 10}
                  aria-label="Comprar 10 rifas sequenciais"
                >
                  10 (€{(10 * preco).toFixed(2)})
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleCompraRapida('bloco')}
                  disabled={loadingCompra || numerosDisponiveis.length < GAME_CONSTANTS.BLOCO_SIZE}
                  aria-label={`Comprar 1 bloco de ${GAME_CONSTANTS.BLOCO_SIZE} rifas`}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" aria-hidden="true" />
                  1 Bloco ({GAME_CONSTANTS.BLOCO_SIZE} Rifas - {(GAME_CONSTANTS.BLOCO_SIZE * preco).toFixed(2)}€)
                </Button>
              </div>
            </div>

            {/* Escolher números manualmente */}
            <div className="border-t pt-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Label>Escolher Números Específicos</Label>
                <span className="text-sm text-muted-foreground" aria-live="polite">
                  {numerosSelecionados.length} selecionado(s)
                </span>
              </div>

              <div className="mb-3">
                <Input
                  placeholder="Pesquisar número..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  aria-label="Pesquisar números de rifa"
                />
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-4 text-xs mb-2" role="legend">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-primary rounded" aria-hidden="true"></div>
                  <span>Selecionado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-surface-container-low rounded border border-outline-variant/30" aria-hidden="true"></div>
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-surface-container-highest rounded" aria-hidden="true"></div>
                  <span>Ocupado</span>
                </div>
              </div>

              {/* Botão Limpar */}
              {numerosSelecionados.length > 0 && (
                <button
                  type="button"
                  onClick={limparSelecao}
                  className="text-xs text-red-400 flex items-center gap-1 mb-2"
                  aria-label="Limpar seleção de números"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                  Limpar seleção
                </button>
              )}

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1" role="grid" aria-label="Seleção de números de rifa">
                  {numerosFiltrados.map((numero) => {
                    const occupied = numerosOcupados.includes(numero);
                    const selected = numerosSelecionados.includes(numero);

                    return (
                      <button
                        key={numero}
                        type="button"
                        onClick={() => toggleNumero(numero)}
                        disabled={occupied}
                        aria-label={getNumeroAriaLabel(numero)}
                        aria-pressed={selected}
                        role="gridcell"
                        tabIndex={occupied ? -1 : 0}
                        className={cn(
                          "h-8 rounded text-xs font-medium transition-all",
                          occupied && "bg-surface-container-highest text-outline-variant/50 cursor-not-allowed line-through",
                          !occupied && !selected && "bg-surface-container-low border border-outline-variant/30 hover:bg-primary/20 text-muted-foreground",
                          selected && "bg-primary text-primary-foreground font-bold"
                        )}
                      >
                        {numero}
                      </button>
                    );
                  })}
                </div>
              </div>

              {numerosSelecionados.length > 0 && (
                <div className="border-t pt-3 mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {numerosSelecionados.length} rifas selecionadas
                    </span>
                    <div className="text-xs text-muted-foreground mt-1">
                      {numerosSelecionados.slice(0, 5).join(", ")}
                      {numerosSelecionados.length > 5 && `... +${numerosSelecionados.length - 5}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold" aria-label={`Valor total: ${valorTotal.toFixed(2)} euros`}>
                      {valorTotal.toFixed(2)}€
                    </span>
                    <Button
                      type="button"
                      onClick={handleCompraEscolher}
                      disabled={loadingCompra}
                      aria-label="Confirmar compra dos números selecionados"
                    >
                      {loadingCompra ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Comprar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="minhas" className="flex-1 overflow-y-auto space-y-3">
            {rifasCompradas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                <p>Ainda não comprou rifas</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total: {rifasCompradas.length} rifas compradas
                  </span>
                </div>

                {Object.entries(rifasPorBloco).map(([blocoIdx, Rifas]) => {
                  const idx = parseInt(blocoIdx);
                  const info = getBlocoInfo(idx);
                  return (
                    <Card key={blocoIdx} className="border-l-4 border-l-primary">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" aria-label={`Bloco ${idx + 1} com números de ${info.inicio} a ${info.fim}`}>
                            Bloco {idx + 1} (#{info.inicio}-{info.fim})
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {Rifas.length} rifa(s)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {Rifas.map(r => (
                            <span
                              key={r.id}
                              className="inline-flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary text-sm font-medium"
                              aria-label={`Rifa número ${r.numero}`}
                            >
                              {r.numero}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}