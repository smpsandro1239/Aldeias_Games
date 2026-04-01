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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Trophy, Percent, Euro, Info } from "lucide-react";

interface Premio {
  id: string;
  nome: string;
  valorDinheiroAlternative: number;
  percentagem: number;
}

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
    percentagem?: number;
    ordem: number;
  }>;
  custoQuadrado?: number;
  valorMercadoVaca?: number;
  valorCompraVaca?: number;
  dimensoesCampo?: string;
  permitirStripe?: boolean;
}

interface CreateJogoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JogoData) => Promise<void>;
  eventoId: string;
  initialData?: JogoData;
}

export function CreateJogoModal({ open, onOpenChange, onSubmit, eventoId, initialData }: CreateJogoModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "rifa" as "poio_da_vaca" | "rifa" | "tombola" | "raspadinha",
    descricao: "",
    preco: "2",
    stockInicial: "100",
    limitePorUsuario: "10",
    numeroInicial: "1",
    numeroFinal: "1000",
    modoSorteio: "app" as "app" | "externo",
    detalhesSorteioExterno: "",
    raspadinhaTitulo: "RASPADINHA DA SORTE",
    raspadinhaSubtitulo: "Raspe com o dedo para revelar o seu prémio!",
    raspadinhaOrganizacao: "",
    dimensoesX: "10",
    dimensoesY: "10",
    custoQuadrado: "5",
    valorMercadoVaca: "1000",
    valorCompraVaca: "800",
    dataSorteio: "",
    horaSorteio: "",
    localSorteio: "",
    numeroBlocos: "1",
    permitirStripe: false,
    valorPremios: "",
  });

  const [premios, setPremios] = useState<Premio[]>([
    { id: "1", nome: "", valorDinheiroAlternative: 0, percentagem: 0 },
  ]);

  const [rashadinhaPremios, setRaspadinhaPremios] = useState<Premio[]>([
    { id: "1", nome: "3x Presunto", valorDinheiroAlternative: 50, percentagem: 2 },
    { id: "2", nome: "3x Tabua de Queijos", valorDinheiroAlternative: 25, percentagem: 5 },
    { id: "3", nome: "Valor da Raspadinha", valorDinheiroAlternative: 2, percentagem: 10 },
  ]);

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        nome: initialData.nome || "",
        tipo: initialData.tipo || "rifa",
        descricao: initialData.descricao || "",
        preco: initialData.preco?.toString() || "2",
        stockInicial: initialData.stockInicial?.toString() || "100",
        limitePorUsuario: initialData.limitePorUsuario?.toString() || "10",
        numeroInicial: "1",
        numeroFinal: "1000",
        modoSorteio: initialData.modoSorteio || "app",
        detalhesSorteioExterno: initialData.detalhesSorteioExterno || "",
        raspadinhaTitulo: "RASPADINHA DA SORTE",
        raspadinhaSubtitulo: "Raspe com o dedo para revelar o seu prémio!",
        raspadinhaOrganizacao: "",
        dimensoesX: "10",
        dimensoesY: "10",
        custoQuadrado: "5",
        valorMercadoVaca: "1000",
        valorCompraVaca: "800",
        dataSorteio: "",
        horaSorteio: "",
        localSorteio: "",
        numeroBlocos: "1",
        permitirStripe: false,
        valorPremios: "",
      });
    } else if (!open) {
      setFormData({
        nome: "",
        tipo: "rifa",
        descricao: "",
        preco: "2",
        stockInicial: "100",
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
        dataSorteio: "",
        horaSorteio: "",
        localSorteio: "",
        numeroBlocos: "1",
        permitirStripe: false,
        valorPremios: "",
      });
      setRaspadinhaPremios([
        { id: "1", nome: "3x Presunto", valorDinheiroAlternative: 50, percentagem: 2 },
        { id: "2", nome: "3x Tabua de Queijos", valorDinheiroAlternative: 25, percentagem: 5 },
        { id: "3", nome: "Valor da Raspadinha", valorDinheiroAlternative: 2, percentagem: 10 },
      ]);
    }
  }, [initialData, open]);

  const preco = parseFloat(formData.preco) || 0;
  const totalPercentagem = rashadinhaPremios.reduce((acc, p) => acc + p.percentagem, 0);
  const lucroMinimo = 100 - totalPercentagem;
  
  const custoMedioPrevisto = rashadinhaPremios.reduce((acc, p) => {
    return acc + (p.valorDinheiroAlternative * p.percentagem / 100);
  }, 0);
  
  const lucroPrevisto = preco - custoMedioPrevisto;
  const lucroPercentagem = preco > 0 ? (lucroPrevisto / preco) * 100 : 0;
  const isLucrativo = lucroMinimo >= 50;

  const handlePremioChange = (id: string, field: keyof Premio, value: string | number) => {
    setRaspadinhaPremios(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const adicionarPremio = () => {
    setRaspadinhaPremios(prev => [
      ...prev,
      { id: Date.now().toString(), nome: "", valorDinheiroAlternative: 0, percentagem: 0 }
    ]);
  };

  const removerPremio = (id: string) => {
    if (rashadinhaPremios.length > 1) {
      setRaspadinhaPremios(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const config: Record<string, unknown> = {
        numeroInicial: parseInt(formData.numeroInicial) || 1,
        numeroFinal: parseInt(formData.numeroFinal) || 1000,
        modoSorteio: formData.modoSorteio,
        detalhesSorteioExterno: formData.detalhesSorteioExterno,
      };

      if (formData.tipo === "rifa" || formData.tipo === "tombola") {
        config.dataSorteio = formData.dataSorteio;
        config.horaSorteio = formData.horaSorteio;
        config.localSorteio = formData.localSorteio;
        config.numeroBlocos = parseInt(formData.numeroBlocos) || 1;
        config.permitirStripe = formData.permitirStripe;
        config.valorPremios = formData.valorPremios ? parseFloat(formData.valorPremios) : null;
      }

      if (formData.tipo === "poio_da_vaca") {
        config.dimensoesX = parseInt(formData.dimensoesX) || 10;
        config.dimensoesY = parseInt(formData.dimensoesY) || 10;
        config.custoQuadrado = parseFloat(formData.custoQuadrado) || 5;
        config.valorMercadoVaca = parseFloat(formData.valorMercadoVaca) || 1000;
        config.valorCompraVaca = parseFloat(formData.valorCompraVaca) || 800;
      }

      if (formData.tipo === "raspadinha") {
        config.titulo = formData.raspadinhaTitulo;
        config.subtitulo = formData.raspadinhaSubtitulo;
        config.organizacao = formData.raspadinhaOrganizacao;
        config.premios = rashadinhaPremios.filter(p => p.nome.trim() && p.valorDinheiroAlternative > 0);
        config.lucroMinimo = lucroMinimo;
        config.lucroPrevisto = lucroPrevisto;
      }

      const jogoData: JogoData = {
        nome: formData.nome,
        tipo: formData.tipo,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco) || 0,
        stockInicial: parseInt(formData.stockInicial) || 100,
        limitePorUsuario: parseInt(formData.limitePorUsuario) || 10,
        eventoId,
        configuracao: config,
        modoSorteio: formData.modoSorteio,
        detalhesSorteioExterno: formData.detalhesSorteioExterno,
        premios: rashadinhaPremios
          .filter(p => p.nome.trim() && p.valorDinheiroAlternative > 0)
          .map((p, idx) => ({
            nome: p.nome,
            valorDinheiroAlternative: p.valorDinheiroAlternative,
            percentagem: p.percentagem,
            ordem: idx
          }))
      };

      await onSubmit(jogoData);
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

            {formData.tipo === "raspadinha" && (
              <div className="border-t pt-4 mt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Configuração da Raspadinha</h3>
                  <Badge variant={isLucrativo ? "default" : "destructive"} className={isLucrativo ? "bg-green-500" : ""}>
                    {isLucrativo ? `${lucroMinimo}% lucro mínimo` : "Lucre baixo!"}
                  </Badge>
                </div>

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

                <div className="bg-[#1f1b19] rounded-xl p-4 space-y-4 border border-[#ff734b]/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[#ff734b]">Prémios e Percentagens</h4>
                    <Button type="button" variant="outline" size="sm" onClick={adicionarPremio}>
                      + Adicionar Prémio
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {rashadinhaPremios.map((premio, index) => (
                      <div key={premio.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-[#2e2928] rounded-lg">
                        <div className="col-span-1 flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-[#ff734b]" />
                        </div>
                        <div className="col-span-4">
                          <Input
                            placeholder="Nome do prémio"
                            value={premio.nome}
                            onChange={(e) => handlePremioChange(premio.id, "nome", e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-3">
                          <div className="relative">
                            <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="Valor"
                              value={premio.valorDinheiroAlternative || ""}
                              onChange={(e) => handlePremioChange(premio.id, "valorDinheiroAlternative", parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm pl-7"
                            />
                          </div>
                        </div>
                        <div className="col-span-3">
                          <div className="relative">
                            <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="%"
                              min="0"
                              max="50"
                              value={premio.percentagem || ""}
                              onChange={(e) => handlePremioChange(premio.id, "percentagem", parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm pl-7"
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {rashadinhaPremios.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
                              onClick={() => removerPremio(premio.id)}
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#58413b]/30 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total de percentagem:</span>
                      <span className={`font-bold ${totalPercentagem > 50 ? "text-red-500" : "text-green-500"}`}>
                        {totalPercentagem}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lucro mínimo garantido:</span>
                      <span className={`font-bold ${isLucrativo ? "text-green-500" : "text-red-500"}`}>
                        {lucroMinimo}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Custo médio por bilhete:</span>
                      <span className="font-bold text-[#ff734b]">
                        {custoMedioPrevisto.toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lucro médio por bilhete:</span>
                      <span className={`font-bold ${lucroPrevisto >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {lucroPrevisto.toFixed(2)}€ ({lucroPercentagem.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Receita total (100 bilhetes):</span>
                      <span className="font-bold">
                        {(preco * 100).toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Custo total prémios estimado:</span>
                      <span className="font-bold text-[#ff734b]">
                        {(custoMedioPrevisto * 100).toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-[#58413b]/30">
                      <span className="text-[#ff734b]">Lucro estimado:</span>
                      <span className={`${lucroPrevisto >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {(lucroPrevisto * 100).toFixed(2)}€
                      </span>
                    </div>

                    {totalPercentagem > 50 && (
                      <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-2">
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-500">
                          A percentagem total não pode exceder 50%. Reduza as percentagens dos prémios.
                        </p>
                      </div>
                    )}

                    {isLucrativo && (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <p className="text-xs text-green-500">
                          Jogo lucrativo! Lucro mínimo garantido de {lucroMinimo}%.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(formData.tipo === "rifa" || formData.tipo === "tombola") && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stockInicial">Total de Números</Label>
                    <Input
                      id="stockInicial"
                      type="number"
                      min="1"
                      value={formData.stockInicial}
                      onChange={(e) => setFormData({ ...formData, stockInicial: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="limitePorUsuario">Máx. por Cliente</Label>
                    <Input
                      id="limitePorUsuario"
                      type="number"
                      min="1"
                      value={formData.limitePorUsuario}
                      onChange={(e) => setFormData({ ...formData, limitePorUsuario: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dataSorteio">Data do Sorteio</Label>
                  <Input
                    id="dataSorteio"
                    type="date"
                    value={formData.dataSorteio || ""}
                    onChange={(e) => setFormData({ ...formData, dataSorteio: e.target.value })}
                  />
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
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (formData.tipo === "raspadinha" && totalPercentagem > 50)}
            >
              {loading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Jogo")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
