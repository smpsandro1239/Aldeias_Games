"use client";

import { useState } from "react";
import { apiRequest } from '@/lib/api-client';
import { toast } from "sonner";
import type { AldeiaData, EventoData, JogoData } from "./setup-wizard-types";

export function useSetupWizard(onComplete: () => void, onOpenChange: (open: boolean) => void) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [aldeiaData, setAldeiaData] = useState<AldeiaData>({
    nome: "",
    tipoOrganizacao: "aldeia",
    telefone: "",
    email: "",
    morada: "",
  });

  const [eventoData, setEventoData] = useState<EventoData>({
    nome: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    objectivoAngariacao: 0,
  });

  const [jogoData, setJogoData] = useState<JogoData>({
    nome: "",
    tipo: "rifa",
    descricao: "",
    preco: 2,
    premioNome: "",
    premioValor: 0,
    stockInicial: 100,
  });

  const [vendedores, setVendedores] = useState<{ nome: string; email: string }[]>([
    { nome: "", email: "" }
  ]);

  const progress = ((currentStep + 1) / 6) * 100;

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const addVendedor = () => {
    setVendedores([...vendedores, { nome: "", email: "" }]);
  };

  const removeVendedor = (index: number) => {
    setVendedores(vendedores.filter((_, i) => i !== index));
  };

  const updateVendedor = (index: number, field: "nome" | "email", value: string) => {
    const updated = [...vendedores];
    updated[index] = { ...updated[index], [field]: value };
    setVendedores(updated);
  };

  const getJogoConfiguracao = (tipo: string) => {
    switch (tipo) {
      case "rifa":
      case "euromilhoes":
        return JSON.stringify({ numeroInicial: 1, numeroFinal: jogoData.stockInicial });
      case "poio_da_vaca":
        return JSON.stringify({ letras: ["A", "B", "C", "D", "E"], numerosPorLetra: 20 });
      case "raspadinha":
        return JSON.stringify({ probabilidades: { premium: 0.05, normal: 0.15, sempremio: 0.8 } });
      default:
        return JSON.stringify({});
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const aldeiaRes = await apiRequest("/api/aldeias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aldeiaData),
      });
      if (!aldeiaRes.ok) throw new Error("Erro ao criar aldeia");
      const aldeiaJson = await aldeiaRes.json();
      const aldeiaIdResult = aldeiaJson.data?.id;

      const eventoRes = await apiRequest("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...eventoData, aldeiaId: aldeiaIdResult, estado: "ativo" }),
      });
      if (!eventoRes.ok) throw new Error("Erro ao criar evento");
      const eventoJson = await eventoRes.json();
      const eventoIdResult = eventoJson.data?.id;

      const jogoRes = await apiRequest("/api/jogos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...jogoData, eventoId: eventoIdResult, stockAtual: jogoData.stockInicial,
          configuracao: getJogoConfiguracao(jogoData.tipo), estado: "aberto",
        }),
      });
      if (!jogoRes.ok) throw new Error("Erro ao criar jogo");

      await apiRequest("/api/premios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: jogoData.premioNome, valorDinheiroAlternative: jogoData.premioValor, aldeiaId: aldeiaIdResult,
        }),
      });

      for (const v of vendedores) {
        if (v.nome && v.email) {
          await apiRequest("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...v, role: "vendedor", aldeiaId: aldeiaIdResult }),
          });
        }
      }

      toast.success("Configuração concluída com sucesso!");
      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao completar configuração");
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep, loading,
    aldeiaData, setAldeiaData,
    eventoData, setEventoData,
    jogoData, setJogoData,
    vendedores, addVendedor, removeVendedor, updateVendedor,
    handleNext, handleBack, handleFinish,
    progress,
  };
}
