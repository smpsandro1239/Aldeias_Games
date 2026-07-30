export const GAME_TYPES = {
  POIO_DA_VACA: 'poio_da_vaca',
  RIFA: 'rifa',
  EUROMILHOES: 'euromilhoes',
  RASPADINHA: 'raspadinha'
} as const;

export type GameType = typeof GAME_TYPES[keyof typeof GAME_TYPES];

export const safeParseFloat = (val: string | number, fallback: number = 0): number => {
  const parsed = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

export const safeParseInt = (val: string | number, fallback: number = 0): number => {
  const parsed = typeof val === 'number' ? val : parseInt(val.toString());
  return isNaN(parsed) ? fallback : parsed;
};

export interface Premio {
  id: string;
  nome: string;
  valorDinheiroAlternative: number;
  percentagem: number;
}

export interface JogoFormData {
  nome: string;
  tipo: GameType;
  descricao: string;
  preco: string;
  stockInicial: string;
  limitePorUsuario: string;
  numeroInicial: string;
  numeroFinal: string;
  modoSorteio: "app" | "externo";
  detalhesSorteioExterno: string;
  raspadinhaTitulo: string;
  raspadinhaSubtitulo: string;
  dimensoesX: string;
  dimensoesY: string;
  custoQuadrado: string;
  valorMercadoVaca: string;
  valorCompraVaca: string;
  dataSorteio: string;
  horaSorteio: string;
  localSorteio: string;
  numeroBlocos: string;
  permitirStripe: boolean;
  valorPremios: string;
  raspadinhaMaxGanhadores: string;
  raspadinhaMaxPremioTotal: string;
}

export interface JogoMetrics {
  isLucrativo: boolean;
  totalPercentagem?: number;
  lucroMinimo?: number;
  custoMedioPorBilhete?: number;
  receitaTotal?: number;
  lucroEstimado?: number;
  margemLucro?: number;
  totalPremios?: number;
  totalQuadrados?: number;
}

export interface JogoData {
  id?: string;
  nome: string;
  tipo: GameType;
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
  lucroMinimoPercent?: number;
  custoMedioPrevisto?: number;
  receitaEsperada?: number;
  lucroLiquidoPrevisto?: number;
}

export interface CreateJogoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JogoData) => Promise<void>;
  eventoId?: string;
  initialData?: JogoData;
  userRole?: string;
  aldeiaId?: string;
  metodosPagamentoDefault?: string[];
}

// Reducer actions
export type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_TRANSPARENCY'; payload: boolean }
  | { type: 'SET_SUBMITTED_DATA'; payload: JogoData | null }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<JogoFormData> }
  | { type: 'SET_RASPADINHA_PREMIOS'; payload: Premio[] }
  | { type: 'SET_RIFA_PREMIOS'; payload: Premio[] }
  | { type: 'RESET_FORM' };

export function buildJogoData(
  formData: JogoFormData,
  raspadinhaPremios: Premio[],
  rifaPremios: Premio[],
  eventoId: string
): JogoData {
  if (!eventoId) {
    throw new Error("Selecione um evento antes de criar o jogo");
  }
  const config: Record<string, unknown> = {
    numeroInicial: safeParseInt(formData.numeroInicial, 1),
    numeroFinal: safeParseInt(formData.numeroFinal, 1000),
    modoSorteio: formData.modoSorteio,
    detalhesSorteioExterno: formData.detalhesSorteioExterno,
  };

  if (formData.tipo === GAME_TYPES.RIFA || formData.tipo === GAME_TYPES.EUROMILHOES) {
    config.dataSorteio = formData.dataSorteio;
    config.horaSorteio = formData.horaSorteio;
    config.localSorteio = formData.localSorteio;
    config.numeroBlocos = safeParseInt(formData.numeroBlocos, 1);
    config.permitirStripe = formData.permitirStripe;
    config.valorPremios = formData.valorPremios ? safeParseFloat(formData.valorPremios) : null;
  }

  if (formData.tipo === GAME_TYPES.POIO_DA_VACA) {
    config.dimensoesX = safeParseInt(formData.dimensoesX, 10);
    config.dimensoesY = safeParseInt(formData.dimensoesY, 10);
    config.custoQuadrado = safeParseFloat(formData.custoQuadrado, 5);
    config.valorMercadoVaca = safeParseFloat(formData.valorMercadoVaca, 1000);
    config.valorCompraVaca = safeParseFloat(formData.valorCompraVaca, 800);
  }

  if (formData.tipo === GAME_TYPES.RASPADINHA) {
    config.titulo = formData.raspadinhaTitulo;
    config.subtitulo = formData.raspadinhaSubtitulo;
    config.premios = raspadinhaPremios.filter(p => p.nome.trim() && p.valorDinheiroAlternative > 0);
    const maxGanhadores = safeParseInt(formData.raspadinhaMaxGanhadores, 0);
    if (maxGanhadores > 0) {
      config.maxGanhadores = maxGanhadores;
    }
    const maxPremioTotal = safeParseInt(formData.raspadinhaMaxPremioTotal, 0);
    if (maxPremioTotal > 0) {
      config.maxPremioTotal = maxPremioTotal;
    }
  }

  let premiosData: Array<{nome: string; valorDinheiroAlternative: number; percentagem?: number; ordem: number}> = [];

  if (formData.tipo === GAME_TYPES.RASPADINHA) {
    premiosData = raspadinhaPremios
      .filter(p => p.nome.trim() && p.valorDinheiroAlternative > 0)
      .map((p, idx) => ({
        nome: p.nome,
        valorDinheiroAlternative: p.valorDinheiroAlternative,
        percentagem: p.percentagem,
        ordem: idx
      }));
  } else if (formData.tipo === GAME_TYPES.RIFA || formData.tipo === GAME_TYPES.EUROMILHOES) {
    premiosData = rifaPremios
      .filter(p => p.nome.trim() && p.valorDinheiroAlternative > 0)
      .map((p, idx) => ({
        nome: p.nome,
        valorDinheiroAlternative: p.valorDinheiroAlternative,
        ordem: idx
      }));
  }

  return {
    nome: formData.nome,
    tipo: formData.tipo,
    descricao: formData.descricao,
    preco: safeParseFloat(formData.preco, 0),
    stockInicial: safeParseInt(formData.stockInicial, 100),
    limitePorUsuario: safeParseInt(formData.limitePorUsuario, 0),
    eventoId,
    configuracao: config,
    modoSorteio: formData.modoSorteio,
    detalhesSorteioExterno: formData.detalhesSorteioExterno,
    premios: premiosData,
    custoQuadrado: formData.tipo === GAME_TYPES.POIO_DA_VACA ? safeParseFloat(formData.custoQuadrado) : undefined,
    valorMercadoVaca: formData.tipo === GAME_TYPES.POIO_DA_VACA ? safeParseFloat(formData.valorMercadoVaca) : undefined,
    valorCompraVaca: formData.tipo === GAME_TYPES.POIO_DA_VACA ? safeParseFloat(formData.valorCompraVaca) : undefined,
  };
}

export function getTransparencyData(formData: JogoFormData, raspadinhaPremios: Premio[], rifaPremios: Premio[]) {
  switch (formData.tipo) {
    case GAME_TYPES.RASPADINHA:
      return {
        tipoJogo: GAME_TYPES.RASPADINHA,
        nome: formData.nome || "Raspadinha",
        preco: safeParseFloat(formData.preco, 0),
        stock: safeParseInt(formData.stockInicial, 0),
        premios: raspadinhaPremios
          .filter(p => p.nome.trim() || p.valorDinheiroAlternative > 0)
          .map(p => ({
            nome: p.nome || "Prémio",
            valor: p.valorDinheiroAlternative,
            percentagem: p.percentagem
          }))
      };
    case GAME_TYPES.RIFA:
    case GAME_TYPES.EUROMILHOES:
      return {
        tipoJogo: formData.tipo,
        nome: formData.nome || (formData.tipo === GAME_TYPES.EUROMILHOES ? "Euromilhões" : "Rifa"),
        preco: safeParseFloat(formData.preco, 0),
        stock: safeParseInt(formData.stockInicial, 0),
        premios: rifaPremios
          .filter(p => p.nome.trim() || p.valorDinheiroAlternative > 0)
          .map(p => ({
            nome: p.nome || "Prémio",
            valor: p.valorDinheiroAlternative
          }))
      };
    case GAME_TYPES.POIO_DA_VACA:
      return {
        tipoJogo: GAME_TYPES.POIO_DA_VACA,
        nome: formData.nome || "Poio da Vaca",
        preco: safeParseFloat(formData.custoQuadrado, 0),
        premios: [{
          nome: "Valor da Vaca",
          valor: safeParseFloat(formData.valorCompraVaca, 0)
        }],
        dimensoesX: safeParseInt(formData.dimensoesX, 0),
        dimensoesY: safeParseInt(formData.dimensoesY, 0),
        custoQuadrado: safeParseFloat(formData.custoQuadrado, 0),
        valorCompraVaca: safeParseFloat(formData.valorCompraVaca, 0)
      };
    default:
      return {
        tipoJogo: GAME_TYPES.RASPADINHA,
        nome: "Jogo",
        preco: 0,
        stock: 0,
        premios: []
      };
  }
}
