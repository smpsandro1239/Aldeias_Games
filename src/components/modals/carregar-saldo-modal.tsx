"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useReducer, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Euro, Wallet, Phone, Building2, AlertTriangle, Check, Copy, Mail, MessageCircle, User, ChevronDown } from "lucide-react";
import { toast } from "sonner";

// Constants for payment methods to avoid magic strings
const PAYMENT_METHODS = {
  DINHEIRO: 'dinheiro',
  MBWAY: 'mbway',
  TRANSFERENCIA: 'transferencia',
  VENDEDOR: 'vendedor'
} as const;

type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Safe parsing helpers
const safeParseFloat = (val: string, fallback: number = 0): number => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

interface CarregarSaldoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aldeiaId?: string;
  aldeiaNome?: string;
  eventoId?: string;
  eventoNome?: string;
}

interface User {
  id: string;
}

interface DadosConta {
  iban?: string;
  nomeTitularConta?: string;
  telefoneMBWay?: string;
}

interface Vendedor {
  id: string;
  nome: string;
}

interface CarregamentoResult {
  saldoAtual?: number;
  vendedor?: Vendedor;
  dataHora: string;
  metodoPagamento: string;
}

interface PedidoResult {
  vendedor: Vendedor;
  valor: number;
  descricao: string;
}

// Reducer actions
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SALDO'; payload: number }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_DADOS_CONTA'; payload: DadosConta }
  | { type: 'SET_METODO'; payload: PaymentMethod }
  | { type: 'SET_VALOR'; payload: string }
  | { type: 'SET_DESCRICAO'; payload: string }
  | { type: 'SET_CARREGAMENTO_RESULT'; payload: CarregamentoResult | null }
  | { type: 'SET_VENDEDORES'; payload: Vendedor[] }
  | { type: 'SET_SELECTED_VENDEDOR'; payload: Vendedor | null }
  | { type: 'SET_VENDEDOR_DROPDOWN_OPEN'; payload: boolean }
  | { type: 'SET_PEDIDO_RESULT'; payload: PedidoResult | null };

// Initial state
const initialState = {
  loading: false,
  saldo: 0,
  user: null as User | null,
  dadosConta: {} as DadosConta,
  metodoCarregamento: PAYMENT_METHODS.DINHEIRO as PaymentMethod,
  valor: "",
  descricao: "",
  carregamentoResult: null as CarregamentoResult | null,
  vendedores: [] as Vendedor[],
  selectedVendedor: null as Vendedor | null,
  vendedorDropdownOpen: false,
  pedidoResult: null as PedidoResult | null,
};

// Reducer
function reducer(state: typeof initialState, action: Action): typeof initialState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_SALDO': return { ...state, saldo: action.payload };
    case 'SET_USER': return { ...state, user: action.payload };
    case 'SET_DADOS_CONTA': return { ...state, dadosConta: action.payload };
    case 'SET_METODO': return { ...state, metodoCarregamento: action.payload };
    case 'SET_VALOR': return { ...state, valor: action.payload };
    case 'SET_DESCRICAO': return { ...state, descricao: action.payload };
    case 'SET_CARREGAMENTO_RESULT': return { ...state, carregamentoResult: action.payload };
    case 'SET_VENDEDORES': return { ...state, vendedores: action.payload };
    case 'SET_SELECTED_VENDEDOR': return { ...state, selectedVendedor: action.payload };
    case 'SET_VENDEDOR_DROPDOWN_OPEN': return { ...state, vendedorDropdownOpen: action.payload };
    case 'SET_PEDIDO_RESULT': return { ...state, pedidoResult: action.payload };
    default: return state;
  }
}

// Hook customizado para gerenciar saldo
function useSaldo(userId: string) {
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const res = await fetch("/api/wallet");
        const data = await res.json();
        if (typeof data.saldo === 'number') {
          setSaldo(data.saldo);
        }
      } catch (e) {
        console.error("Erro ao buscar saldo:", e);
      }
    };
    fetchSaldo();
  }, [userId]);

  return { saldo, setSaldo };
}

// Hook customizado para dados da conta
function useDadosConta(aldeiaId?: string) {
  const [dadosConta, setDadosConta] = useState<DadosConta>({});
  const [metodosPagamentoAceites, setMetodosPagamentoAceites] = useState<string[]>(['dinheiro', 'mbway', 'transferencia', 'vendedor']);

  useEffect(() => {
    if (!aldeiaId) return;
    const fetchDadosConta = async () => {
      try {
        const res = await fetch(`/api/aldeias/${aldeiaId}`);
        if (!res.ok) {
          throw new Error("Erro ao buscar dados da conta");
        }
        const data = await res.json();
        if (data.data) {
          setDadosConta({
            iban: data.data.iban,
            nomeTitularConta: data.data.nomeTitularConta,
            telefoneMBWay: data.data.telefoneMBWay
          });
          // Parse metodosPagamentoAceites
          if (data.data.metodosPagamentoAceites) {
            try {
              const aceites = JSON.parse(data.data.metodosPagamentoAceites);
              if (Array.isArray(aceites) && aceites.length > 0) {
                setMetodosPagamentoAceites(aceites);
              }
            } catch (e) {
              console.error("Erro ao parsear métodos aceites:", e);
            }
          }
        }
      } catch (e) {
        console.error("Erro ao buscar dados da conta:", e);
      }
    };
    fetchDadosConta();
  }, [aldeiaId]);

  return { dadosConta, metodosPagamentoAceites };
}

// Hook customizado para vendedores
function useVendedores(open: boolean, aldeiaId?: string) {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  useEffect(() => {
    if (!open || !aldeiaId) return;
    const fetchVendedores = async () => {
      try {
        const res = await fetch(`/api/vendedores?aldeiaId=${aldeiaId}`);
        if (!res.ok) {
          throw new Error("Erro ao buscar vendedores");
        }
        const data = await res.json();
        if (data.data) {
          setVendedores(data.data);
        }
      } catch (e) {
        console.error("Erro ao buscar vendedores:", e);
      }
    };
    fetchVendedores();
  }, [open, aldeiaId]);

  return vendedores;
}

export function CarregarSaldoModal({
  open,
  onOpenChange,
  aldeiaId,
  aldeiaNome,
  eventoId,
  eventoNome
}: CarregarSaldoModalProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [user, setUser] = useState<User | null>(null);

  const { saldo, setSaldo } = useSaldo(user?.id || "");
  const { dadosConta, metodosPagamentoAceites } = useDadosConta(aldeiaId);
  const vendedores = useVendedores(open, aldeiaId);

  // Efeito para inicializar dados do usuário
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("Erro ao parsear dados do usuário:", error);
        toast.error("Erro ao carregar dados do usuário");
      }
    }
  }, []);

  // Atualizar estado com dados externos
  useEffect(() => {
    dispatch({ type: 'SET_SALDO', payload: saldo });
  }, [saldo]);

  useEffect(() => {
    dispatch({ type: 'SET_DADOS_CONTA', payload: dadosConta });
  }, [dadosConta]);

  useEffect(() => {
    dispatch({ type: 'SET_VENDEDORES', payload: vendedores });
  }, [vendedores]);

  // Auto-select first available method if current is not allowed
  useEffect(() => {
    if (!metodosPagamentoAceites.includes(state.metodoCarregamento)) {
      const firstAvailable = metodosPagamentoAceites[0];
      if (firstAvailable) {
        dispatch({ type: 'SET_METODO', payload: firstAvailable as PaymentMethod });
      }
    }
  }, [metodosPagamentoAceites, state.metodoCarregamento]);

  const handleCarregar = useCallback(async () => {
    const valorNum = safeParseFloat(state.valor);
    if (valorNum <= 0) {
      toast.error("Insira um valor válido");
      return;
    }

    if (valorNum < 1) {
      toast.error("Valor mínimo é 1€");
      return;
    }

    if (!state.selectedVendedor) {
      toast.error("Selecione um vendedor para processar o carregamento");
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await apiRequest("/api/wallet/carregar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valor: valorNum,
          metodoCarregamento: state.metodoCarregamento,
          vendedorId: state.selectedVendedor.id,
          nomeTitularConta: state.dadosConta.nomeTitularConta,
          iban: state.dadosConta.iban,
          telefoneMBWay: state.dadosConta.telefoneMBWay,
          descricao: state.descricao || `Carregamento para ${eventoNome || aldeiaNome}`,
          eventoId,
          aldeiaId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erro ao criar pedido de carregamento");
        return;
      }

      dispatch({
        type: 'SET_PEDIDO_RESULT',
        payload: {
          vendedor: state.selectedVendedor,
          valor: valorNum,
          descricao: state.descricao || `Pedido de carregamento para ${eventoNome || aldeiaNome}`
        }
      });
      toast.success("Pedido de carregamento criado!");

    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast.error("Erro ao criar pedido de carregamento");
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state, eventoNome, aldeiaNome, eventoId, aldeiaId, setSaldo]);

  const copiarIBAN = useCallback(() => {
    if (state.dadosConta.iban && navigator.clipboard) {
      navigator.clipboard.writeText(state.dadosConta.iban);
      toast.success("IBAN copiado!");
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = state.dadosConta.iban || "";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success("IBAN copiado!");
    }
  }, [state.dadosConta.iban]);

  const handleMetodoChange = useCallback((metodo: PaymentMethod) => {
    dispatch({ type: 'SET_METODO', payload: metodo });
  }, []);

  const handleValorChange = useCallback((valor: string) => {
    dispatch({ type: 'SET_VALOR', payload: valor });
  }, []);

  const handleDescricaoChange = useCallback((descricao: string) => {
    dispatch({ type: 'SET_DESCRICAO', payload: descricao });
  }, []);

  const toggleVendedorDropdown = useCallback(() => {
    dispatch({ type: 'SET_VENDEDOR_DROPDOWN_OPEN', payload: !state.vendedorDropdownOpen });
  }, [state.vendedorDropdownOpen]);

  const handleVendedorSelect = useCallback((vendedor: Vendedor) => {
    dispatch({ type: 'SET_SELECTED_VENDEDOR', payload: vendedor });
    dispatch({ type: 'SET_VENDEDOR_DROPDOWN_OPEN', payload: false });
  }, []);

  // Renderização condicional baseada no resultado
  if (state.pedidoResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 text-center">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-orange-500" aria-hidden="true" />
            </div>
            <DialogTitle className="font-headline text-xl text-orange-500">
              Pedido Enviado!
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant">Valor Pedido</p>
              <p className="font-headline text-4xl text-primary">{state.pedidoResult.valor}€</p>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <p className="text-xs text-orange-500 font-medium flex items-center gap-2">
                <User className="w-4 h-4" aria-hidden="true" />
                Vendedor: {state.pedidoResult.vendedor.nome}
              </p>
              <p className="text-xs text-orange-500/80 mt-1">
                O vendedor foi notificado e vai receber o seu pedido. Quando ele confirmar a receção do dinheiro, o saldo será adicionado à sua conta.
              </p>
            </div>

            <Button
              onClick={() => {
                dispatch({ type: 'SET_PEDIDO_RESULT', payload: null });
                dispatch({ type: 'SET_VALOR', payload: "" });
                dispatch({ type: 'SET_DESCRICAO', payload: "" });
                onOpenChange(false);
              }}
              className="w-full"
              aria-label="Fechar modal"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (state.carregamentoResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <DialogTitle className="font-headline text-xl text-primary">
              Carregamento Registado!
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant">Novo Saldo</p>
              <p className="font-headline text-4xl text-primary">{state.carregamentoResult.saldoAtual?.toFixed(2) || state.saldo.toFixed(2)}€</p>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-xl p-3">
              <p className="text-xs text-accent font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Importante
              </p>
              <p className="text-xs text-accent/80 mt-1">
                Todos os administradores foram notificados. O registro detalhado foi guardado no sistema.
              </p>
            </div>

            <div className="text-xs text-on-surface-variant space-y-1">
              <p><strong>Vendedor:</strong> {state.carregamentoResult.vendedor?.nome}</p>
              <p><strong>Data:</strong> {new Date(state.carregamentoResult.dataHora).toLocaleString("pt-PT")}</p>
              <p><strong>Método:</strong> {state.carregamentoResult.metodoPagamento}</p>
            </div>

            <Button
              onClick={() => {
                dispatch({ type: 'SET_CARREGAMENTO_RESULT', payload: null });
                dispatch({ type: 'SET_VALOR', payload: "" });
                dispatch({ type: 'SET_DESCRICAO', payload: "" });
                onOpenChange(false);
              }}
              className="w-full"
              aria-label="Fechar modal"
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
      <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden" aria-describedby="carregar-saldo-description">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" aria-hidden="true" />
            Carregar Saldo
          </DialogTitle>
          <p id="carregar-saldo-description" className="sr-only">Modal para carregar saldo usando diferentes métodos de pagamento</p>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
          <div className="bg-surface-container-high rounded-xl p-4 text-center">
            <p className="text-xs text-on-surface-variant">Saldo Atual</p>
            <p className="font-headline text-3xl text-primary">{state.saldo.toFixed(2)}€</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor a Carregar *</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" aria-hidden="true" />
              <Input
                id="valor"
                type="number"
                min="1"
                step="0.50"
                value={state.valor}
                onChange={(e) => handleValorChange(e.target.value)}
                placeholder="0.00"
                className="pl-10 text-xl"
                aria-describedby="valor-error"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Método de Recebimento *</Label>
            {metodosPagamentoAceites.length === 0 ? (
              <div className="p-4 rounded-xl bg-destructive/10 border border-red-500/20 text-center">
                <p className="text-sm text-red-400">Nenhum método de pagamento disponível. Contacte o administrador.</p>
              </div>
            ) : (
            <div className="grid gap-2" role="radiogroup" aria-label="Selecionar método de pagamento">
              {metodosPagamentoAceites.includes(PAYMENT_METHODS.DINHEIRO) && (
                <button
                  type="button"
                  onClick={() => handleMetodoChange(PAYMENT_METHODS.DINHEIRO)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    state.metodoCarregamento === PAYMENT_METHODS.DINHEIRO
                      ? "bg-primary/20 text-green-400 border border-green-600/30"
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                  role="radio"
                  aria-checked={state.metodoCarregamento === PAYMENT_METHODS.DINHEIRO}
                  aria-label="Método Dinheiro - Recebido presencialmente"
                >
                  <Euro className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">Dinheiro</p>
                    <p className="text-xs opacity-60">Recebido presencialmente</p>
                  </div>
                </button>
              )}

              {metodosPagamentoAceites.includes(PAYMENT_METHODS.MBWAY) && (
                <button
                  type="button"
                  onClick={() => handleMetodoChange(PAYMENT_METHODS.MBWAY)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    state.metodoCarregamento === PAYMENT_METHODS.MBWAY
                      ? "bg-purple-600/20 text-primary border border-purple-600/30"
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                  role="radio"
                  aria-checked={state.metodoCarregamento === PAYMENT_METHODS.MBWAY}
                  aria-label="Método MBWay - Recebido via MBWay"
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">MBWay</p>
                    <p className="text-xs opacity-60">Recebido via MBWay</p>
                  </div>
                </button>
              )}

              {metodosPagamentoAceites.includes(PAYMENT_METHODS.TRANSFERENCIA) && (
                <button
                  type="button"
                  onClick={() => handleMetodoChange(PAYMENT_METHODS.TRANSFERENCIA)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    state.metodoCarregamento === PAYMENT_METHODS.TRANSFERENCIA
                      ? "bg-blue-600/20 text-primary border border-blue-600/30"
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                  role="radio"
                  aria-checked={state.metodoCarregamento === PAYMENT_METHODS.TRANSFERENCIA}
                  aria-label="Método Transferência - Transferência bancária"
                >
                  <Building2 className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">Transferência</p>
                    <p className="text-xs opacity-60">Transferência bancária</p>
                  </div>
                </button>
              )}

              {metodosPagamentoAceites.includes(PAYMENT_METHODS.VENDEDOR) && (
                <button
                  type="button"
                  onClick={() => handleMetodoChange(PAYMENT_METHODS.VENDEDOR)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    state.metodoCarregamento === PAYMENT_METHODS.VENDEDOR
                      ? "bg-accent/20 text-orange-400 border border-orange-600/30"
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                  role="radio"
                  aria-checked={state.metodoCarregamento === PAYMENT_METHODS.VENDEDOR}
                  aria-label="Método Pedir ao Vendedor - O vendedor traz o dinheiro"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">Pedir ao Vendedor</p>
                    <p className="text-xs opacity-60">O vendedor traz o dinheiro</p>
                  </div>
                </button>
              )}
            </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendedor-select">Vendedor Responsável *</Label>
            <p className="text-xs text-on-surface-variant">
              Selecione o vendedor que está presente para processar o carregamento
            </p>
            <div className="relative">
              <button
                id="vendedor-select"
                type="button"
                onClick={toggleVendedorDropdown}
                className="w-full p-4 rounded-xl bg-surface-container-low text-left flex items-center justify-between"
                aria-expanded={state.vendedorDropdownOpen}
                aria-haspopup="listbox"
                aria-describedby="vendedor-error"
              >
                <span>{state.selectedVendedor?.nome || "Selecione um vendedor"}</span>
                <ChevronDown className="w-5 h-5" aria-hidden="true" />
              </button>
              {state.vendedorDropdownOpen && (
                <div className="absolute z-10 w-full bg-surface-container-high border border-outline-variant/10 rounded-xl mt-1 max-h-48 overflow-y-auto" role="listbox" aria-labelledby="vendedor-select">
                  {state.vendedores.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleVendedorSelect(v)}
                      className="w-full p-3 text-left hover:bg-surface-container-low flex items-center gap-2"
                      role="option"
                      aria-selected={state.selectedVendedor?.id === v.id}
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                      {v.nome}
                    </button>
                  ))}
                </div>
              )}
              {!state.selectedVendedor && (
                <p id="vendedor-error" className="text-sm text-red-500 mt-1" role="alert">
                  Selecione um vendedor para processar o carregamento
                </p>
              )}
            </div>
          </div>

          {state.metodoCarregamento === PAYMENT_METHODS.TRANSFERENCIA && state.dadosConta.iban && (
            <div className="bg-secondary/10 border border-blue-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs text-primary font-medium">Dados para Transferência:</p>
              <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
                <span className="text-xs font-mono">{state.dadosConta.iban}</span>
                <button onClick={copiarIBAN} className="p-1 hover:bg-surface-container-high rounded" aria-label="Copiar IBAN para área de transferência">
                  <Copy className="w-4 h-4 text-primary" aria-hidden="true" />
                </button>
              </div>
              {state.dadosConta.nomeTitularConta && (
                <p className="text-xs text-on-surface-variant">Titular: {state.dadosConta.nomeTitularConta}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input
              id="descricao"
              value={state.descricao}
              onChange={(e) => handleDescricaoChange(e.target.value)}
              placeholder="Ex: Venda na festa de São João"
            />
          </div>

          <div className="bg-destructive/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs text-red-400 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              Transparência Obrigatória
            </p>
            <p className="text-xs text-red-400/80 mt-1">
              Ao confirmar, todos os administradores e super administradores serão notificados por email e WhatsApp com os detalhes deste carregamento.
            </p>
          </div>

          <Button
            onClick={handleCarregar}
            disabled={state.loading || !state.valor || safeParseFloat(state.valor) <= 0 || !state.selectedVendedor}
            className="w-full py-6 sticky bottom-0"
            aria-label={`Criar pedido de carregamento de ${state.valor || "0"} euros`}
          >
            {state.loading ? "A processar..." : `Criar Pedido (${state.valor || "0"}€)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}