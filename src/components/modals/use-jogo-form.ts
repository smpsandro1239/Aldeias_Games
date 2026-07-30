"use client";

import { useMemo, useReducer, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  GAME_TYPES,
  safeParseFloat,
  safeParseInt,
  type Premio,
  type JogoFormData,
  type JogoMetrics,
  type JogoData,
  type Action,
  buildJogoData,
} from "./create-jogo-types";

const getInitialState = (initialData?: JogoData) => ({
  loading: false,
  showTransparency: false,
  submittedData: null as JogoData | null,
  formData: {
    nome: initialData?.nome || "",
    tipo: (initialData?.tipo || GAME_TYPES.RASPADINHA) as JogoFormData["tipo"],
    descricao: initialData?.descricao || "",
    preco: initialData?.preco?.toString() || "2",
    stockInicial: initialData?.stockInicial?.toString() || "100",
    limitePorUsuario: initialData?.limitePorUsuario?.toString() || "0",
    numeroInicial: "1",
    numeroFinal: "1000",
    modoSorteio: (initialData?.modoSorteio || "app") as "app" | "externo",
    detalhesSorteioExterno: initialData?.detalhesSorteioExterno || "",
    raspadinhaTitulo: "RASPADINHA DA SORTE",
    raspadinhaSubtitulo: "Raspe com o dedo para revelar o seu prémio!",
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
    raspadinhaMaxGanhadores: "0",
    raspadinhaMaxPremioTotal: "0",
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

export function useJogoForm(initialData?: JogoData, eventoId?: string, effectiveEventoId?: string, needsAldeiaSelection?: boolean) {
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

  const preco = useMemo(() => safeParseFloat(state.formData.preco), [state.formData.preco]);
  const stock = useMemo(() => safeParseInt(state.formData.stockInicial), [state.formData.stockInicial]);

  useEffect(() => {
    if (preco > 0 && state.formData.tipo === GAME_TYPES.RASPADINHA) {
      setRaspadinhaPremios(
        state.raspadinhaPremios.map(p =>
          p.nome === "Valor da Raspadinha" ? { ...p, valorDinheiroAlternative: preco } : p
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preco, state.formData.tipo]);

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
      custoMedioPorBilhete,
      receitaTotal,
      custoTotalEstimado,
      lucroEstimado,
      margemLucro,
      isLucrativo: margemLucro >= 50
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
    const count = state.rifaPremios.length;
    const lastPremio = state.rifaPremios[count - 1];
    const nextValor = lastPremio ? Math.round((lastPremio.valorDinheiroAlternative || 0) / 2) : 0;
    const nextNome = `${count + 1}º Prémio`;
    setRifaPremios([
      ...state.rifaPremios,
      { id: Date.now().toString(), nome: nextNome, valorDinheiroAlternative: nextValor, percentagem: 0 }
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

    if (needsAldeiaSelection && !effectiveEventoId) {
      toast.error("Selecione uma aldeia e um evento");
      return;
    }

    if (state.formData.tipo === GAME_TYPES.RASPADINHA && state.raspadinhaPremios.length > 0) {
      const totalPercentagem = state.raspadinhaPremios.reduce((sum, p) => sum + (p.percentagem || 0), 0);
      if (totalPercentagem > 100) {
        toast.error(`A soma das percentagens dos prémios (${totalPercentagem}%) não pode exceder 100%`);
        return;
      }
    }

    if (state.formData.tipo === GAME_TYPES.RIFA) {
      const numInicial = safeParseInt(state.formData.numeroInicial, 1);
      const numFinal = safeParseInt(state.formData.numeroFinal, 1000);
      const stockVal = safeParseInt(state.formData.stockInicial, 100);

      if (numFinal <= numInicial) {
        toast.error('Número final deve ser maior que número inicial para rifa');
        return;
      }

      const intervalo = numFinal - numInicial + 1;
      if (intervalo < stockVal) {
        toast.error('Stock inicial excede o intervalo numérico disponível');
        return;
      }

      if (!state.formData.dataSorteio || !state.formData.horaSorteio || !state.formData.localSorteio) {
        toast.error('Data, hora e local do sorteio são obrigatórios para rifa');
        return;
      }
    }

    if (state.formData.tipo === GAME_TYPES.EUROMILHOES) {
      if (!state.formData.dataSorteio || !state.formData.horaSorteio || !state.formData.localSorteio) {
        toast.error('Data, hora e local do sorteio são obrigatórios para Euromilhões');
        return;
      }
    }

    const jogoData = buildJogoData(state.formData, state.raspadinhaPremios, state.rifaPremios, eventoId || effectiveEventoId || "");
    setSubmittedData(jogoData);
    setShowTransparency(true);
  }, [state.formData, state.raspadinhaPremios, state.rifaPremios, setSubmittedData, setShowTransparency, eventoId, effectiveEventoId, needsAldeiaSelection]);

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
