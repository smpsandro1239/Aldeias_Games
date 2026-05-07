"use client";

import { useReducer, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface User {
  id: string;
  // Add other user properties if needed
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

interface State {
  loading: boolean;
  saldo: number;
  user: User | null;
  dadosConta: DadosConta;
  metodoCarregamento: "dinheiro" | "mbway" | "transferencia" | "vendedor";
  valor: string;
  descricao: string;
  comprovativo: string | null;
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
  | { type: 'SET_METODO'; payload: "dinheiro" | "mbway" | "transferencia" | "vendedor" }
  | { type: 'SET_VALOR'; payload: string }
  | { type: 'SET_DESCRICAO'; payload: string }
  | { type: 'SET_COMPROVATIVO'; payload: string | null }
  | { type: 'SET_CARREGAMENTO_RESULT'; payload: CarregamentoResult | null }
  | { type: 'SET_VENDEDORES'; payload: Vendedor[] }
  | { type: 'SET_SELECTED_VENDEDOR'; payload: Vendedor | null }
  | { type: 'SET_VENDEDOR_DROPDOWN_OPEN'; payload: boolean }
  | { type: 'SET_PEDIDO_RESULT'; payload: PedidoResult | null };

const initialState: State = {
  loading: false,
  saldo: 0,
  user: null,
  dadosConta: {},
  metodoCarregamento: "dinheiro",
  valor: "",
  descricao: "",
  comprovativo: null,
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
    case 'SET_METODO': return { ...state, metodoCarregamento: action.payload };
    case 'SET_VALOR': return { ...state, valor: action.payload };
    case 'SET_DESCRICAO': return { ...state, descricao: action.payload };
    case 'SET_COMPROVATIVO': return { ...state, comprovativo: action.payload };
    case 'SET_CARREGAMENTO_RESULT': return { ...state, carregamentoResult: action.payload };
    case 'SET_VENDEDORES': return { ...state, vendedores: action.payload };
    case 'SET_SELECTED_VENDEDOR': return { ...state, selectedVendedor: action.payload };
    case 'SET_VENDEDOR_DROPDOWN_OPEN': return { ...state, vendedorDropdownOpen: action.payload };
    case 'SET_PEDIDO_RESULT': return { ...state, pedidoResult: action.payload };
    default: return state;
  }
}

function useSaldo(userId: string) {
  const [saldo, setSaldo] = useState(0);
  useEffect(() => {
    const fetchSaldo = async () => {
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
    fetchSaldo();
  }, [userId]);
  return saldo;
}

function useDadosConta(aldeiaId?: string) {
  const [dadosConta, setDadosConta] = useState<DadosConta>({});
  useEffect(() => {
    if (!aldeiaId) return;
    const fetchDadosConta = async () => {
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
    fetchDadosConta();
  }, [aldeiaId]);
  return dadosConta;
}

function useVendedores(aldeiaId?: string, open: boolean) {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  useEffect(() => {
    if (!open || !aldeiaId) return;
    const fetchVendedores = async () => {
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
    fetchVendedores();
  }, [open, aldeiaId]);
  return vendedores;
}

export function CarregarSaldoModal({ open, onOpenChange, aldeiaId, aldeiaNome, eventoId, eventoNome }: CarregarSaldoModalProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

  const [user, setUser] = useState<User | null>(null);
  const saldo = useSaldo(user?.id || "");
  const dadosConta = useDadosConta(aldeiaId);
  const vendedores = useVendedores(aldeiaId, open);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData: User = JSON.parse(storedUser);
        setUser(userData);
      } catch (e) {
        console.error("Erro ao parsear user:", e);
      }
    }
  }, []);

  useEffect(() => {
    dispatch({ type: 'SET_SALDO', payload: saldo });
  }, [saldo]);

  useEffect(() => {
    dispatch({ type: 'SET_DADOS_CONTA', payload: dadosConta });
  }, [dadosConta]);

  useEffect(() => {
    dispatch({ type: 'SET_VENDEDORES', payload: vendedores });
  }, [vendedores]);

  const handleCarregar = async () => {
    const valorNum = parseFloat(state.valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error("Insira um valor válido");
      return;
    }

    if (valorNum < 1) {
      toast.error("Valor mínimo é 1€");
      return;
    }

    // Para pedido ao vendedor, validar seleção
    if (state.metodoCarregamento === "vendedor") {
      if (!state.selectedVendedor) {
        toast.error("Selecione um vendedor");
        return;
      }
      dispatch({ type: 'SET_LOADING', payload: true });
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
            vendedorId: state.selectedVendedor.id,
            descricao: state.descricao || `Pedido de carregamento para ${eventoNome || aldeiaNome}`,
            eventoId,
            aldeiaId
          })
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
            descricao: state.descricao || `Pedido de carregamento para ${eventoNome || aldeiaNome}`
          }
        });
        toast.success("Pedido enviado ao vendedor!");

      } catch (error) {
        console.error("Erro ao criar pedido:", error);
        toast.error("Erro ao criar pedido");
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
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
          metodoCarregamento: state.metodoCarregamento,
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
        toast.error(data.error || "Erro ao carregar saldo");
        return;
      }

      dispatch({ type: 'SET_CARREGAMENTO_RESULT', payload: data.data });
      dispatch({ type: 'SET_SALDO', payload: data.data.saldoAtual });
      toast.success("Saldo carregado com sucesso!");

    } catch (error) {
      console.error("Erro ao carregar:", error);
      toast.error("Erro ao carregar saldo");
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const copiarIBAN = () => {
    if (state.dadosConta.iban) {
      navigator.clipboard.writeText(state.dadosConta.iban);
      toast.success("IBAN copiado!");
    }
  };

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
                Todos os administradores foram notificados. O regis
                to detalhado foi guardado no sistema.
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
            <p className="font-headline text-3xl text-primary">{state.saldo.toFixed(2)}€</p>
          </div>

          <div className="space-y-2">
            <Label>Valor a Carregar</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" aria-hidden="true" />
              <Input
                type="number"
                min="1"
                step="0.50"
                value={state.valor}
                onChange={(e) => dispatch({ type: 'SET_VALOR', payload: e.target.value })}
                placeholder="0.00"
                className="pl-10 text-xl"
                aria-label="Valor a carregar"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Método de Recebimento</Label>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_METODO', payload: "dinheiro" })}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                  state.metodoCarregamento === "dinheiro"
                    ? "bg-primary/20 text-green-400 border border-green-600/30"
                    : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                }`}
                role="radio"
                aria-checked={state.metodoCarregamento === "dinheiro"}
                aria-label="Método Dinheiro"
              >
                <Euro className="w-5 h-5" aria-hidden="true" />
                <div className="text-left">
                  <p className="font-medium">Dinheiro</p>
                  <p className="text-xs opacity-60">Recebido presencialmente</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_METODO', payload: "mbway" })}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                  state.metodoCarregamento === "mbway"
                    ? "bg-purple-600/20 text-primary border border-purple-600/30"
                    : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                }`}
                role="radio"
                aria-checked={state.metodoCarregamento === "mbway"}
                aria-label="Método MBWay"
              >
                <Phone className="w-5 h-5" aria-hidden="true" />
                <div className="text-left">
                  <p className="font-medium">MBWay</p>
                  <p className="text-xs opacity-60">Recebido via MBWay</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_METODO', payload: "transferencia" })}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                  state.metodoCarregamento === "transferencia"
                    ? "bg-blue-600/20 text-primary border border-blue-600/30"
                    : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                }`}
                role="radio"
                aria-checked={state.metodoCarregamento === "transferencia"}
                aria-label="Método Transferência"
              >
                <Building2 className="w-5 h-5" aria-hidden="true" />
                <div className="text-left">
                  <p className="font-medium">Transferência</p>
                  <p className="text-xs opacity-60">Transferência bancária</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_METODO', payload: "vendedor" })}
                className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                  state.metodoCarregamento === "vendedor"
                    ? "bg-accent/20 text-orange-400 border border-orange-600/30"
                    : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                }`}
                role="radio"
                aria-checked={state.metodoCarregamento === "vendedor"}
                aria-label="Método Pedir ao Vendedor"
              >
                <User className="w-5 h-5" aria-hidden="true" />
                <div className="text-left">
                  <p className="font-medium">Pedir ao Vendedor</p>
                  <p className="text-xs opacity-60">O vendedor traz o dinheiro</p>
                </div>
              </button>
            </div>
          </div>

          {state.metodoCarregamento === "vendedor" && (
            <div className="space-y-2">
              <Label>Escolher Vendedor</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_VENDEDOR_DROPDOWN_OPEN', payload: !state.vendedorDropdownOpen })}
                  className="w-full p-4 rounded-xl bg-surface-container-low text-left flex items-center justify-between"
                  aria-expanded={state.vendedorDropdownOpen}
                  aria-haspopup="listbox"
                  aria-label="Selecionar vendedor"
                >
                  <span>{state.selectedVendedor?.nome || "Selecione um vendedor"}</span>
                  <ChevronDown className="w-5 h-5" aria-hidden="true" />
                </button>
                {state.vendedorDropdownOpen && (
                  <div className="absolute z-10 w-full bg-surface-container-high border border-outline-variant/10 rounded-xl mt-1 max-h-48 overflow-y-auto" role="listbox">
                    {state.vendedores.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'SET_SELECTED_VENDEDOR', payload: v });
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

          {state.metodoCarregamento === "transferencia" && state.dadosConta.iban && (
            <div className="bg-secondary/10 border border-blue-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs text-primary font-medium">Dados para Transferência:</p>
              <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
                <span className="text-xs font-mono">{state.dadosConta.iban}</span>
                <button onClick={copiarIBAN} className="p-1 hover:bg-surface-container-high rounded" aria-label="Copiar IBAN">
                  <Copy className="w-4 h-4 text-primary" aria-hidden="true" />
                </button>
              </div>
              {state.dadosConta.nomeTitularConta && (
                <p className="text-xs text-on-surface-variant">Titular: {state.dadosConta.nomeTitularConta}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              value={state.descricao}
              onChange={(e) => dispatch({ type: 'SET_DESCRICAO', payload: e.target.value })}
              placeholder="Ex: Venda na festa de São João"
              aria-label="Descrição opcional"
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
            disabled={state.loading || !state.valor || parseFloat(state.valor) <= 0}
            className="w-full py-6 sticky bottom-0"
            aria-label={state.metodoCarregamento === "vendedor" ? `Pedir ao vendedor ${state.valor || "0"} euros` : `Confirmar carregamento de ${state.valor || "0"} euros`}
          >
            {state.loading ? "A processar..." : state.metodoCarregamento === "vendedor" ? `Pedir ao Vendedor (${state.valor || "0"}€)` : `Confirmar Carregamento de €${state.valor || "0"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
