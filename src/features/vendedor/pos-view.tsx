"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowLeft,
  Wifi,
  WifiOff,
  Check,
  X,
  Receipt,
  Loader2,
  AlertCircle,
  Ticket,
  Hash
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";

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
  onSell: (data: any) => Promise<any>;
  loading?: boolean;
}

const OFFLINE_SALES_KEY = "aldeias_offline_sales";

export function POSView({ jogos, onSell, loading }: POSViewProps) {
  const [selectedJogo, setSelectedJogo] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [step, setStep] = useState(1);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [numeroInput, setNumeroInput] = useState("");
  const [cliente, setCliente] = useState({ nome: "", telefone: "", email: "" });
  const [metodo, setMetodo] = useState<any>("dinheiro");
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);

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

  const handleFinish = async () => {
    if (!selectedJogo) return;

    setProcessing(true);

    const saleData = {
      jogoId: selectedJogo.id,
      quantidade,
      numeros: numerosSelecionados.length > 0 ? numerosSelecionados : undefined,
      metodoPagamento: metodo,
      dadosCliente: cliente.nome ? cliente : undefined,
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
      setProcessing(false);
      return;
    }

    try {
      const result = await onSell(saleData);
      
      if (result?.success !== false) {
        // Success confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff734b', '#9cefff', '#ffcc00', '#ff4488'],
        });

        setSaleSuccess(true);
        setLastSale({
          ...saleData,
          total: selectedJogo.preco * quantidade,
          timestamp: new Date().toISOString(),
        });

        // Show receipt after short delay
        setTimeout(() => {
          setShowReceipt(true);
        }, 1500);
      } else {
        toast.error(result?.error || "Erro ao registar venda");
      }
    } catch (error) {
      const offlineSale: PendingSale = {
        id: `offline_${Date.now()}`,
        ...saleData,
        timestamp: Date.now(),
      };
      saveOfflineSale(offlineSale);
      toast.warning("Erro ao registar. Venda guardada offline.");
    }
    
    setProcessing(false);
  };

  const resetForm = () => {
    setStep(1);
    setSelectedJogo(null);
    setQuantidade(1);
    setNumerosSelecionados([]);
    setNumeroInput("");
    setCliente({ nome: "", telefone: "", email: "" });
    setSaleSuccess(false);
    setLastSale(null);
  };

  const total = selectedJogo ? selectedJogo.preco * quantidade : 0;

  // Success Screen
  if (saleSuccess && !showReceipt) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto"
      >
        <div className="bg-gradient-to-b from-surface-container to-surface-container-low rounded-3xl p-8 text-center border border-green-500/30 relative overflow-hidden">
          {/* Glow */}
          <div className="absolute inset-0 bg-primary/5" />
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
            className="relative"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2 font-serif italic">
              Venda Concluída!
            </h2>
            <p className="text-muted-foreground mb-6">
              {formatCurrency(total)} • {quantidade}x {selectedJogo?.nome}
            </p>
            
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setShowReceipt(true)}
                className="w-full bg-primary hover:bg-primary text-foreground font-bold"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Ver Recibo
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/10"
              >
                Nova Venda
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Receipt Modal
  if (showReceipt && lastSale) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={resetForm}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-foreground rounded-2xl p-6 max-w-sm w-full text-primary-foreground shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6 pb-4 border-b border-gray-200">
            <h3 className="font-bold text-lg">Aldeias Games</h3>
            <p className="text-xs text-gray-500">Comprovativo de Venda</p>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Produto:</span>
              <span className="font-medium">{selectedJogo?.nome}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quantidade:</span>
              <span className="font-medium">{lastSale.quantidade}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cliente:</span>
              <span className="font-medium">{lastSale.dadosCliente?.nome || "Não identificado"}</span>
            </div>
            {lastSale.dadosCliente?.telefone && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Telefone:</span>
                <span className="font-medium">{lastSale.dadosCliente.telefone}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pagamento:</span>
              <span className="font-medium capitalize">{lastSale.metodoPagamento}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(lastSale.total)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground mb-4">
            {formatDateTime(lastSale.timestamp)}
          </div>

          <Button
            onClick={resetForm}
            className="w-full bg-primary hover:bg-primary/90 text-foreground font-bold"
          >
            Nova Venda
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Status Online/Offline */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
        isOnline 
          ? "bg-primary/10 text-green-400" 
          : "bg-orange-500/10 text-orange-400"
      }`}>
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span className="text-sm font-medium flex-1">
          {isOnline ? "Online" : `Offline (${pendingSales.length} venda(s) pendente(s))`}
        </span>
        {!isOnline && pendingSales.length > 0 && (
          <Button 
            size="sm" 
            variant="outline" 
            className="border-current text-current hover:bg-current/10"
            onClick={syncOfflineSales}
          >
            Sincronizar
          </Button>
        )}
      </div>

      {/* Progresso */}
      <div className="flex justify-between items-center px-2">
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <motion.div 
              key={s} 
              className={`h-1.5 w-8 rounded-full ${step >= s ? "bg-primary" : "bg-surface-container-low"}`}
              animate={{ backgroundColor: step >= s ? "hsl(var(--primary))" : "hsl(var(--surface-container-low))" }}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Passo {step} de 3
        </span>
      </div>

      {/* Step 1: Select Game */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Selecionar Jogo
          </h3>
          
          {jogos.length === 0 ? (
            <div className="bg-surface-container rounded-2xl p-8 text-center border border-outline-variant/10">
              <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum jogo disponível</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {jogos.map((jogo) => (
                <motion.button
                  key={jogo.id}
                  whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-2xl text-left border-2 transition-all ${
                    selectedJogo?.id === jogo.id 
                      ? "border-primary bg-primary/10" 
                      : "border-outline-variant/20 bg-surface-container hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedJogo(jogo)}
                >
                  <div className="p-3 bg-primary/20 rounded-xl w-fit mb-3">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-bold text-foreground text-sm mb-1 line-clamp-2">{jogo.nome}</p>
                  <p className="text-xs text-muted-foreground mb-2">{jogo.stockAtual} disponíveis</p>
                  <Badge variant="outline" className="font-mono bg-primary/10 text-primary border-primary/30">
                    {formatCurrency(jogo.preco)}
                  </Badge>
                </motion.button>
              ))}
            </div>
          )}

          <Button 
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground" 
            disabled={!selectedJogo}
            onClick={() => setStep(2)}
          >
            Configurar Venda
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      )}

      {/* Step 2: Quantity & Payment */}
      {step === 2 && selectedJogo && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="bg-surface-container-low rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{selectedJogo.nome}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(selectedJogo.preco)} cada</p>
              </div>
              <button onClick={() => setStep(1)} className="p-2">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Quantidade</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors"
                disabled={quantidade <= 1}
              >
                <Minus className="h-6 w-6" />
              </button>
              <span className="text-4xl font-black text-foreground">{quantidade}</span>
              <button
                onClick={() => setQuantidade(Math.min(10, quantidade + 1))}
                className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center text-foreground hover:bg-muted/50 transition-colors"
                disabled={quantidade >= 10}
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Pagamento</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "dinheiro", icon: Banknote, label: "Dinheiro" },
                { id: "mbway", icon: Smartphone, label: "MBWay" },
                { id: "stripe", icon: CreditCard, label: "Cartão" },
              ].map((m) => (
                <button
                  key={m.id}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    metodo === m.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-container-low text-foreground hover:bg-muted/30"
                  }`}
                  onClick={() => setMetodo(m.id)}
                >
                  <m.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total:</span>
              <span className="text-3xl font-black text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-primary/30 text-primary"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              onClick={() => {
                // Show number selection for rifa or euromilhoes
                if (selectedJogo?.tipo === 'rifa' || selectedJogo?.tipo === 'euromilhoes') {
                  setStep(2.5);
                } else {
                  setStep(3);
                }
              }}
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2.5: Number Selection for Rifa or Euromilhões */}
      {step === 2.5 && selectedJogo && selectedJogo.tipo === 'euromilhoes' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Escolher Números — Euromilhões
          </h3>

          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
              Selecione até 5 números (1–50)
            </p>
            
            <div className="grid grid-cols-10 gap-1.5 mb-4">
              {Array.from({ length: 50 }, (_, i) => i + 1).map(num => {
                const isSelected = numerosSelecionados.includes(num);
                return (
                  <button
                    key={num}
                    onClick={() => {
                      if (isSelected) {
                        setNumerosSelecionados(numerosSelecionados.filter(n => n !== num));
                      } else if (numerosSelecionados.length < 5) {
                        setNumerosSelecionados([...numerosSelecionados, num].sort((a, b) => a - b));
                      } else {
                        toast.error("Máximo de 5 números");
                      }
                    }}
                    className={`w-full aspect-square rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground scale-105"
                        : "bg-surface-container-low text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {numerosSelecionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {numerosSelecionados.map(num => (
                  <span
                    key={num}
                    onClick={() => setNumerosSelecionados(numerosSelecionados.filter(n => n !== num))}
                    className="w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center cursor-pointer"
                  >
                    {num}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Selecionados: {numerosSelecionados.length} de 5
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-primary/30 text-primary"
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              onClick={() => {
                if (numerosSelecionados.length > 0 && numerosSelecionados.length <= 5) {
                  setStep(3);
                } else {
                  toast.error("Selecione entre 1 e 5 números");
                }
              }}
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2.5: Number Selection for Rifa */}
      {step === 2.5 && selectedJogo && selectedJogo.tipo === 'rifa' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Escolher Número
          </h3>

          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
              {selectedJogo.tipo === 'rifa' ? 'Número da Rifa' : 'Número'}
            </p>
            
            {/* Manual input */}
            <div className="flex gap-2 mb-4">
              <Input 
                type="number"
                placeholder="Número (1-100)"
                value={numeroInput}
                onChange={e => setNumeroInput(e.target.value)}
                className="bg-surface-container-low border-transparent text-foreground text-center text-lg"
                min={1}
                max={100}
              />
              <Button 
                onClick={() => {
                  const num = parseInt(numeroInput);
                  if (num >= 1 && num <= 100 && !numerosSelecionados.includes(num)) {
                    setNumerosSelecionados([...numerosSelecionados, num].sort((a, b) => a - b));
                    setNumeroInput("");
                  }
                }}
                className="bg-primary text-primary-foreground"
                disabled={!numeroInput}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected numbers */}
            {numerosSelecionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {numerosSelecionados.map(num => (
                  <button
                    key={num}
                    onClick={() => setNumerosSelecionados(numerosSelecionados.filter(n => n !== num))}
                    className="w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Selecionados: {numerosSelecionados.length} de {quantidade}
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-primary/30 text-primary"
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              onClick={() => {
                if (numerosSelecionados.length === quantidade) {
                  setStep(3);
                } else {
                  toast.error(`Selecione exatamente ${quantidade} número(s)`);
                }
              }}
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Customer Data */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Dados do Cliente
          </h3>

          <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Nome Completo *
                </label>
                <Input 
                  placeholder="Ex: João Silva"
                  value={cliente.nome}
                  onChange={e => setCliente({...cliente, nome: e.target.value})}
                  className="bg-surface-container-low border-transparent text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Telemóvel
                </label>
                <Input 
                  placeholder="912 345 678"
                  value={cliente.telefone}
                  onChange={e => setCliente({...cliente, telefone: e.target.value})}
                  className="bg-surface-container-low border-transparent text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  E-mail (opcional)
                </label>
                <Input 
                  type="email"
                  placeholder="exemplo@email.com"
                  value={cliente.email}
                  onChange={e => setCliente({...cliente, email: e.target.value})}
                  className="bg-surface-container-low border-transparent text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-surface-container-low rounded-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">Resumo:</span>
              <span className="text-2xl font-black text-primary">
                {formatCurrency(total)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {quantidade}x {selectedJogo?.nome} • {metodo}
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-primary/30 text-primary"
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12"
              disabled={!cliente.nome || processing}
              onClick={handleFinish}
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  A processar...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Confirmar Venda
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
