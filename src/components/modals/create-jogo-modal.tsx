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

interface CreateJogoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    nome: string;
    tipo: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha";
    descricao?: string;
    preco: number;
    stockInicial: number;
    limitePorUsuario: number;
    eventoId: string;
    configuracao: Record<string, unknown>;
  }) => Promise<void>;
  eventoId: string;
}

export function CreateJogoModal({ open, onOpenChange, onSubmit, eventoId }: CreateJogoModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "rifa" as const,
    descricao: "",
    preco: "",
    stockInicial: "",
    limitePorUsuario: "10",
    numeroInicial: "1",
    numeroFinal: "1000",
  });
  const [loading, setLoading] = useState(false);

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
        };
        break;
    }

    try {
      await onSubmit({
        nome: formData.nome,
        tipo: formData.tipo,
        descricao: formData.descricao || undefined,
        preco: parseFloat(formData.preco),
        stockInicial: parseInt(formData.stockInicial),
        limitePorUsuario: parseInt(formData.limitePorUsuario),
        eventoId,
        configuracao,
      });

      setFormData({
        nome: "",
        tipo: "rifa",
        descricao: "",
        preco: "",
        stockInicial: "",
        limitePorUsuario: "10",
        numeroInicial: "1",
        numeroFinal: "1000",
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Jogo</DialogTitle>
          <DialogDescription>
            Crie um novo jogo para este evento.
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
              <div className="grid grid-cols-2 gap-4">
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A criar..." : "Criar Jogo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
