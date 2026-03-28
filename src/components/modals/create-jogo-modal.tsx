"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JogoData {
  id?: string;
  nome: string;
  tipo: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha";
  descricao?: string;
  preco: number;
  stockInicial: number;
  limitePorUsuario: number;
  eventoId: string;
  configuracao: Record<string, unknown>;
  modoSorteio?: "app" | "externo";
  detalhesSorteioExterno?: string;
  premios?: Array<{
    nome: string;
    descricao?: string;
    valorDinheiroAlternative?: number;
    ordem: number;
  }>;
  custoQuadrado?: number;
  valorMercadoVaca?: number;
  valorCompraVaca?: number;
  dimensoesCampo?: string;
}

interface CreateJogoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JogoData) => Promise<void>;
  eventoId: string;
  initialData?: JogoData;
}

import { useEffect } from "react";

export function CreateJogoModal({ open, onOpenChange, onSubmit, eventoId, initialData }: CreateJogoModalProps) {
  const [formData, setFormData] = useState<{
    nome: string;
    tipo: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha";
    descricao: string;
    preco: string;
    stockInicial: string;
    limitePorUsuario: string;
    numeroInicial: string;
    numeroFinal: string;
    modoSorteio: "app" | "externo";
    detalhesSorteioExterno: string;
    raspadinhaTitulo: string;
    raspadinhaSubtitulo: string;
    raspadinhaOrganizacao: string;
    // Poio da Vaca
    dimensoesX: string;
    dimensoesY: string;
    custoQuadrado: string;
    valorMercadoVaca: string;
    valorCompraVaca: string;
  }>({
    nome: "",
    tipo: "rifa",
    descricao: "",
    preco: "",
    stockInicial: "",
    limitePorUsuario: "10",
    numeroInicial: "1",
    numeroFinal: "1000",
    modoSorteio: "app",
    detalhesSorteioExterno: "",
    raspadinhaTitulo: "RASPADINHA DA SORTE",
    raspadinhaSubtitulo: "Raspe com o dedo para revelar o seu prémio!",
    raspadinhaOrganizacao: "",
    dimensoesX: "10",
    dimensoesY: "10",
    custoQuadrado: "5",
    valorMercadoVaca: "1000",
    valorCompraVaca: "800",
  });

  const [premios, setPremios] = useState<Array<{
    nome: string;
    descricao: string;
    valorDinheiroAlternative: string;
    ordem: number;
  }>>([{ nome: "", descricao: "", valorDinheiroAlternative: "", ordem: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        nome: initialData.nome || "",
        tipo: initialData.tipo || "rifa",
        descricao: initialData.descricao || "",
        preco: initialData.preco ? String(initialData.preco) : "",
        stockInicial: initialData.stockInicial ? String(initialData.stockInicial) : "",
        limitePorUsuario: initialData.limitePorUsuario ? String(initialData.limitePorUsuario) : "10",
        numeroInicial: initialData.configuracao?.numeroInicial ? String(initialData.configuracao.numeroInicial) : "1",
        numeroFinal: initialData.configuracao?.numeroFinal ? String(initialData.configuracao.numeroFinal) : "1000",
        modoSorteio: initialData.modoSorteio || "app",
        detalhesSorteioExterno: initialData.detalhesSorteioExterno || "",
        raspadinhaTitulo: (initialData.configuracao?.raspadinhaTitulo as string) || "RASPADINHA DA SORTE",
        raspadinhaSubtitulo: (initialData.configuracao?.raspadinhaSubtitulo as string) || "Raspe com o dedo para revelar o seu prémio!",
        raspadinhaOrganizacao: (initialData.configuracao?.raspadinhaOrganizacao as string) || "",
        dimensoesX: (initialData as any).dimensoesCampo ? JSON.parse((initialData as any).dimensoesCampo).x : "10",
        dimensoesY: (initialData as any).dimensoesCampo ? JSON.parse((initialData as any).dimensoesCampo).y : "10",
        custoQuadrado: (initialData as any).custoQuadrado ? String((initialData as any).custoQuadrado) : "5",
        valorMercadoVaca: (initialData as any).valorMercadoVaca ? String((initialData as any).valorMercadoVaca) : "1000",
        valorCompraVaca: (initialData as any).valorCompraVaca ? String((initialData as any).valorCompraVaca) : "800",
      });
      if (initialData.premios && initialData.premios.length > 0) {
        setPremios(initialData.premios.map(p => ({
          nome: p.nome,
          descricao: p.descricao || "",
          valorDinheiroAlternative: p.valorDinheiroAlternative ? String(p.valorDinheiroAlternative) : "",
          ordem: p.ordem,
        })));
      } else {
        setPremios([{ nome: "", descricao: "", valorDinheiroAlternative: "", ordem: 0 }]);
      }
    } else if (!open) {
      setFormData({
        nome: "",
        tipo: "rifa",
        descricao: "",
        preco: "",
        stockInicial: "",
        limitePorUsuario: "10",
        numeroInicial: "1",
        numeroFinal: "1000",
        modoSorteio: "app",
        detalhesSorteioExterno: "",
        raspadinhaTitulo: "RASPADINHA DA SORTE",
        raspadinhaSubtitulo: "Raspe com o dedo para revelar o seu prémio!",
        raspadinhaOrganizacao: "",
        dimensoesX: "10",
        dimensoesY: "10",
        custoQuadrado: "5",
        valorMercadoVaca: "1000",
        valorCompraVaca: "800",
      });
      setPremios([{ nome: "", descricao: "", valorDinheiroAlternative: "", ordem: 0 }]);
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let configuracao: Record<string, unknown> = {};

    switch (formData.tipo) {
      case "rifa":
      case "tombola":
        configuracao = {
          numeroInicial: parseInt(formData.numeroInicial),
          numeroFinal: parseInt(formData.numeroFinal),
        };
        break;
      case "poio_da_vaca":
        configuracao = {
          letras: ["A", "B", "C", "D", "E"],
          numerosPorLetra: 20,
          precos: { individual: parseFloat(formData.preco), cartao: parseFloat(formData.preco) * 4 },
        };
        break;
      case "raspadinha":
        configuracao = {
          premios: [
            { nome: "€100", tipo: "dinheiro", percentagem: 0.01, valor: 100 },
            { nome: "€50", tipo: "dinheiro", percentagem: 0.02, valor: 50 },
            { nome: "€20", tipo: "dinheiro", percentagem: 0.05, valor: 20 },
            { nome: "€10", tipo: "dinheiro", percentagem: 0.1, valor: 10 },
            { nome: "€5", tipo: "dinheiro", percentagem: 0.2, valor: 5 },
          ],
          semPremioPercentagem: 0.62,
          raspadinhaTitulo: formData.raspadinhaTitulo || "RASPADINHA DA SORTE",
          raspadinhaSubtitulo: formData.raspadinhaSubtitulo || "Raspe com o dedo para revelar o seu prémio!",
          raspadinhaOrganizacao: formData.raspadinhaOrganizacao || "",
        };
        break;
    }

    try {
      const jogoData: JogoData = {
        id: initialData?.id,
        nome: formData.nome,
        tipo: formData.tipo,
        descricao: formData.descricao || undefined,
        preco: parseFloat(formData.preco) || 0,
        stockInicial: parseInt(formData.stockInicial) || 0,
        limitePorUsuario: parseInt(formData.limitePorUsuario) || 0,
        eventoId,
        configuracao,
        modoSorteio: formData.modoSorteio,
        detalhesSorteioExterno: formData.detalhesSorteioExterno || undefined,
        premios: premios.filter(p => p.nome).map(p => ({
          nome: p.nome,
          descricao: p.descricao || undefined,
          valorDinheiroAlternative: p.valorDinheiroAlternative ? parseFloat(p.valorDinheiroAlternative) : undefined,
          ordem: p.ordem,
        })),
      };

      if (formData.tipo === "poio_da_vaca") {
        jogoData.custoQuadrado = parseFloat(formData.custoQuadrado) || 5;
        jogoData.valorMercadoVaca = parseFloat(formData.valorMercadoVaca) || 1000;
        jogoData.valorCompraVaca = parseFloat(formData.valorCompraVaca) || 800;
        jogoData.dimensoesCampo = JSON.stringify({
          x: parseInt(formData.dimensoesX) || 10,
          y: parseInt(formData.dimensoesY) || 10,
          total: (parseInt(formData.dimensoesX) || 10) * (parseInt(formData.dimensoesY) || 10)
        });
      }

      await onSubmit(jogoData);

      if (!initialData) {
        setFormData({
          nome: "",
          tipo: "rifa",
          descricao: "",
          preco: "",
          stockInicial: "",
          limitePorUsuario: "10",
          numeroInicial: "1",
          numeroFinal: "1000",
          modoSorteio: "app",
          detalhesSorteioExterno: "",
          raspadinhaTitulo: "RASPADINHA DA SORTE",
          raspadinhaSubtitulo: "Raspe com o dedo para revelar o seu prémio!",
          raspadinhaOrganizacao: "",
          dimensoesX: "10",
          dimensoesY: "10",
          custoQuadrado: "5",
          valorMercadoVaca: "1000",
          valorCompraVaca: "800",
        });
        setPremios([{ nome: "", descricao: "", valorDinheiroAlternative: "", ordem: 0 }]);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Jogo" : "Novo Jogo"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Edite as informações do jogo." : "Crie um novo jogo para este evento."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Jogo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha") =>
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rifa">Rifa</SelectItem>
                  <SelectItem value="tombola">Tombola</SelectItem>
                  <SelectItem value="poio_da_vaca">Poio da Vaca</SelectItem>
                  <SelectItem value="raspadinha">Raspadinha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Jogo *</Label>
              <Input
                id="nome"
                placeholder="Ex: Rifa da Festa"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o jogo..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={2}
              />
            </div>

            {(formData.tipo === "rifa" || formData.tipo === "tombola") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="numeroInicial">Número Inicial</Label>
                  <Input
                    id="numeroInicial"
                    type="number"
                    min="0"
                    value={formData.numeroInicial}
                    onChange={(e) => setFormData({ ...formData, numeroInicial: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="numeroFinal">Número Final</Label>
                  <Input
                    id="numeroFinal"
                    type="number"
                    min="1"
                    value={formData.numeroFinal}
                    onChange={(e) => setFormData({ ...formData, numeroFinal: e.target.value })}
                  />
                </div>
              </div>
            )}

            {formData.tipo === "raspadinha" && (
              <div className="border-t pt-4 mt-2 space-y-4">
                <h3 className="text-sm font-semibold">Personalização da Raspadinha</h3>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="raspadinhaTitulo">Título</Label>
                    <Input
                      id="raspadinhaTitulo"
                      placeholder="Ex: RASPADINHA DA FESTA"
                      value={formData.raspadinhaTitulo}
                      onChange={(e) => setFormData({ ...formData, raspadinhaTitulo: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="raspadinhaSubtitulo">Subtítulo</Label>
                    <Input
                      id="raspadinhaSubtitulo"
                      placeholder="Ex: Raspe com o dedo para revelar o seu prémio!"
                      value={formData.raspadinhaSubtitulo}
                      onChange={(e) => setFormData({ ...formData, raspadinhaSubtitulo: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="raspadinhaOrganizacao">Nome da Organização/Freguesia</Label>
                    <Input
                      id="raspadinhaOrganizacao"
                      placeholder="Ex: Junta de Freguesia de Vila Verde"
                      value={formData.raspadinhaOrganizacao}
                      onChange={(e) => setFormData({ ...formData, raspadinhaOrganizacao: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.tipo === "poio_da_vaca" && (
              <div className="border-t pt-4 mt-2 space-y-4">
                <h3 className="text-sm font-semibold">Configuração do Poio da Vaca</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dimensoesX">Largura (X)</Label>
                    <Input
                      id="dimensoesX"
                      type="number"
                      min="2"
                      max="20"
                      value={formData.dimensoesX}
                      onChange={(e) => setFormData({ ...formData, dimensoesX: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dimensoesY">Altura (Y)</Label>
                    <Input
                      id="dimensoesY"
                      type="number"
                      min="2"
                      max="20"
                      value={formData.dimensoesY}
                      onChange={(e) => setFormData({ ...formData, dimensoesY: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="custoQuadrado">Custo por Quadrado (€)</Label>
                  <Input
                    id="custoQuadrado"
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.custoQuadrado}
                    onChange={(e) => setFormData({ ...formData, custoQuadrado: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valorMercadoVaca">Valor de Mercado da Vaca (€)</Label>
                  <Input
                    id="valorMercadoVaca"
                    type="number"
                    min="0"
                    value={formData.valorMercadoVaca}
                    onChange={(e) => setFormData({ ...formData, valorMercadoVaca: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valorCompraVaca">Valor de Compra da Vaca (€)</Label>
                  <Input
                    id="valorCompraVaca"
                    type="number"
                    min="0"
                    value={formData.valorCompraVaca}
                    onChange={(e) => setFormData({ ...formData, valorCompraVaca: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="preco">Preço (€) *</Label>
                <Input
                  id="preco"
                  type="number"
                  min="0.5"
                  step="0.01"
                  placeholder="2.00"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stock">Stock Inicial *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="1"
                  placeholder="1000"
                  value={formData.stockInicial}
                  onChange={(e) => setFormData({ ...formData, stockInicial: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="limite">Limite por Utilizador</Label>
              <Input
                id="limite"
                type="number"
                min="1"
                value={formData.limitePorUsuario}
                onChange={(e) => setFormData({ ...formData, limitePorUsuario: e.target.value })}
              />
            </div>

            <div className="border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold mb-3">Configuração de Sorteio</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Método de Sorteio</Label>
                  <Select
                    value={formData.modoSorteio}
                    onValueChange={(value: "app" | "externo") =>
                      setFormData({ ...formData, modoSorteio: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">Sorteio Seguro pela App</SelectItem>
                      <SelectItem value="externo">Sorteio Externo (ex: EuroMilhões)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.modoSorteio === "externo" && (
                  <div className="grid gap-2">
                    <Label htmlFor="detalhesSorteio">Detalhes do Sorteio Externo</Label>
                    <Input
                      id="detalhesSorteio"
                      placeholder="Ex: 1º número do EuroMilhões de sexta-feira"
                      value={formData.detalhesSorteioExterno}
                      onChange={(e) => setFormData({ ...formData, detalhesSorteioExterno: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Prémios</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPremios([...premios, { nome: "", descricao: "", valorDinheiroAlternative: "", ordem: premios.length }])}
                >
                  Adicionar Prémio
                </Button>
              </div>
              <div className="grid gap-4">
                {premios.map((premio, index) => (
                  <div key={index} className="grid gap-3 p-3 border rounded-lg relative bg-muted/30">
                    <div className="grid gap-2">
                      <Label className="text-xs">Prémio {index + 1}</Label>
                      <Input
                        placeholder="Ex: Presunto"
                        value={premio.nome}
                        onChange={(e) => {
                          const newPremios = [...premios];
                          newPremios[index].nome = e.target.value;
                          setPremios(newPremios);
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Ou em Dinheiro? (€)</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 25.00"
                        value={premio.valorDinheiroAlternative}
                        onChange={(e) => {
                          const newPremios = [...premios];
                          newPremios[index].valorDinheiroAlternative = e.target.value;
                          setPremios(newPremios);
                        }}
                      />
                    </div>
                    {premios.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 text-destructive"
                        onClick={() => setPremios(premios.filter((_, i) => i !== index))}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Jogo")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
