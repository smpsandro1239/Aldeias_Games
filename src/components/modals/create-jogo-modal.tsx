"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Euro,
  Percent,
  Trophy
} from "lucide-react";
import { useEffect, useMemo, useReducer, useCallback } from "react";
import { toast } from "sonner";
import { TransparencyModal } from "./transparency-modal";

// Constants for game types to avoid magic strings
const GAME_TYPES = {
  POIO_DA_VACA: 'poio_da_vaca',
  RIFA: 'rifa',
  EUROMILHOES: 'euromilhoes',
  RASPADINHA: 'raspadinha'
} as const;

type GameType = typeof GAME_TYPES[keyof typeof GAME_TYPES];

// Safe parsing helpers
const safeParseFloat = (val: string | number, fallback: number = 0): number => {
  const parsed = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

const safeParseInt = (val: string | number, fallback: number = 0): number => {
  const parsed = typeof val === 'number' ? val : parseInt(val.toString());
  return isNaN(parsed) ? fallback : parsed;
};

interface Premio {
  id: string;
  nome: string;
  valorDinheiroAlternative: number;
  percentagem: number;
}

interface JogoFormData {
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
  raspadinhaOrganizacao: string;
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
}

interface JogoMetrics {
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

interface CreateJogoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JogoData) => Promise<void>;
  eventoId?: string;
  initialData?: JogoData;
  userRole?: string;
  token?: string;
  aldeiaId?: string;
  metodosPagamentoDefault?: string[];
}

// Reducer actions
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SHOW_TRANSPARENCY'; payload: boolean }
  | { type: 'SET_SUBMITTED_DATA'; payload: JogoData | null }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<JogoFormData> }
  | { type: 'SET_RASPADINHA_PREMIOS'; payload: Premio[] }
  | { type: 'SET_RIFA_PREMIOS'; payload: Premio[] }
  | { type: 'RESET_FORM' };

// Initial state
const getInitialState = (initialData?: JogoData) => ({
  loading: false,
  showTransparency: false,
  submittedData: null as JogoData | null,
  formData: {
    nome: initialData?.nome || "",
    tipo: (initialData?.tipo || GAME_TYPES.RASPADINHA) as GameType,
    descricao: initialData?.descricao || "",
    preco: initialData?.preco?.toString() || "2",
    stockInicial: initialData?.stockInicial?.toString() || "100",
    limitePorUsuario: initialData?.limitePorUsuario?.toString() || "10",
    numeroInicial: "1",
    numeroFinal: "1000",
    modoSorteio: (initialData?.modoSorteio || "app") as "app" | "externo",
    detalhesSorteioExterno: initialData?.detalhesSorteioExterno || "",
    raspadinhaTitulo: "RASPADINHA DA SORTE",
    raspadinhaSubtitulo: "Raspe com o dedo para revelar o seu prémio!",
    raspadinhaOrganizacao: "",
    dimensoesX: "10",
    dimensoesY: "10",
    custoQuadrado: "5",
    valorMercadoVaca: "1000",
    valorCompraVaca: "800",
    dataSorteio: "",
    horaSorteio: "",
    localSorteio: "",
    numeroBlocos: "1",
    permitirStripe: false,
    valorPremios: "",
  } as JogoFormData,
  raspadinhaPremios: initialData?.premios && initialData.tipo === GAME_TYPES.RASPADINHA
    ? initialData.premios.map((p, i) => ({
        id: String(i + 1),
        nome: p.nome || "",
        valorDinheiroAlternative: p.valorDinheiroAlternative || 0,
        percentagem: p.percentagem || 0,
      }))
    : [
        { id: "1", nome: "3x Presunto", valorDinheiroAlternative: 50, percentagem: 2 },
        { id: "2", nome: "3x Tabua de Queijos", valorDinheiroAlternative: 25, percentagem: 5 },
        { id: "3", nome: "Valor da Raspadinha", valorDinheiroAlternative: 2, percentagem: 10 },
      ],
  rifaPremios: initialData?.premios && initialData.tipo !== GAME_TYPES.RASPADINHA
    ? initialData.premios.map((p, i) => ({
        id: String(i + 1),
        nome: p.nome || "",
        valorDinheiroAlternative: p.valorDinheiroAlternative || 0,
        percentagem: 0,
      }))
    : [{ id: "1", nome: "1º Prémio", valorDinheiroAlternative: 0, percentagem: 0 }],
});

// Reducer function
function jogoFormReducer(state: ReturnType<typeof getInitialState>, action: Action): ReturnType<typeof getInitialState> {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SHOW_TRANSPARENCY':
      return { ...state, showTransparency: action.payload };
    case 'SET_SUBMITTED_DATA':
      return { ...state, submittedData: action.payload };
    case 'UPDATE_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_RASPADINHA_PREMIOS':
      return { ...state, raspadinhaPremios: action.payload };
    case 'SET_RIFA_PREMIOS':
      return { ...state, rifaPremios: action.payload };
    case 'RESET_FORM':
      return getInitialState();
    default:
      return state;
  }
}

// Hook customizado para gerenciar estado do jogo
function useJogoForm(initialData?: JogoData) {
  const [state, dispatch] = useReducer(jogoFormReducer, getInitialState(initialData));

  const updateFormData = useCallback((updates: Partial<JogoFormData>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: updates });
  }, []);

  const setRaspadinhaPremios = useCallback((premios: Premio[]) => {
    dispatch({ type: 'SET_RASPADINHA_PREMIOS', payload: premios });
  }, []);

  const setRifaPremios = useCallback((premios: Premio[]) => {
    dispatch({ type: 'SET_RIFA_PREMIOS', payload: premios });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setShowTransparency = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_TRANSPARENCY', payload: show });
  }, []);

  const setSubmittedData = useCallback((data: JogoData | null) => {
    dispatch({ type: 'SET_SUBMITTED_DATA', payload: data });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  // Cálculos memoizados
  const preco = useMemo(() => safeParseFloat(state.formData.preco), [state.formData.preco]);
  const stock = useMemo(() => safeParseInt(state.formData.stockInicial), [state.formData.stockInicial]);

  const expectedCountMap = useMemo(() => {
    const map = new Map<string, number>();
    state.raspadinhaPremios.forEach(p => {
      map.set(p.id, Math.round(stock * (p.percentagem || 0) / 100));
    });
    return map;
  }, [state.raspadinhaPremios, stock]);

  const metricsRaspadinha = useMemo(() => {
    const totalPercentagem = state.raspadinhaPremios.reduce((acc, p) => acc + p.percentagem, 0);
    const lucroMinimo = 100 - totalPercentagem;
    const custoMedioPorBilhete = state.raspadinhaPremios.reduce((acc, p) => {
      return acc + (p.valorDinheiroAlternative * p.percentagem / 100);
    }, 0);
    const receitaTotal = preco * stock;
    const custoTotalEstimado = custoMedioPorBilhete * stock;
    const lucroEstimado = receitaTotal - custoTotalEstimado;
    const margemLucro = receitaTotal > 0 ? (lucroEstimado / receitaTotal) * 100 : 0;

    return {
      totalPercentagem,
      lucroMinimo,
      custoMedioPorBilhete,
      receitaTotal,
      custoTotalEstimado,
      lucroEstimado,
      margemLucro,
      isLucrativo: lucroMinimo >= 50
    };
  }, [state.raspadinhaPremios, preco, stock]);

  const metricsRifa = useMemo(() => {
    const totalPremios = state.rifaPremios.reduce((acc, p) => acc + p.valorDinheiroAlternative, 0);
    const receitaTotal = preco * stock;
    const lucroEstimado = receitaTotal - totalPremios;
    const margemLucro = receitaTotal > 0 ? (lucroEstimado / receitaTotal) * 100 : 0;

    return {
      totalPremios,
      receitaTotal,
      lucroEstimado,
      margemLucro,
      isLucrativo: margemLucro >= 50
    };
  }, [state.rifaPremios, preco, stock]);

  const metricsPoioDaVaca = useMemo(() => {
    const dimensoesX = safeParseInt(state.formData.dimensoesX);
    const dimensoesY = safeParseInt(state.formData.dimensoesY);
    const custoQuadrado = safeParseFloat(state.formData.custoQuadrado);
    const valorCompraVaca = safeParseFloat(state.formData.valorCompraVaca);

    const totalQuadrados = dimensoesX * dimensoesY;
    const receitaTotal = totalQuadrados * custoQuadrado;
    const lucroEstimado = receitaTotal - valorCompraVaca;
    const margemLucro = receitaTotal > 0 ? (lucroEstimado / receitaTotal) * 100 : 0;

    return {
      totalQuadrados,
      receitaTotal,
      valorCompraVaca,
      lucroEstimado,
      margemLucro,
      isLucrativo: margemLucro >= 50
    };
  }, [state.formData.dimensoesX, state.formData.dimensoesY, state.formData.custoQuadrado, state.formData.valorCompraVaca]);

  const getMetrics = useCallback((): JogoMetrics => {
    switch (state.formData.tipo) {
      case GAME_TYPES.RASPADINHA:
        return metricsRaspadinha;
      case GAME_TYPES.RIFA:
      case GAME_TYPES.EUROMILHOES:
        return metricsRifa;
      case GAME_TYPES.POIO_DA_VACA:
        return metricsPoioDaVaca;
      default:
        return { isLucrativo: false };
    }
  }, [state.formData.tipo, metricsRaspadinha, metricsRifa, metricsPoioDaVaca]);

  const isLucrativo = getMetrics().isLucrativo;

  // Handlers
  const handlePremioRaspadinhaChange = useCallback((id: string, field: keyof Premio, value: string | number) => {
    setRaspadinhaPremios(
      state.raspadinhaPremios.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  }, [state.raspadinhaPremios, setRaspadinhaPremios]);

  const handlePremioRifaChange = useCallback((id: string, field: keyof Premio, value: string | number) => {
    setRifaPremios(
      state.rifaPremios.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  }, [state.rifaPremios, setRifaPremios]);

  const adicionarPremioRaspadinha = useCallback(() => {
    setRaspadinhaPremios([
      ...state.raspadinhaPremios,
      { id: Date.now().toString(), nome: "", valorDinheiroAlternative: 0, percentagem: 0 }
    ]);
  }, [state.raspadinhaPremios, setRaspadinhaPremios]);

  const adicionarPremioRifa = useCallback(() => {
    setRifaPremios([
      ...state.rifaPremios,
      { id: Date.now().toString(), nome: "", valorDinheiroAlternative: 0, percentagem: 0 }
    ]);
  }, [state.rifaPremios, setRifaPremios]);

  const removerPremioRaspadinha = useCallback((id: string) => {
    if (state.raspadinhaPremios.length > 1) {
      setRaspadinhaPremios(state.raspadinhaPremios.filter(p => p.id !== id));
    }
  }, [state.raspadinhaPremios, setRaspadinhaPremios]);

  const removerPremioRifa = useCallback((id: string) => {
    if (state.rifaPremios.length > 1) {
      setRifaPremios(state.rifaPremios.filter(p => p.id !== id));
    }
  }, [state.rifaPremios, setRifaPremios]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação específica: soma das percentagens raspadinha <= 100%
    if (state.formData.tipo === GAME_TYPES.RASPADINHA && state.raspadinhaPremios.length > 0) {
      const totalPercentagem = state.raspadinhaPremios.reduce((sum, p) => sum + (p.percentagem || 0), 0);
      if (totalPercentagem > 100) {
        toast.error(`A soma das percentagens dos prémios (${totalPercentagem}%) não pode exceder 100%`);
        return;
      }
    }

    // Validação específica para rifa: intervalo numérico
    if (state.formData.tipo === GAME_TYPES.RIFA) {
      const numInicial = safeParseInt(state.formData.numeroInicial, 1);
      const numFinal = safeParseInt(state.formData.numeroFinal, 1000);
      const stock = safeParseInt(state.formData.stockInicial, 100);

      if (numFinal <= numInicial) {
        toast.error('Número final deve ser maior que número inicial para rifa');
        return;
      }

      const intervalo = numFinal - numInicial + 1;
      if (intervalo < stock) {
        toast.error('Stock inicial excede o intervalo numérico disponível');
        return;
      }
    }

    const jogoData = buildJogoData(state.formData, state.raspadinhaPremios, state.rifaPremios, "");
    setSubmittedData(jogoData);
    setShowTransparency(true);
  }, [state.formData, state.raspadinhaPremios, state.rifaPremios, setSubmittedData, setShowTransparency]);

  return {
    ...state,
    updateFormData,
    setRaspadinhaPremios,
    setRifaPremios,
    setLoading,
    setShowTransparency,
    setSubmittedData,
    resetForm,
    preco,
    stock,
    expectedCountMap,
    metricsRaspadinha,
    metricsRifa,
    metricsPoioDaVaca,
    getMetrics,
    isLucrativo,
    handlePremioRaspadinhaChange,
    handlePremioRifaChange,
    adicionarPremioRaspadinha,
    adicionarPremioRifa,
    removerPremioRaspadinha,
    removerPremioRifa,
    handleSubmit,
  };
}

// Função auxiliar para construir dados do jogo
function buildJogoData(
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
    config.organizacao = formData.raspadinhaOrganizacao;
    config.premios = raspadinhaPremios.filter(p => p.nome.trim() && p.valorDinheiroAlternative > 0);
  }

  let premiosData: Array<{nome: string; valorDinheiroAlternative: number; percentagem?: number; ordem: number}> = [];
  let metrics = {} as JogoMetrics;

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
    limitePorUsuario: safeParseInt(formData.limitePorUsuario, 10),
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

// Função auxiliar para dados de transparência
function getTransparencyData(formData: JogoFormData, raspadinhaPremios: Premio[], rifaPremios: Premio[]) {
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

export function CreateJogoModal({
  open,
  onOpenChange,
  onSubmit,
  eventoId: propEventoId,
  initialData,
  userRole,
  token,
  aldeiaId,
  metodosPagamentoDefault
}: CreateJogoModalProps) {
  const {
    formData,
    raspadinhaPremios,
    rifaPremios,
    loading,
    showTransparency,
    submittedData,
    updateFormData,
    setRaspadinhaPremios,
    setRifaPremios,
    setLoading,
    setShowTransparency,
    setSubmittedData,
    resetForm,
    expectedCountMap,
    metricsRaspadinha,
    metricsRifa,
    metricsPoioDaVaca,
    getMetrics,
    isLucrativo,
    handlePremioRaspadinhaChange,
    handlePremioRifaChange,
    adicionarPremioRaspadinha,
    adicionarPremioRifa,
    removerPremioRaspadinha,
    removerPremioRifa,
    handleSubmit,
  } = useJogoForm(initialData);

  const handleConfirmCreate = useCallback(async () => {
    if (!submittedData) return;

    setLoading(true);
    try {
      await onSubmit(submittedData);
      setShowTransparency(false);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao criar jogo:", error);
      toast.error("Erro ao criar jogo");
    } finally {
      setLoading(false);
    }
  }, [submittedData, onSubmit, setLoading, setShowTransparency, onOpenChange, resetForm]);

  // Reset form quando modal fecha
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const renderLucratividadeCard = useCallback(() => {
    const m = getMetrics();

    return (
      <div className={`p-4 rounded-xl border-2 ${m.isLucrativo ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Calculator className={`w-5 h-5 ${m.isLucrativo ? 'text-green-500' : 'text-red-500'}`} />
          <h4 className={`font-bold ${m.isLucrativo ? 'text-green-500' : 'text-red-500'}`}>
            {m.isLucrativo ? '✅ Lucrativo' : '? Não Lucrativo'}
          </h4>
        </div>

        {formData.tipo === GAME_TYPES.RASPADINHA && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">% Total Prémios:</span>
              <span className={metricsRaspadinha.totalPercentagem! > 50 ? "text-red-500" : ""}>
                {metricsRaspadinha.totalPercentagem}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lucro Mínimo:</span>
              <span className={metricsRaspadinha.lucroMinimo! >= 50 ? "text-green-500" : "text-red-500"}>
                {metricsRaspadinha.lucroMinimo}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo Médio/Bilhete:</span>
              <span className="font-bold text-[#ff734b]">{metricsRaspadinha.custoMedioPorBilhete!.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receita (100 bilhetes):</span>
              <span className="font-bold">{metricsRaspadinha.receitaTotal!.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lucro Estimado:</span>
              <span className={metricsRaspadinha.lucroEstimado! >= 0 ? "text-green-500" : "text-red-500"}>
                {metricsRaspadinha.lucroEstimado!.toFixed(2)}€
              </span>
            </div>
          </div>
        )}

              {(formData.tipo === GAME_TYPES.RIFA) && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Prémios:</span>
              <span className="font-bold text-[#ff734b]">{metricsRifa.totalPremios!.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receita Total:</span>
              <span className="font-bold">{metricsRifa.receitaTotal!.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lucro:</span>
              <span className={metricsRifa.lucroEstimado! >= 0 ? "text-green-500" : "text-red-500"}>
                {metricsRifa.lucroEstimado!.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margem:</span>
              <span className={metricsRifa.margemLucro! >= 50 ? "text-green-500" : "text-red-500"}>
                {metricsRifa.margemLucro!.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {formData.tipo === GAME_TYPES.POIO_DA_VACA && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Quadrados:</span>
              <span className="font-bold">{metricsPoioDaVaca.totalQuadrados}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receita Total:</span>
              <span className="font-bold">{metricsPoioDaVaca.receitaTotal!.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo Vaca:</span>
              <span className="font-bold text-[#ff734b]">{metricsPoioDaVaca.valorCompraVaca!.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lucro:</span>
              <span className={metricsPoioDaVaca.lucroEstimado! >= 0 ? "text-green-500" : "text-red-500"}>
                {metricsPoioDaVaca.lucroEstimado!.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margem:</span>
              <span className={metricsPoioDaVaca.margemLucro! >= 50 ? "text-green-500" : "text-red-500"}>
                {metricsPoioDaVaca.margemLucro!.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }, [formData.tipo, getMetrics, metricsRaspadinha, metricsRifa, metricsPoioDaVaca]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto" aria-describedby="create-jogo-description">
          <DialogHeader>
            <DialogTitle>{initialData ? "Editar Jogo" : "Novo Jogo"}</DialogTitle>
            <DialogDescription id="create-jogo-description">
              {initialData ? "Edite as Informações do jogo." : "Crie um novo jogo para este evento."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Jogo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: GameType) =>
                    updateFormData({ tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GAME_TYPES.RASPADINHA}>Raspadinha</SelectItem>
                    <SelectItem value={GAME_TYPES.RIFA}>Rifa</SelectItem>
                    <SelectItem value={GAME_TYPES.EUROMILHOES}>Euromilhões</SelectItem>
                    <SelectItem value={GAME_TYPES.POIO_DA_VACA}>Poio da Vaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Jogo *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Rifa da Festa"
                  value={formData.nome}
                  onChange={(e) => updateFormData({ nome: e.target.value })}
                  required
                />
              </div>

              {(formData.tipo === GAME_TYPES.RIFA || formData.tipo === GAME_TYPES.RASPADINHA) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="preco">Preço (€) *</Label>
                    <Input
                      id="preco"
                      type="number"
                      min="0.5"
                      step="0.01"
                      value={formData.preco}
                      onChange={(e) => updateFormData({ preco: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stockInicial">Stock Total *</Label>
                    <Input
                      id="stockInicial"
                      type="number"
                      min="1"
                      value={formData.stockInicial}
                      onChange={(e) => updateFormData({ stockInicial: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {formData.tipo === GAME_TYPES.RASPADINHA && (
                <>
                  <div className="border-t pt-4 mt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Configuração da Raspadinha</h3>
                      <Badge variant={isLucrativo ? "default" : "destructive"} className={isLucrativo ? "bg-green-500" : ""}>
                        {isLucrativo ? `${metricsRaspadinha.lucroMinimo}% lucro` : "Lucre baixo!"}
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="raspadinhaTitulo">Título</Label>
                        <Input
                          id="raspadinhaTitulo"
                          placeholder="Ex: RASPADINHA DA FESTA"
                          value={formData.raspadinhaTitulo}
                          onChange={(e) => updateFormData({ raspadinhaTitulo: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="raspadinhaOrganizacao">Organização</Label>
                        <Input
                          id="raspadinhaOrganizacao"
                          placeholder="Ex: Junta de Freguesia"
                          value={formData.raspadinhaOrganizacao}
                          onChange={(e) => updateFormData({ raspadinhaOrganizacao: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="bg-[#1f1b19] rounded-xl p-4 space-y-4 border border-[#ff734b]/20">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#ff734b]">Prémios e Percentagens</h4>
                        <Button type="button" variant="outline" size="sm" onClick={adicionarPremioRaspadinha}>
                          + Prémio
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {raspadinhaPremios.map((premio) => (
                          <div key={premio.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-[#2e2928] rounded-lg">
                            <div className="col-span-1 flex items-center justify-center">
                              <Trophy className="h-4 w-4 text-[#ff734b]" />
                            </div>
                            <div className="col-span-4">
                              <Input
                                placeholder="Nome"
                                value={premio.nome}
                                onChange={(e) => handlePremioRaspadinhaChange(premio.id, "nome", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="col-span-3">
                              <div className="relative">
                                <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                <Input
                                  type="number"
                                  placeholder="Valor"
                                  value={premio.valorDinheiroAlternative || ""}
                                  onChange={(e) => handlePremioRaspadinhaChange(premio.id, "valorDinheiroAlternative", safeParseFloat(e.target.value, 0))}
                                  className="h-8 text-sm pl-7"
                                />
                              </div>
                            </div>
                            <div className="col-span-3">
                              <div className="relative">
                                <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                <Input
                                  type="number"
                                  placeholder="%"
                                  min="0"
                                  max="50"
                                  value={premio.percentagem || ""}
                                  onChange={(e) => handlePremioRaspadinhaChange(premio.id, "percentagem", safeParseFloat(e.target.value, 0))}
                                  className="h-8 text-sm pl-7"
                                />
                              </div>
                              {premio.percentagem > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  ~{expectedCountMap.get(premio.id) || 0} prémios esperados
                                </p>
                              )}
                            </div>
                            <div className="col-span-1 flex justify-center">
                              {raspadinhaPremios.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500"
                                  onClick={() => removerPremioRaspadinha(premio.id)}
                                >
                                  🗑️
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </>
              )}

        {(formData.tipo === GAME_TYPES.RIFA) && (
                <>
                  <div className="border-t pt-4 mt-2 space-y-4">
                    <h3 className="text-sm font-semibold">Prémios</h3>

                    <div className="space-y-3">
                      {rifaPremios.map((premio) => (
                        <div key={premio.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-[#2e2928] rounded-lg">
                          <div className="col-span-1 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-[#ff734b]" />
                          </div>
                          <div className="col-span-6">
                            <Input
                              placeholder="Nome do Prémio"
                              value={premio.nome}
                              onChange={(e) => handlePremioRifaChange(premio.id, "nome", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="col-span-4">
                            <div className="relative">
                              <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="Valor"
                                value={premio.valorDinheiroAlternative || ""}
                                onChange={(e) => handlePremioRifaChange(premio.id, "valorDinheiroAlternative", safeParseFloat(e.target.value, 0))}
                                className="h-8 text-sm pl-7"
                              />
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500"
                              onClick={() => removerPremioRifa(premio.id)}
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button type="button" variant="outline" size="sm" onClick={adicionarPremioRifa}>
                      + Adicionar Prémio
                    </Button>
                  </div>
                </>
              )}

              {formData.tipo === GAME_TYPES.POIO_DA_VACA && (
                <div className="border-t pt-4 mt-2 space-y-4">
                  <h3 className="text-sm font-semibold">Configuração do Campo</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dimensoesX">Largura (X)</Label>
                      <Input
                        id="dimensoesX"
                        type="number"
                        min="2"
                        max="20"
                        value={formData.dimensoesX}
                        onChange={(e) => updateFormData({ dimensoesX: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dimensoesY">Altura (Y)</Label>
                      <Input
                        id="dimensoesY"
                        type="number"
                        min="2"
                        max="20"
                        value={formData.dimensoesY}
                        onChange={(e) => updateFormData({ dimensoesY: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="custoQuadrado">Custo por Quadrado (€)</Label>
                      <Input
                        id="custoQuadrado"
                        type="number"
                        min="1"
                        step="0.5"
                        value={formData.custoQuadrado}
                        onChange={(e) => updateFormData({ custoQuadrado: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valorCompraVaca">Valor da Vaca (€)</Label>
                      <Input
                        id="valorCompraVaca"
                        type="number"
                        min="0"
                        value={formData.valorCompraVaca}
                        onChange={(e) => updateFormData({ valorCompraVaca: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.tipo !== GAME_TYPES.POIO_DA_VACA && (
                <div className="border-t pt-4 mt-2">
                  {renderLucratividadeCard()}
                </div>
              )}

              {formData.tipo === GAME_TYPES.POIO_DA_VACA && (
                <div className="border-t pt-4 mt-2">
                  {renderLucratividadeCard()}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !isLucrativo || !formData.nome.trim()}
                className={isLucrativo ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {loading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Jogo")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TransparencyModal
        open={showTransparency}
        onOpenChange={setShowTransparency}
        onConfirm={handleConfirmCreate}
        data={getTransparencyData(formData, raspadinhaPremios, rifaPremios)}
        loading={loading}
      />
    </>
  );
}