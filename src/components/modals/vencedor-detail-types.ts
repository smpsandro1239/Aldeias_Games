export interface Vencedor {
  id: string;
  jogo?: {
    id?: string;
    nome?: string;
    tipo?: string;
    preco?: number;
    evento?: {
      id?: string;
      nome?: string;
      aldeia?: {
        id?: string;
        nome?: string;
      };
    };
    premios?: {
      id?: string;
      nome?: string;
      ordem?: number;
      valorDinheiroAlternative?: number | null;
    }[];
  };
  nomeCliente?: string;
  telefoneCliente?: string;
  emailCliente?: string;
  user?: {
    id?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    saldo?: number;
  };
  participacaoId?: string;
  createdAt: string;
  premioEntregue: boolean;
  ganhador?: boolean;
  valorPago?: number;
  resultadoRaspe?: string | null;
  dadosParticipacao?: string | null;
  alteracoes?: {
    id?: string;
    tipoAlteracao?: string;
    motivo?: string | null;
    dadosAnteriores?: string | null;
    createdAt?: string;
    user?: {
      id?: string;
      nome?: string;
      email?: string;
    };
  }[];
  dadosVencedor?: {
    userId?: string;
    userNome?: string;
    userEmail?: string;
    userTelefone?: string;
    letra?: number;
    numero?: number;
  };
}

export interface Participacao {
  id: string;
  jogo?: {
    nome?: string;
    tipo?: string;
  };
  createdAt: string;
  valorPago: number;
  ganhador: boolean;
}

export interface UserData {
  id: string;
  nome?: string;
  email?: string;
  telefone?: string;
  saldo?: number;
  aldeiaId?: string;
}

export interface AldeiaData {
  id: string;
  nome?: string;
}

export interface VencedorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vencedor: Vencedor | null;
  onConvertPrize: (vencedor: Vencedor) => void;
  onEntregaPremio: (vencedor: Vencedor) => void;
}

export interface WonPrize {
  nome: string;
  valor: number;
}

export interface Estatisticas {
  total: number;
  vitorias: number;
  investido: number;
  percentual: string;
}

export const ENTREGA_TIPO_LABEL: Record<string, string> = {
  entrega_premio: "Entregue",
  convert_prize: "Convertido em saldo",
  claim: "Reclamado (carteira)",
  claim_cofre: "Entregue ao cofre",
  claim_jogar_novamente: "Convertido para jogar",
  claim_pagar_cliente: "Pago ao cliente",
  desfazer_entrega_premio: "Entrega anulada",
};