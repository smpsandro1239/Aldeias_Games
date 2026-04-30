"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TransparencyModal } from "./transparency-modal";
import { 
  AlertCircle, 
  CheckCircle2, 
  Trophy, 
  Percent, 
  Euro, 
  Info,
  TrendingUp,
  Calculator,
  Building2,
  Calendar,
  Check,
  ChevronsUpDown,
  Search
} from "lucide-react";

interface Premio {
  id: string;
  nome: string;
  valorDinheiroAlternative: number;
  percentagem: number;
}

interface AldeiaOption {
  id: string;
  nome: string;
  tipoOrganizacao: string;
  slug: string;
}

interface EventoOption {
  id: string;
  nome: string;
  aldeiaId: string;
  aldeiaNome?: string;
}

export interface JogoData {
   id?: string;
   nome: string;
   tipo: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha";
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

export function CreateJogoModal({ open, onOpenChange, onSubmit, eventoId: propEventoId, initialData, userRole, token, aldeiaId, metodosPagamentoDefault }: CreateJogoModalProps) {
  const [loading, setLoading] = useState(false);
  const [showTransparency, setShowTransparency] = useState(false);
  const [submittedData, setSubmittedData] = useState<JogoData | null>(null);
  
  // Organization/Event selectors (for super_admin)
  const [aldeias, setAldeias] = useState<AldeiaOption[]>([]);
  const [eventos, setEventos] = useState<EventoOption[]>([]);
  const [selectedAldeiaId, setSelectedAldeiaId] = useState<string>("");
  const [selectedEventoId, setSelectedEventoId] = useState<string>(propEventoId || "");
  const [aldeiaOpen, setAldeiaOpen] = useState(false);
  const [eventoOpen, setEventoOpen] = useState(false);
  const [isLoadingAldeias, setIsLoadingAldeias] = useState(false);
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);

  const isSuperAdmin = userRole === "super_admin";
  
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "raspadinha" as "poio_da_vaca" | "rifa" | "tombola" | "raspadinha",
    descricao: "",
    preco: "2",
    stockInicial: "100",
    limitePorUsuario: "10",
    numeroInicial: "1",
    numeroFinal: "1000",
    modoSorteio: "app" as "app" | "externo",
    detalhesSorteioExterno: "",
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
    permitirStripe: (metodosPagamentoDefault || ["saldo", "dinheiro"]).includes("stripe"),
    permitirMBWay: (metodosPagamentoDefault || ["saldo", "dinheiro"]).includes("mbway"),
    permitirSaldo: (metodosPagamentoDefault || ["saldo", "dinheiro"]).includes("saldo"),
    valorPremios: "",
  });

  const [rashadinhaPremios, setRaspadinhaPremios] = useState<Premio[]>([
    { id: "1", nome: "3x Presunto", valorDinheiroAlternative: 50, percentagem: 2 },
    { id: "2", nome: "3x Tabua de Queijos", valorDinheiroAlternative: 25, percentagem: 5 },
    { id: "3", nome: "Valor da Raspadinha", valorDinheiroAlternative: 2, percentagem: 10 },
  ]);

  const [rifaPremios, setRifaPremios] = useState<Premio[]>([
    { id: "1", nome: "1º Prémio", valorDinheiroAlternative: 0, percentagem: 0 },
  ]);

  useEffect(() => {
    if (initialData && open) {
      const config = typeof initialData.configuracao === 'string' 
        ? JSON.parse(initialData.configuracao) 
        : initialData.configuracao || {};
      
    setFormData({
      nome: initialData.nome || "",
      tipo: initialData.tipo || "raspadinha",
      descricao: initialData.descricao || "",
      preco: initialData.preco?.toString() || "2",
      stockInicial: initialData.stockInicial?.toString() || "100",
      limitePorUsuario: initialData.limitePorUsuario?.toString() || "10",
      numeroInicial: "1",
      numeroFinal: "1000",
      modoSorteio: initialData.modoSorteio || "app",
      detalhesSorteioExterno: initialData.detalhesSorteioExterno || "",
      raspadinhaTitulo: "RASPADINHA DA SORTE",
      raspadinhaSubtitulo: "Raspe com o dedo para revelar o seu prémio!",
      raspadinhaOrganizacao: "",
      dimensoesX: "10",
      dimensoesY: "10",
      custoQuadrado: "5",
      valorMercadoVaca: "1000",
      valorCompraVaca: "800",
      dataSorteio: config.dataSorteio || "",
      horaSorteio: config.horaSorteio || "",
      localSorteio: config.localSorteio || "",
      numeroBlocos: config.numeroBlocos || "1",
      permitirStripe: config.permitirStripe || false,
      permitirMBWay: config.permitirMBWay || false,
      permitirSaldo: config.permitirSaldo !== false,
      valorPremios: "",
    });
      
      if (initialData.premios && initialData.premios.length > 0) {
        if (initialData.tipo === "raspadinha") {
          setRaspadinhaPremios(initialData.premios.map((p, i) => ({
            id: String(i + 1),
            nome: p.nome || "",
            valorDinheiroAlternative: p.valorDinheiroAlternative || 0,
            percentagem: p.percentagem || 0,
          })));
        } else {
          setRifaPremios(initialData.premios.map((p, i) => ({
            id: String(i + 1),
            nome: p.nome || "",
            valorDinheiroAlternative: p.valorDinheiroAlternative || 0,
            percentagem: 0,
          })));
        }
      }
    } else if (!open) {
      resetForm();
    }
  }, [initialData, open]);

  // Fetch aldeias for super admin
  useEffect(() => {
    if (open && isSuperAdmin && token) {
      fetchAldeias();
    }
  }, [open, isSuperAdmin, token]);

  // Fetch eventos when aldeia changes
  useEffect(() => {
    if (open && isSuperAdmin && token && selectedAldeiaId) {
      fetchEventos(selectedAldeiaId);
    } else if (open && isSuperAdmin) {
      setEventos([]);
      setSelectedEventoId("");
    }
  }, [selectedAldeiaId, open, isSuperAdmin, token]);

  const fetchAldeias = async () => {
    setIsLoadingAldeias(true);
    try {
      const res = await fetch("/api/aldeias", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAldeias(data.data || data.aldeias || []);
      }
    } catch (error) {
      console.error("Erro ao carregar aldeias:", error);
    } finally {
      setIsLoadingAldeias(false);
    }
  };

  const fetchEventos = async (aldeiaId: string) => {
    setIsLoadingEventos(true);
    try {
      const res = await fetch(`/api/eventos?aldeiaId=${aldeiaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const eventosWithAldeia = (data.data || []).map((e: any) => ({
          ...e,
          aldeiaNome: aldeias.find((a) => a.id === e.aldeiaId)?.nome,
        }));
        setEventos(eventosWithAldeia);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    } finally {
      setIsLoadingEventos(false);
    }
  };

  const tipoOrganizacaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      aldeia: "Aldeia",
      escola: "Escola",
      associacao_pais: "Associação de Pais",
      clube: "Clube",
    };
    return labels[tipo] || tipo;
  };

  const resetForm = () => {
    // Get default payment methods from aldeia settings or use sensible defaults
    const defaultMethods = metodosPagamentoDefault || ["saldo", "dinheiro"];
    
    setFormData({
      nome: "",
      tipo: "raspadinha",
      descricao: "",
      preco: "2",
      stockInicial: "100",
      limitePorUsuario: "10",
      numeroInicial: "1",
      numeroFinal: "1000",
      modoSorteio: "app",
      detalhesSorteioExterno: "",
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
      permitirStripe: defaultMethods.includes("stripe"),
      permitirMBWay: defaultMethods.includes("mbway"),
      permitirSaldo: defaultMethods.includes("saldo"),
      valorPremios: "",
    });
    setRaspadinhaPremios([
      { id: "1", nome: "3x Presunto", valorDinheiroAlternative: 50, percentagem: 2 },
      { id: "2", nome: "3x Tabua de Queijos", valorDinheiroAlternative: 25, percentagem: 5 },
      { id: "3", nome: "Valor da Raspadinha", valorDinheiroAlternative: 2, percentagem: 10 },
    ]);
    setRifaPremios([
      { id: "1", nome: "1º Prémio", valorDinheiroAlternative: 0, percentagem: 0 },
    ]);
  };

  const preco = parseFloat(formData.preco) || 0;
  const stock = parseInt(formData.stockInicial) || 0;
  
  const metricsRaspadinha = useMemo(() => {
    const totalPercentagem = rashadinhaPremios.reduce((acc, p) => acc + p.percentagem, 0);
    const lucroMinimo = 100 - totalPercentagem;
    
    const custoMedioPorBilhete = rashadinhaPremios.reduce((acc, p) => {
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
  }, [rashadinhaPremios, preco, stock]);

  const metricsRifa = useMemo(() => {
    const totalPremios = rifaPremios.reduce((acc, p) => acc + p.valorDinheiroAlternative, 0);
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
  }, [rifaPremios, preco, stock]);

  const metricsPoioDaVaca = useMemo(() => {
    const dimensoesX = parseInt(formData.dimensoesX) || 0;
    const dimensoesY = parseInt(formData.dimensoesY) || 0;
    const custoQuadrado = parseFloat(formData.custoQuadrado) || 0;
    const valorCompraVaca = parseFloat(formData.valorCompraVaca) || 0;
    
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
  }, [formData.dimensoesX, formData.dimensoesY, formData.custoQuadrado, formData.valorCompraVaca]);

  const getMetrics = (): { isLucrativo: boolean; lucroEstimado: number; margemLucro: number; lucroMinimo: number } => {
    switch (formData.tipo) {
      case "raspadinha":
        return { 
          isLucrativo: metricsRaspadinha.isLucrativo, 
          lucroEstimado: metricsRaspadinha.lucroEstimado, 
          margemLucro: metricsRaspadinha.margemLucro,
          lucroMinimo: metricsRaspadinha.lucroMinimo
        };
      case "rifa":
      case "tombola":
        return { 
          isLucrativo: metricsRifa.isLucrativo, 
          lucroEstimado: metricsRifa.lucroEstimado, 
          margemLucro: metricsRifa.margemLucro,
          lucroMinimo: metricsRifa.margemLucro
        };
      case "poio_da_vaca":
        return { 
          isLucrativo: metricsPoioDaVaca.isLucrativo, 
          lucroEstimado: metricsPoioDaVaca.lucroEstimado, 
          margemLucro: metricsPoioDaVaca.margemLucro,
          lucroMinimo: metricsPoioDaVaca.margemLucro
        };
      default:
        return { isLucrativo: false, lucroEstimado: 0, margemLucro: 0, lucroMinimo: 0 };
    }
  };

  const isLucrativo = getMetrics().isLucrativo;

  const handlePremioRaspadinhaChange = (id: string, field: keyof Premio, value: string | number) => {
    setRaspadinhaPremios(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const handlePremioRifaChange = (id: string, field: keyof Premio, value: string | number) => {
    setRifaPremios(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const adicionarPremioRaspadinha = () => {
    setRaspadinhaPremios(prev => [
      ...prev,
      { id: Date.now().toString(), nome: "", valorDinheiroAlternative: 0, percentagem: 0 }
    ]);
  };

  const adicionarPremioRifa = () => {
    setRifaPremios(prev => [
      ...prev,
      { id: Date.now().toString(), nome: "", valorDinheiroAlternative: 0, percentagem: 0 }
    ]);
  };

  const removerPremioRaspadinha = (id: string) => {
    if (rashadinhaPremios.length > 1) {
      setRaspadinhaPremios(prev => prev.filter(p => p.id !== id));
    }
  };

  const removerPremioRifa = (id: string) => {
    if (rifaPremios.length > 1) {
      setRifaPremios(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const jogoData = construirDadosJogo();
    setSubmittedData(jogoData);
    setShowTransparency(true);
  };

  const construirDadosJogo = (): JogoData => {
    // Validar eventoId
    const finalEventoId = selectedEventoId || propEventoId;
    if (!finalEventoId) {
      throw new Error("Selecione um evento antes de criar o jogo");
    }

    const config: Record<string, unknown> = {
      numeroInicial: parseInt(formData.numeroInicial) || 1,
      numeroFinal: parseInt(formData.numeroFinal) || 1000,
      modoSorteio: formData.modoSorteio,
      detalhesSorteioExterno: formData.detalhesSorteioExterno,
    };

    if (formData.tipo === "rifa" || formData.tipo === "tombola") {
      config.dataSorteio = formData.dataSorteio;
      config.horaSorteio = formData.horaSorteio;
      config.localSorteio = formData.localSorteio;
      config.numeroBlocos = parseInt(formData.numeroBlocos) || 1;
      config.permitirStripe = formData.permitirStripe;
      config.permitirMBWay = formData.permitirMBWay;
      config.permitirSaldo = formData.permitirSaldo;
      config.permitirDinheiro = true;
      config.permitirTransferencia = true;
      config.valorPremios = formData.valorPremios ? parseFloat(formData.valorPremios) : null;
    }

    if (formData.tipo === "raspadinha") {
      config.permitirStripe = formData.permitirStripe;
      config.permitirMBWay = formData.permitirMBWay;
      config.permitirSaldo = formData.permitirSaldo;
      config.permitirDinheiro = true;
      config.permitirTransferencia = true;
    }

    if (formData.tipo === "poio_da_vaca") {
      config.dimensoesX = parseInt(formData.dimensoesX) || 10;
      config.dimensoesY = parseInt(formData.dimensoesY) || 10;
      config.custoQuadrado = parseFloat(formData.custoQuadrado) || 5;
      config.valorMercadoVaca = parseFloat(formData.valorMercadoVaca) || 1000;
      config.valorCompraVaca = parseFloat(formData.valorCompraVaca) || 800;
      config.permitirStripe = formData.permitirStripe;
      config.permitirMBWay = formData.permitirMBWay;
      config.permitirSaldo = formData.permitirSaldo;
      config.permitirDinheiro = true;
      config.permitirTransferencia = true;
    }

    if (formData.tipo === "raspadinha") {
      config.titulo = formData.raspadinhaTitulo;
      config.subtitulo = formData.raspadinhaSubtitulo;
      config.organizacao = formData.raspadinhaOrganizacao;
      config.premios = rashadinhaPremios.filter(p => p.nome.trim() && p.valorDinheiroAlternative > 0);
    }

    let premiosData: Array<{ nome: string; valorDinheiroAlternative: number; percentagem?: number; ordem: number }> = [];
    let metrics = getMetrics();

    if (formData.tipo === "raspadinha") {
      premiosData = rashadinhaPremios
        .filter(p => p.nome.trim() && p.valorDinheiroAlternative > 0)
        .map((p, idx) => ({
          nome: p.nome,
          valorDinheiroAlternative: p.valorDinheiroAlternative,
          percentagem: p.percentagem,
          ordem: idx
        }));
      
      config.lucroMinimoPercent = metricsRaspadinha.lucroMinimo;
      config.custoMedioPrevisto = metricsRaspadinha.custoMedioPorBilhete;
    } else if (formData.tipo === "rifa" || formData.tipo === "tombola") {
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
      preco: parseFloat(formData.preco) || 0,
      stockInicial: parseInt(formData.stockInicial) || 100,
      limitePorUsuario: parseInt(formData.limitePorUsuario) || 10,
      eventoId: finalEventoId,
      configuracao: config,
      modoSorteio: formData.modoSorteio,
      detalhesSorteioExterno: formData.detalhesSorteioExterno,
      premios: premiosData,
      custoQuadrado: formData.tipo === "poio_da_vaca" ? parseFloat(formData.custoQuadrado) : undefined,
      valorMercadoVaca: formData.tipo === "poio_da_vaca" ? parseFloat(formData.valorMercadoVaca) : undefined,
      valorCompraVaca: formData.tipo === "poio_da_vaca" ? parseFloat(formData.valorCompraVaca) : undefined,
      lucroMinimoPercent: metrics.lucroMinimo || metrics.margemLucro,
      receitaEsperada: formData.tipo === "raspadinha" ? metricsRaspadinha.receitaTotal :
                       formData.tipo === "poio_da_vaca" ? metricsPoioDaVaca.receitaTotal :
                       metricsRifa.receitaTotal,
      lucroLiquidoPrevisto: metrics.lucroEstimado,
    };
  };

  const handleConfirmCreate = async () => {
    if (!submittedData) return;
    
    setLoading(true);
    try {
      await onSubmit(submittedData);
      setShowTransparency(false);
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao criar jogo:', error);
      // Error is already shown by parent via toast
    } finally {
      setLoading(false);
    }
  };

  const getTransparencyData = () => {
    switch (formData.tipo) {
      case "raspadinha":
        return {
          tipoJogo: "raspadinha",
          nome: formData.nome || "Raspadinha",
          preco: parseFloat(formData.preco) || 0,
          stock: parseInt(formData.stockInicial) || 0,
          premios: rashadinhaPremios
            .filter(p => p.nome.trim() || p.valorDinheiroAlternative > 0)
            .map(p => ({
              nome: p.nome || "Prémio",
              valor: p.valorDinheiroAlternative,
              percentagem: p.percentagem
            }))
        };
      case "rifa":
      case "tombola":
        return {
          tipoJogo: formData.tipo,
          nome: formData.nome || (formData.tipo === "tombola" ? "Tombola" : "Rifa"),
          preco: parseFloat(formData.preco) || 0,
          stock: parseInt(formData.stockInicial) || 0,
          premios: rifaPremios
            .filter(p => p.nome.trim() || p.valorDinheiroAlternative > 0)
            .map(p => ({
              nome: p.nome || "Prémio",
              valor: p.valorDinheiroAlternative
            }))
        };
      case "poio_da_vaca":
        return {
          tipoJogo: "poio_da_vaca",
          nome: formData.nome || "Poio da Vaca",
          preco: parseFloat(formData.custoQuadrado) || 0,
          premios: [{
            nome: "Valor da Vaca",
            valor: parseFloat(formData.valorCompraVaca) || 0
          }],
          dimensoesX: parseInt(formData.dimensoesX) || 0,
          dimensoesY: parseInt(formData.dimensoesY) || 0,
          custoQuadrado: parseFloat(formData.custoQuadrado) || 0,
          valorCompraVaca: parseFloat(formData.valorCompraVaca) || 0
        };
      default:
        return {
          tipoJogo: "raspadinha",
          nome: "Jogo",
          preco: 0,
          stock: 0,
          premios: []
        };
    }
  };

  const renderLucratividadeCard = () => {
    const m = getMetrics();
    
    return (
      <div className={`p-4 rounded-xl border-2 ${m.isLucrativo ? 'bg-primary/10 border-green-500/30' : 'bg-destructive/10 border-red-500/30'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Calculator className={`w-5 h-5 ${m.isLucrativo ? 'text-primary' : 'text-destructive'}`} />
          <h4 className={`font-bold ${m.isLucrativo ? 'text-primary' : 'text-destructive'}`}>
            {m.isLucrativo ? '✅ Lucrativo' : '❌ Não Lucrativo'}
          </h4>
        </div>
        
        {formData.tipo === "raspadinha" && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">% Total Prémios:</span>
              <span className={metricsRaspadinha.totalPercentagem > 50 ? "text-destructive" : ""}>
                {metricsRaspadinha.totalPercentagem}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lucro Mínimo:</span>
              <span className={metricsRaspadinha.lucroMinimo >= 50 ? "text-primary" : "text-destructive"}>
                {metricsRaspadinha.lucroMinimo}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo Médio/Bilhete:</span>
              <span className="font-bold text-primary">{metricsRaspadinha.custoMedioPorBilhete.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receita (100 bilhetes):</span>
              <span className="font-bold">{metricsRaspadinha.receitaTotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lucro Estimado:</span>
              <span className={metricsRaspadinha.lucroEstimado >= 0 ? "text-primary" : "text-destructive"}>
                {metricsRaspadinha.lucroEstimado.toFixed(2)}€
              </span>
            </div>
          </div>
        )}

        {(formData.tipo === "rifa" || formData.tipo === "tombola") && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Prémios:</span>
              <span className="font-bold text-primary">{metricsRifa.totalPremios.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receita Total:</span>
              <span className="font-bold">{metricsRifa.receitaTotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lucro:</span>
              <span className={metricsRifa.lucroEstimado >= 0 ? "text-primary" : "text-destructive"}>
                {metricsRifa.lucroEstimado.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margem:</span>
              <span className={metricsRifa.margemLucro >= 50 ? "text-primary" : "text-destructive"}>
                {metricsRifa.margemLucro.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {formData.tipo === "poio_da_vaca" && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Quadrados:</span>
              <span className="font-bold">{metricsPoioDaVaca.totalQuadrados}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receita Total:</span>
              <span className="font-bold">{metricsPoioDaVaca.receitaTotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo Vaca:</span>
              <span className="font-bold text-primary">{metricsPoioDaVaca.valorCompraVaca.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lucro:</span>
              <span className={metricsPoioDaVaca.lucroEstimado >= 0 ? "text-primary" : "text-destructive"}>
                {metricsPoioDaVaca.lucroEstimado.toFixed(2)}€
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Margem:</span>
              <span className={metricsPoioDaVaca.margemLucro >= 50 ? "text-primary" : "text-destructive"}>
                {metricsPoioDaVaca.margemLucro.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{initialData ? "Editar Jogo" : "Novo Jogo"}</DialogTitle>
            <DialogDescription>
              {initialData ? "Edite as informações do jogo." : "Crie um novo jogo para este evento."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Jogo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha") =>
                    setFormData({ ...formData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raspadinha">Raspadinha</SelectItem>
                    <SelectItem value="rifa">Rifa</SelectItem>
                    <SelectItem value="tombola">Tombola</SelectItem>
                    <SelectItem value="poio_da_vaca">Poio da Vaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organization & Event selectors for Super Admin */}
              {isSuperAdmin && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="aldeia">Organização / Aldeia / Escola / Clube *</Label>
                    <AldeiaSelector
                      aldeias={aldeias}
                      selectedId={selectedAldeiaId}
                      onSelect={(id) => {
                        setSelectedAldeiaId(id);
                        setSelectedEventoId("");
                      }}
                      loading={isLoadingAldeias}
                      token={token}
                    />
                  </div>

                  {selectedAldeiaId && (
                    <div className="grid gap-2">
                      <Label htmlFor="evento">Evento *</Label>
                      <EventoSelector
                        eventos={eventos}
                        selectedId={selectedEventoId}
                        onSelect={setSelectedEventoId}
                        loading={isLoadingEventos}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Jogo *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Rifa da Festa"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              {(formData.tipo === "rifa" || formData.tipo === "tombola" || formData.tipo === "raspadinha") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="preco">Preço (€) *</Label>
                    <Input
                      id="preco"
                      type="number"
                      min="0.5"
                      step="0.01"
                      value={formData.preco}
                      onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, stockInicial: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {(formData.tipo === "rifa" || formData.tipo === "tombola" || formData.tipo === "raspadinha" || formData.tipo === "poio_da_vaca") && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Métodos de Pagamento</Label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 bg-surface-container-high rounded-lg border border-outline-variant/20 cursor-pointer hover:bg-surface-container-highest transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.permitirSaldo}
                        onChange={(e) => setFormData({ ...formData, permitirSaldo: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-400 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">💰 Saldo Aldeias</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 bg-surface-container-high rounded-lg border border-outline-variant/20 cursor-pointer hover:bg-surface-container-highest transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.permitirMBWay}
                        onChange={(e) => setFormData({ ...formData, permitirMBWay: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-400 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">📱 MBWay</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 bg-surface-container-high rounded-lg border border-outline-variant/20 cursor-pointer hover:bg-surface-container-highest transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.permitirStripe}
                        onChange={(e) => setFormData({ ...formData, permitirStripe: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-400 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">💳 Cartão</span>
                    </label>
                 </div>
                 {(!formData.permitirSaldo && !formData.permitirMBWay && !formData.permitirStripe) && (
                     <p className="text-xs text-destructive">Selecione pelo menos um método de pagamento</p>
                 )}
             </div>
         )}

         {/* Data, Hora e Local do Sorteio (comum a todos os tipos de jogo) */}
         <div className="border-t pt-4 mt-2">
             <h3 className="text-sm font-semibold">Data, Hora e Local do Sorteio</h3>
             <div className="grid gap-4">
                 <div className="grid gap-2">
                     <Label htmlFor="dataSorteio">Data do Sorteio</Label>
                     <Input
                         id="dataSorteio"
                         type="date"
                         value={formData.dataSorteio}
                         onChange={(e) => setFormData({ ...formData, dataSorteio: e.target.value })}
                     />
                 </div>
                 <div className="grid gap-2">
                     <Label htmlFor="horaSorteio">Hora do Sorteio</Label>
                     <Input
                         id="horaSorteio"
                         type="time"
                         value={formData.horaSorteio}
                         onChange={(e) => setFormData({ ...formData, horaSorteio: e.target.value })}
                     />
                 </div>
                 <div className="grid gap-2">
                     <Label htmlFor="localSorteio">Local do Sorteio</Label>
                     <Input
                         id="localSorteio"
                         placeholder="Ex: Salão Paroquial, Rua Principal, etc."
                         value={formData.localSorteio}
                         onChange={(e) => setFormData({ ...formData, localSorteio: e.target.value })}
                     />
                 </div>
             </div>
         </div>

              {formData.tipo === "raspadinha" && (
                <>
                  <div className="border-t pt-4 mt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Configuração da Raspadinha</h3>
                      <Badge variant={isLucrativo ? "default" : "destructive"} className={isLucrativo ? "bg-primary" : ""}>
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
                          onChange={(e) => setFormData({ ...formData, raspadinhaTitulo: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="raspadinhaOrganizacao">Nome na Raspadinha</Label>
                        <Input
                          id="raspadinhaOrganizacao"
                          placeholder="Ex: Junta de Freguesia"
                          value={formData.raspadinhaOrganizacao}
                          onChange={(e) => setFormData({ ...formData, raspadinhaOrganizacao: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Nome que aparecerá impresso na raspadinha.</p>
                      </div>
                    </div>

                    <div className="bg-surface-container rounded-xl p-4 space-y-4 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-primary">Prémios e Percentagens</h4>
                        <Button type="button" variant="outline" size="sm" onClick={adicionarPremioRaspadinha}>
                          + Prémio
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {rashadinhaPremios.map((premio) => (
                          <div key={premio.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-surface-container-low rounded-lg">
                            <div className="col-span-1 flex items-center justify-center">
                              <Trophy className="h-4 w-4 text-primary" />
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
                                  onChange={(e) => handlePremioRaspadinhaChange(premio.id, "valorDinheiroAlternative", parseFloat(e.target.value) || 0)}
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
                                  onChange={(e) => handlePremioRaspadinhaChange(premio.id, "percentagem", parseFloat(e.target.value) || 0)}
                                  className="h-8 text-sm pl-7"
                                />
                              </div>
                            </div>
                            <div className="col-span-1 flex justify-center">
                              {rashadinhaPremios.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive"
                                  onClick={() => removerPremioRaspadinha(premio.id)}
                                >
                                  ✕
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

              {(formData.tipo === "rifa" || formData.tipo === "tombola") && (
                <>
                  <div className="border-t pt-4 mt-2 space-y-4">
                    <h3 className="text-sm font-semibold">Prémios</h3>
                    
                    <div className="space-y-3">
                      {rifaPremios.map((premio) => (
                        <div key={premio.id} className="grid grid-cols-12 gap-2 items-end p-3 bg-surface-container-low rounded-lg">
                          <div className="col-span-1 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-primary" />
                          </div>
                          <div className="col-span-6">
                            <Input
                              placeholder="Nome do prémio"
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
                                onChange={(e) => handlePremioRifaChange(premio.id, "valorDinheiroAlternative", parseFloat(e.target.value) || 0)}
                                className="h-8 text-sm pl-7"
                              />
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive"
                              onClick={() => removerPremioRifa(premio.id)}
                            >
                              ✕
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

              {formData.tipo === "poio_da_vaca" && (
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
                        onChange={(e) => setFormData({ ...formData, dimensoesX: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, dimensoesY: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, custoQuadrado: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="valorCompraVaca">Valor da Vaca (€)</Label>
                      <Input
                        id="valorCompraVaca"
                        type="number"
                        min="0"
                        value={formData.valorCompraVaca}
                        onChange={(e) => setFormData({ ...formData, valorCompraVaca: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.tipo !== "poio_da_vaca" && (
                <div className="border-t pt-4 mt-2">
                  {renderLucratividadeCard()}
                </div>
              )}

              {formData.tipo === "poio_da_vaca" && (
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
                className={isLucrativo ? "bg-primary hover:bg-primary" : ""}
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
        data={getTransparencyData()}
        loading={loading}
      />
    </>
  );
}

// Searchable Aldeia Selector Component
function AldeiaSelector({ aldeias, selectedId, onSelect, loading, token }: {
  aldeias: AldeiaOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
  token?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = aldeias.filter((a) =>
    a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.tipoOrganizacao.toLowerCase().includes(search.toLowerCase()) ||
    a.slug.toLowerCase().includes(search.toLowerCase())
  );

  const selected = aldeias.find((a) => a.id === selectedId);

  const tipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      aldeia: "Aldeia",
      escola: "Escola",
      associacao_pais: "Associação de Pais",
      clube: "Clube",
    };
    return labels[tipo] || tipo;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{selected.nome}</span>
            <Badge variant="secondary" className="text-xs">{tipoLabel(selected.tipoOrganizacao)}</Badge>
          </span>
        ) : (
          <span className="text-muted-foreground">Selecionar organização...</span>
        )}
        <ChevronsUpDown className="h-4 w-4 opacity-50 ml-auto" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">A carregar...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma organização encontrada</div>
            ) : (
              filtered.map((aldeia) => (
                <button
                  key={aldeia.id}
                  type="button"
                  onClick={() => {
                    onSelect(aldeia.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                    selectedId === aldeia.id ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-left">{aldeia.nome}</span>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">{tipoLabel(aldeia.tipoOrganizacao)}</Badge>
                  {selectedId === aldeia.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// Searchable Evento Selector Component
function EventoSelector({ eventos, selectedId, onSelect, loading }: {
  eventos: EventoOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = eventos.filter((e) =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  const selected = eventos.find((e) => e.id === selectedId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{selected.nome}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">Selecionar evento...</span>
        )}
        <ChevronsUpDown className="h-4 w-4 opacity-50 ml-auto" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar eventos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">A carregar...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Nenhum evento encontrado</div>
            ) : (
              filtered.map((evento) => (
                <button
                  key={evento.id}
                  type="button"
                  onClick={() => {
                    onSelect(evento.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                    selectedId === evento.id ? "bg-accent text-accent-foreground" : ""
                  }`}
                >
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-left">{evento.nome}</span>
                  {selectedId === evento.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
