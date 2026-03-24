"use client";

import { useState, useEffect } from "react";
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
import { Loader2, ShoppingCart, Eye, CheckCircle2, XCircle } from "lucide-react";

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
  onComprar: (quantidade: number, modo: 'sequencial' | 'escolher', numeros?: number[]) => Promise<void>;
  preco: number;
  rifasCompradas?: RifaComprada[];
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
  const [activeTab, setActiveTab] = useState("comprar");
  const [quantidadeRapida, setQuantidadeRapida] = useState<number | 'bloco' | null>(null);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCompra, setLoadingCompra] = useState(false);

  const todosNumeros = Array.from(
    { length: numeroFinal - numeroInicial + 1 },
    (_, i) => numeroInicial + i
  );

  const numerosFiltrados = searchTerm
    ? todosNumeros.filter((n) => n.toString().includes(searchTerm))
    : todosNumeros;

  const numerosDisponiveis = todosNumeros.filter(n => !numerosOcupados.includes(n));
  const blocoSize = 20;
  const totalBlocos = Math.ceil(numerosDisponiveis.length / blocoSize);

  const getBlocoInfo = (blocoIndex: number) => {
    const inicio = blocoIndex * blocoSize;
    const fim = Math.min(inicio + blocoSize, numerosDisponiveis.length);
    const blocosNumeros = numerosDisponiveis.slice(inicio, fim);
    const ocupadosNoBloco = blocosNumeros.filter(n => numerosOcupados.includes(n)).length;
    return {
      inicio: blocosNumeros[0],
      fim: blocosNumeros[blocosNumeros.length - 1],
      total: blocosNumeros.length,
      ocupados: ocupadosNoBloco,
      disponiveis: blocosNumeros.length - ocupadosNoBloco
    };
  };

  const toggleNumero = (numero: number) => {
    if (numerosOcupados.includes(numero)) return;

    if (numerosSelecionados.includes(numero)) {
      setNumerosSelecionados(numerosSelecionados.filter((n) => n !== numero));
    } else {
      setNumerosSelecionados([...numerosSelecionados, numero]);
    }
  };

  const handleCompraRapida = async (quantidade: number | 'bloco') => {
    setLoadingCompra(true);
    try {
      const qtd = quantidade === 'bloco' ? 20 : quantidade;
      await onComprar(qtd, 'sequencial');
      setQuantidadeRapida(null);
    } finally {
      setLoadingCompra(false);
    }
  };

  const handleCompraEscolher = async () => {
    if (numerosSelecionados.length === 0) return;
    setLoadingCompra(true);
    try {
      await onComprar(numerosSelecionados.length, 'escolher', numerosSelecionados);
      setNumerosSelecionados([]);
      onOpenChange(false);
    } finally {
      setLoadingCompra(false);
    }
  };

  const valorTotal = numerosSelecionados.length * preco;

  const rifasPorBloco = (compradas: RifaComprada[]) => {
    const blocos: Record<number, RifaComprada[]> = {};
    compradas.forEach(r => {
      const blocoIndex = Math.floor((r.numero - numeroInicial) / blocoSize);
      if (!blocos[blocoIndex]) blocos[blocoIndex] = [];
      blocos[blocoIndex].push(r);
    });
    return blocos;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Comprar Rifas</DialogTitle>
          <DialogDescription>
            Selecione a quantidade ou escolha números específicos
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="comprar">Comprar</TabsTrigger>
            <TabsTrigger value="minhas">Minhas Rifas ({rifasCompradas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="comprar" className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Opções rápidas */}
            <div className="space-y-2">
              <Label>Compra Rápida</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompraRapida(2)}
                  disabled={loadingCompra || numerosDisponiveis.length < 2}
                >
                  2 Rifas ({(2 * preco).toFixed(2)}€)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompraRapida(5)}
                  disabled={loadingCompra || numerosDisponiveis.length < 5}
                >
                  5 Rifas ({(5 * preco).toFixed(2)}€)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompraRapida(10)}
                  disabled={loadingCompra || numerosDisponiveis.length < 10}
                >
                  10 Rifas ({(10 * preco).toFixed(2)}€)
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleCompraRapida('bloco')}
                  disabled={loadingCompra || numerosDisponiveis.length < 20}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  1 Bloco (20 Rifas - {(20 * preco).toFixed(2)}€)
                </Button>
              </div>
            </div>

            {/* Escolher números manualmente */}
            <div className="border-t pt-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <Label>Escolher Números Específicos</Label>
                <span className="text-sm text-muted-foreground">
                  {numerosSelecionados.length} selecionado(s)
                </span>
              </div>

              <div className="mb-3">
                <Input
                  placeholder="Pesquisar número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-10 gap-1">
                  {numerosFiltrados.map((numero) => {
                    const ocupado = numerosOcupados.includes(numero);
                    const selecionado = numerosSelecionados.includes(numero);

                    return (
                      <button
                        key={numero}
                        onClick={() => toggleNumero(numero)}
                        disabled={ocupado}
                        className={cn(
                          "h-8 rounded text-xs font-medium transition-all",
                          ocupado && "bg-muted text-muted-foreground cursor-not-allowed",
                          !ocupado && !selecionado && "bg-primary/10 hover:bg-primary/20 text-primary",
                          selecionado && "bg-primary text-primary-foreground"
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
                    <span className="text-lg font-bold">{(numerosSelecionados.length * preco).toFixed(2)}€</span>
                    <Button
                      onClick={handleCompraEscolher}
                      disabled={loadingCompra}
                    >
                      {loadingCompra ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comprar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="minhas" className="flex-1 overflow-y-auto space-y-3">
            {rifasCompradas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Ainda não comprou rifas</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total: {rifasCompradas.length} rifas compradas
                  </span>
                </div>
                
                {Object.entries(rifasPorBloco(rifasCompradas)).map(([blocoIdx, Rifas]) => {
                  const idx = parseInt(blocoIdx);
                  const info = getBlocoInfo(idx);
                  return (
                    <Card key={blocoIdx} className="border-l-4 border-l-primary">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">
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