export const PAYMENT_METHODS = {
  DINHEIRO: 'dinheiro',
  MBWAY: 'mbway',
  TRANSFERENCIA: 'transferencia',
  VENDEDOR: 'vendedor'
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export interface CarregarSaldoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aldeiaId?: string;
  aldeiaNome?: string;
  eventoId?: string;
  eventoNome?: string;
}

export interface User {
  id: string;
}

export interface DadosConta {
  iban?: string;
  nomeTitularConta?: string;
  telefoneMBWay?: string;
  emailPagamentos?: string;
}

export interface Vendedor {
  id: string;
  nome: string;
}

export interface CarregamentoResult {
  saldoAtual?: number;
  vendedor?: Vendedor;
  dataHora: string;
  metodoPagamento: string;
}

export interface PedidoResult {
  vendedor: Vendedor;
  valor: number;
  descricao: string;
}

// Reducer actions
export type Action =
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
export const initialState = {
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

export type CarregarSaldoState = typeof initialState;

// Reducer
export function reducer(state: CarregarSaldoState, action: Action): CarregarSaldoState {
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