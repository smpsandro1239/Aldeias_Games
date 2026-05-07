"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Euro, Wallet, Phone, Building2, AlertTriangle, Check, Copy, Mail, MessageCircle, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface CarregarSaldoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aldeiaId?: string;
  aldeiaNome?: string;
  eventoId?: string;
  eventoNome?: string;
}

interface DadosConta {
  iban?: string;
  nomeTitularConta?: string;
  telefoneMBWay?: string;
}

interface User {
  id: string;
  nome?: string;
  email?: string;
}

interface Vendedor {
  id: string;
  nome: string;
}

interface CarregamentoResult {
  saldoAtual: number;
  vendedor?: Vendedor;
  dataHora: string;
  metodoPagamento: string;
}

interface PedidoResult {
  vendedor: Vendedor;
  valor: number;
  descricao: string;
}

// Safe parsing helper
const safeParseFloat = (val: string, fallback: number = 0): number => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

// Constants
const PEDIDO_DESCRICAO_TEMPLATE = (eventoNome?: string, aldeiaNome?: string) =>
  `Pedido de carregamento para ${eventoNome || aldeiaNome}`;

const CARREGAMENTO_DESCRICAO_TEMPLATE = (eventoNome?: string, aldeiaNome?: string) =>
  `Carregamento para ${eventoNome || aldeiaNome}`;

export function CarregarSaldoModal({ open, onOpenChange, aldeiaId, aldeiaNome, eventoId, eventoNome }: CarregarSaldoModalProps) {
  const [loading, setLoading] = useState(false);
  const [saldo, setSaldo] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [dadosConta, setDadosConta] = useState<DadosConta>({});
  const [metodoCarregamento, setMetodoCarregamento] = useState<"dinheiro" | "mbway" | "transferencia" | "vendedor">("dinheiro");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregamentoResult, setCarregamentoResult] = useState<CarregamentoResult | null>(null);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);
  const [vendedorDropdownOpen, setVendedorDropdownOpen] = useState(false);
  const [pedidoResult, setPedidoResult] = useState<PedidoResult | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        fetchSaldo(userData.id);
        fetchDadosConta();
      } catch (error) {
        console.error("Erro ao parsear dados do user do localStorage:", error);
        toast.error("Erro ao carregar dados do usuário");
      }
    }
  }, []); // Removed aldeiaId as it's not used in the effect

  const fetchSaldo = async (userId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.saldo !== undefined) {
        setSaldo(data.saldo);
      }
    } catch (e) {
      console.error("Erro ao buscar saldo:", e);
    }
  };

  const fetchDadosConta = async () => {
    if (!aldeiaId) return;
    try {
      const res = await fetch(`/api/aldeias/${aldeiaId}`);
      const data = await res.json();
      if (data.data) {
        setDadosConta({
          iban: data.data.iban,
          nomeTitularConta: data.data.nomeTitularConta,
          telefoneMBWay: data.data.telefoneMBWay
        });
      }
    } catch (e) {
      console.error("Erro ao buscar dados da conta:", e);
    }
  };

  const fetchVendedores = async () => {
    if (!aldeiaId) return;
    try {
      const res = await fetch(`/api/vendedores?aldeiaId=${aldeiaId}`);
      const data = await res.json();
      if (data.data) {
        setVendedores(data.data);
      }
    } catch (e) {
      console.error("Erro ao buscar vendedores:", e);
    }
  };

  useEffect(() => {
    if (open && aldeiaId) {
      fetchVendedores();
    }
  }, [open, aldeiaId]);

  const handleCarregar = async () => {
    const valorNum = safeParseFloat(valor);
    if (valorNum <= 0) {
      toast.error("Insira um valor válido");
      return;
    }

    if (valorNum < 1) {
      toast.error("Valor mínimo é 1€");
      return;
    }

    // Para pedido ao vendedor, validar seleção
    if (metodoCarregamento === "vendedor") {
      if (!selectedVendedor) {
        toast.error("Selecione um vendedor");
        return;
      }
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/wallet/carregar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            valor: valorNum,
            metodoCarregamento: "vendedor",
            vendedorId: selectedVendedor.id,
            descricao: descricao || PEDIDO_DESCRICAO_TEMPLATE(eventoNome, aldeiaNome),
            eventoId,
            aldeiaId
          })
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Erro ao criar pedido");
          return;
        }

        setPedidoResult({
          vendedor: selectedVendedor,
          valor: valorNum,
          descricao: descricao || PEDIDO_DESCRICAO_TEMPLATE(eventoNome, aldeiaNome)
        });
        toast.success("Pedido enviado ao vendedor!");

      } catch (error) {
        console.error("Erro ao criar pedido:", error);
        toast.error("Erro ao criar pedido");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/wallet/carregar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          valor: valorNum,
          metodoCarregamento,
          nomeTitularConta: dadosConta.nomeTitularConta,
          iban: dadosConta.iban,
          telefoneMBWay: dadosConta.telefoneMBWay,
          descricao: descricao || CARREGAMENTO_DESCRICAO_TEMPLATE(eventoNome, aldeiaNome),
          eventoId,
          aldeiaId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao carregar saldo");
        return;
      }

      setCarregamentoResult(data.data);
      setSaldo(data.data.saldoAtual);
      toast.success("Saldo carregado com sucesso!");

    } catch (error) {
      console.error("Erro ao carregar:", error);
      toast.error("Erro ao carregar saldo");
    } finally {
      setLoading(false);
    }
  };

  const copiarIBAN = () => {
    if (dadosConta.iban) {
      navigator.clipboard.writeText(dadosConta.iban);
      toast.success("IBAN copiado!");
    }
  };

  if (pedidoResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-orange-500" />
            </div>
            <DialogTitle className="font-headline text-xl text-orange-500">
              Pedido Enviado!
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant">Valor Pedido</p>
              <p className="font-headline text-4xl text-primary">{pedidoResult.valor}€</p>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <p className="text-xs text-orange-500 font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Vendedor: {pedidoResult.vendedor?.nome}
              </p>
              <p className="text-xs text-orange-500/80 mt-1">
                O vendedor foi notificado e vai receber o seu pedido. Quando ele confirmar a receção do dinheiro, o saldo será adicionado à sua conta.
              </p>
            </div>

            <Button
              onClick={() => {
                setPedidoResult(null);
                setValor("");
                setDescricao("");
                onOpenChange(false);
              }}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (carregamentoResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="font-headline text-xl text-primary">
              Carregamento Registado!
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant">Novo Saldo</p>
              <p className="font-headline text-4xl text-primary">{carregamentoResult.saldoAtual?.toFixed(2) || saldo.toFixed(2)}€</p>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-xl p-3">
              <p className="text-xs text-accent font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Importante
              </p>
              <p className="text-xs text-accent/80 mt-1">
                Todos os administradores foram notificados. O registro detalhado foi guardado no sistema.
              </p>
            </div>

            <div className="text-xs text-on-surface-variant space-y-1">
              <p><strong>Vendedor:</strong> {carregamentoResult.vendedor?.nome}</p>
              <p><strong>Data:</strong> {new Date(carregamentoResult.dataHora).toLocaleString("pt-PT")}</p>
              <p><strong>Método:</strong> {carregamentoResult.metodoPagamento}</p>
            </div>

            <Button
              onClick={() => {
                setCarregamentoResult(null);
                setValor("");
                setDescricao("");
                onOpenChange(false);
              }}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Carregar Saldo
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
          <div className="bg-surface-container-high rounded-xl p-4 text-center">
            <p className="text-xs text-on-surface-variant">Saldo Atual</p>
            <p className="font-headline text-3xl text-primary">{saldo.toFixed(2)}€</p>
          </div>

          <div className="space-y-2">
            <Label>Valor a Carregar</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
              <Input
                type="number"
                min="1"
                step="0.50"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                className="pl-10 text-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Método de Recebimento</Label>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setMetodoCarregamento("dinheiro")}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                  metodoCarregamento === "dinheiro"
                    ? "bg-primary/20 text-green-400 border border-green-600/30"
                    : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                }`}
              >
                <Euro className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Dinheiro</p>
                  <p className="text-xs opacity-60">Recebido presencialmente</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMetodoCarregamento("mbway")}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                  metodoCarregamento === "mbway"
                    ? "bg-purple-600/20 text-primary border border-purple-600/30"
                    : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                }`}
              >
                <Phone className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">MBWay</p>
                  <p className="text-xs opacity-60">Recebido via MBWay</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMetodoCarregamento("transferencia")}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                  metodoCarregamento === "transferencia"
                    ? "bg-blue-600/20 text-primary border border-blue-600/30"
                    : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                }`}
              >
                <Building2 className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Transferência</p>
                  <p className="text-xs opacity-60">Transferência bancária</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMetodoCarregamento("vendedor")}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                  metodoCarregamento === "vendedor"
                    ? "bg-accent/20 text-orange-400 border border-orange-600/30"
                    : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                }`}
              >
                <User className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Pedir ao Vendedor</p>
                  <p className="text-xs opacity-60">O vendedor traz o dinheiro</p>
                </div>
              </button>
            </div>
          </div>

          {metodoCarregamento === "vendedor" && (
            <div className="space-y-2">
              <Label>Escolher Vendedor</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setVendedorDropdownOpen(!vendedorDropdownOpen)}
                  className="w-full p-4 rounded-xl bg-surface-container-low text-left flex items-center justify-between"
                  aria-expanded={vendedorDropdownOpen}
                  aria-haspopup="listbox"
                  role="combobox"
                >
                  <span>{selectedVendedor?.nome || "Selecione um vendedor"}</span>
                  <ChevronDown className="w-5 h-5" />
                </button>
                {vendedorDropdownOpen && (
                  <div className="absolute z-10 w-full bg-surface-container-high border border-outline-variant/10 rounded-xl mt-1 max-h-48 overflow-y-auto" role="listbox">
                    {vendedores.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVendedor(v);
                          setVendedorDropdownOpen(false);
                        }}
                        className="w-full p-3 text-left hover:bg-surface-container-low flex items-center gap-2"
                        role="option"
                        aria-selected={selectedVendedor?.id === v.id}
                      >
                        <User className="w-4 h-4" />
                        {v.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {metodoCarregamento === "transferencia" && dadosConta.iban && (
            <div className="bg-secondary/10 border border-blue-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs text-primary font-medium">Dados para Transferência:</p>
              <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
                <span className="text-xs font-mono">{dadosConta.iban}</span>
                <button onClick={copiarIBAN} className="p-1 hover:bg-surface-container-high rounded">
                  <Copy className="w-4 h-4 text-primary" />
                </button>
              </div>
              {dadosConta.nomeTitularConta && (
                <p className="text-xs text-on-surface-variant">Titular: {dadosConta.nomeTitularConta}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Venda na festa de São João"
            />
          </div>

          <div className="bg-destructive/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs text-red-400 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Transparência Obrigatória
            </p>
            <p className="text-xs text-red-400/80 mt-1">
              Ao confirmar, todos os administradores e super administradores serão notificados por email e WhatsApp com os detalhes deste carregamento.
            </p>
          </div>

          <Button
            onClick={handleCarregar}
            disabled={loading || !valor || safeParseFloat(valor) <= 0}
            className="w-full py-6 sticky bottom-0"
          >
            {loading ? "A processar..." : metodoCarregamento === "vendedor" ? `Pedir ao Vendedor (${valor || "0"}€)` : `Confirmar Carregamento de €${valor || "0"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}