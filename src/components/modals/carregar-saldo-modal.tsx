"use client";

import { useState, useReducer, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Euro, Wallet, Phone, Building2, AlertTriangle, Check, Copy, User, ChevronDown, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { safeParseFloat } from "@/lib/form-utils";
import { secureFetch, getToken, validateToken } from "@/lib/api-helpers";

// Constants
const METODOS_CARREGAMENTO = {
  DINHEIRO: 'dinheiro',
  MBWAY: 'mbway',
  TRANSFERENCIA: 'transferencia',
  VENDEDOR: 'vendedor'
} as const;

type MetodoCarregamento = typeof METODOS_CARREGAMENTO[keyof typeof METODOS_CARREGAMENTO];

const DESCRICAO_TEMPLATE = (eventoNome?: string, aldeiaNome?: string): string => {
  const nome = eventoNome || aldeiaNome || 'evento';
  return `Carregamento para ${nome}`;
};

const PEDIDO_DESCRICAO_TEMPLATE = (eventoNome?: string, aldeiaNome?: string): string => {
  const nome = eventoNome || aldeiaNome || 'evento';
  return `Pedido de carregamento para ${nome}`;
};

// Types
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
  nome?: string;
  email?: string;
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

// State Management with useReducer
interface State {
  loading: boolean;
  saldo: number;
  user: User | null;
  dadosConta: DadosConta;
  metodoCarregamento: MetodoCarregamento;
  valor: string;
  descricao: string;
  carregamentoResult: CarregamentoResult | null;
  vendedores: Vendedor[];
  selectedVendedor: Vendedor | null;
  vendedorDropdownOpen: boolean;
  pedidoResult: PedidoResult | null;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SALDO'; payload: number }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_DADOS_CONTA'; payload: DadosConta }
  | { type: 'SET_METODO'; payload: MetodoCarregamento }
  | { type: 'SET_VALOR'; payload: string }
  | { type: 'SET_DESCRICAO'; payload: string }
  | { type: 'SET_CARREGAMENTO_RESULT'; payload: CarregamentoResult | null }
  | { type: 'SET_VENDEDORES'; payload: Vendedor[] }
  | { type: 'SET_SELECTED_VENDEDOR'; payload: Vendedor | null }
  | { type: 'SET_VENDEDOR_DROPDOWN_OPEN'; payload: boolean }
  | { type: 'SET_PEDIDO_RESULT'; payload: PedidoResult | null }
  | { type: 'RESET' };

const initialState: State = {
  loading: false,
  saldo: 0,
  user: null,
  dadosConta: {},
  metodoCarregamento: METODOS_CARREGAMENTO.DINHEIRO,
  valor: "",
  descricao: "",
  carregamentoResult: null,
  vendedores: [],
  selectedVendedor: null,
  vendedorDropdownOpen: false,
  pedidoResult: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_SALDO': return { ...state, saldo: action.payload };
    case 'SET_USER': return { ...state, user: action.payload };
    case 'SET_DADOS_CONTA': return { ...state, dadosConta: action.payload };
    case 'SET_METODO': return { ...state, metodoCarregamento: action.payload, selectedVendedor: null };
    case 'SET_VALOR': return { ...state, valor: action.payload };
    case 'SET_DESCRICAO': return { ...state, descricao: action.payload };
    case 'SET_CARREGAMENTO_RESULT': return { ...state, carregamentoResult: action.payload };
    case 'SET_VENDEDORES': return { ...state, vendedores: action.payload };
    case 'SET_SELECTED_VENDEDOR': return { ...state, selectedVendedor: action.payload };
    case 'SET_VENDEDOR_DROPDOWN_OPEN': return { ...state, vendedorDropdownOpen: action.payload };
    case 'SET_PEDIDO_RESULT': return { ...state, pedidoResult: action.payload };
    case 'RESET': return initialState;
    default: return state;
  }
}

// Custom hooks for data fetching
function useSaldo(userId: string) {
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();
    const fetchSaldo = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/wallet", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (data.saldo !== undefined) {
            setSaldo(data.saldo);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Erro ao buscar saldo:", error);
        }
      }
    };

    fetchSaldo();
    return () => controller.abort();
  }, [userId]);

  return saldo;
}

function useDadosConta(aldeiaId?: string) {
  const [dadosConta, setDadosConta] = useState<DadosConta>({});

  useEffect(() => {
    if (!aldeiaId) return;

    const controller = new AbortController();
    const fetchDadosConta = async () => {
      try {
        const res = await fetch(`/api/aldeias/${aldeiaId}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setDadosConta({
              iban: data.data.iban,
              nomeTitularConta: data.data.nomeTitularConta,
              telefoneMBWay: data.data.telefoneMBWay
            });
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Erro ao buscar dados da conta:", error);
        }
      }
    };

    fetchDadosConta();
    return () => controller.abort();
  }, [aldeiaId]);

  return dadosConta;
}

function useVendedores(open: boolean, aldeiaId?: string) {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  useEffect(() => {
    if (!open || !aldeiaId) return;

    const controller = new AbortController();
    const fetchVendedores = async () => {
      try {
        const res = await fetch(`/api/vendedores?aldeiaId=${aldeiaId}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setVendedores(data.data);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Erro ao buscar vendedores:", error);
        }
      }
    };

    fetchVendedores();
    return () => controller.abort();
  }, [open, aldeiaId]);

  return vendedores;
}

// API helpers from api-helpers

export function CarregarSaldoModal({ open, onOpenChange, aldeiaId, aldeiaNome, eventoId, eventoNome }: CarregarSaldoModalProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const saldo = useSaldo(user?.id || "");
  const dadosConta = useDadosConta(aldeiaId);
  const vendedores = useVendedores(open, aldeiaId);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData: User = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("Erro ao parsear dados do usuário:", error);
      }
    }
  }, []);

  // Sync external state to reducer
  useEffect(() => {
    dispatch({ type: 'SET_SALDO', payload: saldo });
  }, [saldo]);

  useEffect(() => {
    dispatch({ type: 'SET_DADOS_CONTA', payload: dadosConta });
  }, [dadosConta]);

  useEffect(() => {
    dispatch({ type: 'SET_VENDEDORES', payload: vendedores });
  }, [vendedores]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      dispatch({ type: 'RESET' });
    }
  }, [open]);

  const handleCarregar = useCallback(async () => {
    const valorNum = safeParseFloat(state.valor, 0);

    if (valorNum <= 0) {
      toast.error("Insira um valor válido");
      return;
    }

    if (valorNum < 1) {
      toast.error("Valor mínimo é 1€");
      return;
    }

    // Validar token antes de qualquer operação
    const token = getToken();
    if (!validateToken(token)) return;

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      if (state.metodoCarregamento === METODOS_CARREGAMENTO.VENDEDOR) {
        if (!state.selectedVendedor) {
          toast.error("Selecione um vendedor");
          return;
        }

        const res = await fetch("/api/wallet/carregar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            valor: valorNum,
            metodoCarregamento: "vendedor",
            vendedorId: state.selectedVendedor.id,
            descricao: PEDIDO_DESCRICAO_TEMPLATE(eventoNome, aldeiaNome),
            eventoId,
            aldeiaId
          }),
          signal: abortControllerRef.current.signal
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Erro ao criar pedido");
          return;
        }

        dispatch({
          type: 'SET_PEDIDO_RESULT',
          payload: {
            vendedor: state.selectedVendedor,
            valor: valorNum,
            descricao: PEDIDO_DESCRICAO_TEMPLATE(eventoNome, aldeiaNome)
          }
        });
        toast.success("Pedido enviado ao vendedor!");

      } else {
        const res = await fetch("/api/wallet/carregar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            valor: valorNum,
            metodoCarregamento: state.metodoCarregamento,
            nomeTitularConta: state.dadosConta.nomeTitularConta,
            iban: state.dadosConta.iban,
            telefoneMBWay: state.dadosConta.telefoneMBWay,
            descricao: DESCRICAO_TEMPLATE(eventoNome, aldeiaNome),
            eventoId,
            aldeiaId
          }),
          signal: abortControllerRef.current.signal
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Erro ao carregar saldo");
          return;
        }

        dispatch({ type: 'SET_CARREGAMENTO_RESULT', payload: data.data });
        dispatch({ type: 'SET_SALDO', payload: data.data.saldoAtual || 0 });
        toast.success("Saldo carregado com sucesso!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Erro ao processar carregamento:", error);
        toast.error("Erro ao processar carregamento");
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      abortControllerRef.current = null;
    }
  }, [state, eventoNome, aldeiaNome, eventoId, aldeiaId]);

  const copiarIBAN = useCallback(() => {
    if (state.dadosConta.iban && typeof navigator !== 'undefined' && window.isSecureContext) {
      navigator.clipboard.writeText(state.dadosConta.iban);
      toast.success("IBAN copiado!");
    } else if (!window.isSecureContext) {
      toast.error("Não é possível copiar em conexão não segura");
    }
  }, [state.dadosConta.iban]);

  const handleMetodoChange = useCallback((metodo: MetodoCarregamento) => {
    dispatch({ type: 'SET_METODO', payload: metodo });
  }, []);

  const handleValorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_VALOR', payload: e.target.value });
  }, []);

  const handleDescricaoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_DESCRICAO', payload: e.target.value });
  }, []);

  const handleVendedorSelect = useCallback((vendedor: Vendedor | null) => {
    dispatch({ type: 'SET_SELECTED_VENDEDOR', payload: vendedor });
  }, []);

  const handleVendedorDropdownToggle = useCallback(() => {
    dispatch({ type: 'SET_VENDEDOR_DROPDOWN_OPEN', payload: !state.vendedorDropdownOpen });
  }, [state.vendedorDropdownOpen]);

  // Renderiza tela de sucesso
  if (state.pedidoResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden" aria-describedby="pedido-enviado-desc">
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
                dispatch({ type: 'RESET' });
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

  // Renderiza tela de sucesso de carregamento
  if (state.carregamentoResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden" aria-describedby="carregamento-sucesso-desc">
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
                Todos os administradores foram notificados. O registo detalhado foi guardado no sistema.
              </p>
            </div>

            <div className="text-xs text-on-surface-variant space-y-1">
              <p><strong>Vendedor:</strong> {state.carregamentoResult.vendedor?.nome || 'N/A'}</p>
              <p><strong>Data:</strong> {new Date(state.carregamentoResult.dataHora).toLocaleString("pt-PT")}</p>
              <p><strong>Método:</strong> {state.carregamentoResult.metodoPagamento}</p>
            </div>

            <Button
              onClick={() => {
                dispatch({ type: 'RESET' });
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

  // Renderiza formulário principal
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" aria-hidden="true" />
            Carregar Saldo
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
          {/* Saldo Atual */}
          <div className="bg-surface-container-high rounded-xl p-4 text-center">
            <p className="text-xs text-on-surface-variant">Saldo Atual</p>
            <p className="font-headline text-3xl text-primary">{state.saldo.toFixed(2)}€</p>
          </div>

          {/* Valor a Carregar */}
          <div className="space-y-2">
            <Label htmlFor="valor-carregar">Valor a Carregar</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" aria-hidden="true" />
              <Input
                id="valor-carregar"
                type="number"
                min="1"
                step="0.50"
                value={state.valor}
                onChange={handleValorChange}
                placeholder="0.00"
                className="pl-10 text-xl"
                aria-label="Valor a carregar"
                disabled={state.loading}
              />
            </div>
          </div>

          {/* Método de Recebimento */}
          <div className="space-y-2">
            <Label>Método de Recebimento</Label>
            <div className="grid gap-2">
              {Object.entries(METODOS_CARREGAMENTO).map(([key, value]) => {
                const isSelected = state.metodoCarregamento === value;
                const config: Record<string, { icon: typeof Euro; label: string; sublabel: string; className: string }> = {
                  DINHEIRO: {
                    icon: Euro,
                    label: "Dinheiro",
                    sublabel: "Recebido presencialmente",
                    className: isSelected ? "bg-primary/20 text-green-400 border border-green-600/30" : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  },
                  MBWAY: {
                    icon: Phone,
                    label: "MBWay",
                    sublabel: "Recebido via MBWay",
                    className: isSelected ? "bg-purple-600/20 text-primary border border-purple-600/30" : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  },
                  TRANSFERENCIA: {
                    icon: Building2,
                    label: "Transferência",
                    sublabel: "Transferência bancária",
                    className: isSelected ? "bg-blue-600/20 text-primary border border-blue-600/30" : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  },
                  VENDEDOR: {
                    icon: User,
                    label: "Pedir ao Vendedor",
                    sublabel: "O vendedor traz o dinheiro",
                    className: isSelected ? "bg-accent/20 text-orange-400 border border-orange-600/30" : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }
                };
                const Icon = config[key].icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleMetodoChange(value)}
                    className={`p-4 rounded-xl flex items-center gap-3 transition-all ${config[key].className}`}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Método ${config[key].label}`}
                    disabled={state.loading}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <div className="text-left">
                      <p className="font-medium">{config[key].label}</p>
                      <p className="text-xs opacity-60">{config[key].sublabel}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção de Vendedor */}
          {state.metodoCarregamento === METODOS_CARREGAMENTO.VENDEDOR && (
            <div className="space-y-2">
              <Label htmlFor="vendedor-select">Escolher Vendedor</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={handleVendedorDropdownToggle}
                  className="w-full p-4 rounded-xl bg-surface-container-low text-left flex items-center justify-between"
                  aria-expanded={state.vendedorDropdownOpen}
                  aria-haspopup="listbox"
                  aria-label="Selecionar vendedor"
                  disabled={state.loading}
                >
                  <span>{state.selectedVendedor?.nome || "Selecione um vendedor"}</span>
                  <ChevronDown className="w-5 h-5" aria-hidden="true" />
                </button>
                {state.vendedorDropdownOpen && state.vendedores.length > 0 && (
                  <div className="absolute z-10 w-full bg-surface-container-high border border-outline-variant/10 rounded-xl mt-1 max-h-48 overflow-y-auto" role="listbox">
                    {state.vendedores.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          handleVendedorSelect(v);
                          dispatch({ type: 'SET_VENDEDOR_DROPDOWN_OPEN', payload: false });
                        }}
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
              </div>
            </div>
          )}

          {/* Dados para Transferência */}
          {state.metodoCarregamento === METODOS_CARREGAMENTO.TRANSFERENCIA && state.dadosConta.iban && (
            <div className="bg-secondary/10 border border-blue-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs text-primary font-medium">Dados para Transferência:</p>
              <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
                <span className="text-xs font-mono">{state.dadosConta.iban}</span>
                <button
                  onClick={copiarIBAN}
                  className="p-1 hover:bg-surface-container-high rounded"
                  aria-label="Copiar IBAN"
                  disabled={!window.isSecureContext}
                >
                  <Copy className="w-4 h-4 text-primary" aria-hidden="true" />
                </button>
              </div>
              {state.dadosConta.nomeTitularConta && (
                <p className="text-xs text-on-surface-variant">Titular: {state.dadosConta.nomeTitularConta}</p>
              )}
            </div>
          )}

          {/* Descrição Opcional */}
          <div className="space-y-2">
            <Label htmlFor="descricao-carregamento">Descrição (opcional)</Label>
            <Input
              id="descricao-carregamento"
              value={state.descricao}
              onChange={handleDescricaoChange}
              placeholder="Ex: Venda na festa de São João"
              aria-label="Descrição do carregamento"
              disabled={state.loading}
            />
          </div>

          {/* Aviso de Transparência */}
          <div className="bg-destructive/10 border border-red-500/20 rounded-xl p-3" role="alert">
            <p className="text-xs text-red-400 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              Transparência Obrigatória
            </p>
            <p className="text-xs text-red-400/80 mt-1">
              Ao confirmar, todos os administradores e super administradores serão notificados por email e WhatsApp com os detalhes deste carregamento.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleCarregar}
            disabled={state.loading || !state.valor || safeParseFloat(state.valor, 0) <= 0}
            className="w-full py-6"
            aria-label={state.metodoCarregamento === METODOS_CARREGAMENTO.VENDEDOR
              ? `Pedir ao vendedor ${state.valor || "0"} euros`
              : `Confirmar carregamento de ${state.valor || "0"} euros`
            }
          >
            {state.loading ? (
              "A processar..."
            ) : state.metodoCarregamento === METODOS_CARREGAMENTO.VENDEDOR ? (
              `Pedir ao Vendedor (${state.valor || "0"}€)`
            ) : (
              `Confirmar Carregamento de €${state.valor || "0"}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
