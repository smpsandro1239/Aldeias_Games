"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  User as UserIcon, 
  Smartphone, 
  CreditCard, 
  Banknote,
  Minus,
  Plus,
  ArrowRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface POSViewProps {
  jogos: any[];
  onSell: (data: any) => Promise<void>;
  loading?: boolean;
}

export function POSView({ jogos, onSell, loading }: POSViewProps) {
  const [selectedJogo, setSelectedJogo] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [step, setStep] = useState(1); // 1: Select Jogo, 2: Config, 3: Client Info
  const [cliente, setCliente] = useState({ nome: "", telefone: "", email: "" });
  const [metodo, setMetodo] = useState<any>("dinheiro");

  const handleNext = () => {
    if (step === 1 && selectedJogo) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleFinish = async () => {
    await onSell({
      jogoId: selectedJogo.id,
      quantidade,
      metodoPagamento: metodo,
      dadosCliente: cliente.nome ? cliente : undefined,
    });
    // Reset
    setStep(1);
    setSelectedJogo(null);
    setQuantidade(1);
    setCliente({ nome: "", telefone: "", email: "" });
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Progresso */}
      <div className="flex justify-between items-center px-2">
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 w-8 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} 
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Passo {step} de 3
        </span>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-2 gap-3">
          {jogos.map((jogo) => (
            <Card 
              key={jogo.id}
              className={`cursor-pointer transition-all border-2 ${
                selectedJogo?.id === jogo.id ? "border-primary bg-primary/5 shadow-md" : "border-transparent"
              }`}
              onClick={() => setSelectedJogo(jogo)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div className="font-bold text-sm leading-tight h-8 flex items-center">
                  {jogo.nome}
                </div>
                <Badge variant="secondary" className="font-mono">
                  {formatCurrency(jogo.preco)}
                </Badge>
              </CardContent>
            </Card>
          ))}
          <Button 
            className="col-span-2 h-14 text-lg font-bold" 
            disabled={!selectedJogo}
            onClick={handleNext}
          >
            Configurar Venda <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      )}

      {step === 2 && selectedJogo && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h3 className="font-bold text-xl">{selectedJogo.nome}</h3>
              <p className="text-sm text-muted-foreground">Preço unitário: {formatCurrency(selectedJogo.preco)}</p>
            </div>

            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-xl">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full"
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
              >
                <Minus className="h-6 w-6" />
              </Button>
              <div className="text-4xl font-black">{quantidade}</div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-full"
                onClick={() => setQuantidade(quantidade + 1)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "dinheiro", icon: Banknote, label: "Dinheiro" },
                { id: "mbway", icon: Smartphone, label: "MBWay" },
                { id: "transferencia", icon: CreditCard, label: "Transf." },
              ].map((m) => (
                <Button
                  key={m.id}
                  variant={metodo === m.id ? "default" : "outline"}
                  className="flex-col h-20 gap-1"
                  onClick={() => setMetodo(m.id)}
                >
                  <m.icon className="h-5 w-5" />
                  <span className="text-[10px] uppercase font-bold">{m.label}</span>
                </Button>
              ))}
            </div>

            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-muted-foreground">Total:</span>
              <span className="text-3xl font-black text-primary">
                {formatCurrency(selectedJogo.preco * quantidade)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={handleNext}>Próximo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center mb-4">
              <UserIcon className="h-10 w-10 mx-auto text-primary mb-2" />
              <h3 className="font-bold">Dados do Comprador</h3>
              <p className="text-xs text-muted-foreground">Obrigatório para contacto em caso de prémio</p>
            </div>

            <div className="space-y-3">
              <Input 
                placeholder="Nome Completo *" 
                value={cliente.nome}
                onChange={e => setCliente({...cliente, nome: e.target.value})}
              />
              <Input 
                placeholder="Telemóvel" 
                value={cliente.telefone}
                onChange={e => setCliente({...cliente, telefone: e.target.value})}
              />
              <Input 
                type="email" 
                placeholder="E-mail (opcional)" 
                value={cliente.email}
                onChange={e => setCliente({...cliente, email: e.target.value})}
              />
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                className="w-full h-14 text-lg font-bold" 
                disabled={!cliente.nome || loading}
                onClick={handleFinish}
              >
                {loading ? "Processando..." : "Confirmar e Finalizar"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>Voltar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
