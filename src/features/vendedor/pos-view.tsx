"use client";

import { useState, useEffect } from "react";
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
  ArrowRight,
  Wifi,
  WifiOff
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface PendingSale {
  id: string;
  jogoId: string;
  quantidade: number;
  metodoPagamento: string;
  dadosCliente?: { nome: string; telefone?: string; email?: string };
  timestamp: number;
}

interface POSViewProps {
  jogos: any[];
  onSell: (data: any) => Promise<void>;
  loading?: boolean;
}

const OFFLINE_SALES_KEY = "aldeias_offline_sales";

export function POSView({ jogos, onSell, loading }: POSViewProps) {
  const [selectedJogo, setSelectedJogo] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [step, setStep] = useState(1);
  const [cliente, setCliente] = useState({ nome: "", telefone: "", email: "" });
  const [metodo, setMetodo] = useState<any>("dinheiro");
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const saved = localStorage.getItem(OFFLINE_SALES_KEY);
    if (saved) {
      try {
        setPendingSales(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar vendas offline:", e);
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineSales();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveOfflineSale = (sale: PendingSale) => {
    const updated = [...pendingSales, sale];
    setPendingSales(updated);
    localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(updated));
  };

  const syncOfflineSales = async () => {
    if (!isOnline || pendingSales.length === 0) return;

    for (const sale of pendingSales) {
      try {
        await onSell({
          jogoId: sale.jogoId,
          quantidade: sale.quantidade,
          metodoPagamento: sale.metodoPagamento,
          dadosCliente: sale.dadosCliente,
        });
      } catch (error) {
        console.error("Erro ao sincronizar venda:", error);
      }
    }

    setPendingSales([]);
    localStorage.removeItem(OFFLINE_SALES_KEY);
    toast.success(`${pendingSales.length} venda(s) sincronizada(s)`);
  };

  const handleNext = () => {
    if (step === 1 && selectedJogo) setStep(2);
    else if (step === 2) setStep(3);
  };

  const handleFinish = async () => {
    const saleData = {
      jogoId: selectedJogo.id,
      quantidade,
      metodoPagamento: metodo,
      dadosCliente: cliente.nome ? {
        nome: cliente.nome,
        telefone: cliente.telefone || undefined,
        email: cliente.email || undefined
      } : { nome: "Anónimo" },
    };

    if (!isOnline) {
      const offlineSale: PendingSale = {
        id: `offline_${Date.now()}`,
        ...saleData,
        timestamp: Date.now(),
      };
      saveOfflineSale(offlineSale);
      toast.info("Venda guardada offline. Será sincronizada quando houver conexão.");
      resetForm();
      return;
    }

    try {
      await onSell(saleData);
      toast.success("Venda registada com sucesso!");
    } catch (error) {
      const offlineSale: PendingSale = {
        id: `offline_${Date.now()}`,
        ...saleData,
        timestamp: Date.now(),
      };
      saveOfflineSale(offlineSale);
      toast.warning("Erro ao registar. Venda guardada offline.");
    }
    resetForm();
  };

  const resetForm = () => {
    setStep(1);
    setSelectedJogo(null);
    setQuantidade(1);
    setCliente({ nome: "", telefone: "", email: "" });
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Status Online/Offline */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isOnline ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isOnline ? "Online" : `Offline (${pendingSales.length} venda(s) pendente(s))`}
        </span>
        {!isOnline && pendingSales.length > 0 && (
          <Button size="sm" variant="outline" className="ml-auto" onClick={syncOfflineSales}>
            Sincronizar
          </Button>
        )}
      </div>
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
