"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Aldeia, MetodoPagamentoDefault, MetodosAceitesState } from "./configuracoes-types";

export function useConfiguracoes(authUser: unknown, authLoading: boolean) {
  const [aldeia, setAldeia] = useState<Aldeia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ajudaModalOpen, setAjudaModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    permitirStripe: false,
    permitirMBWay: false,
    metodosPagamentoDefault: '["saldo","dinheiro"]',
    iban: "",
    nomeTitularConta: "",
  });

  const [metodosPagamentoAceites, setMetodosPagamentoAceites] = useState<MetodosAceitesState>({
    dinheiro: true,
    saldo: true,
    mbway: true,
    stripe: true,
    transferencia: true,
    vendedor: true,
  });

  const [defaultMethods, setDefaultMethods] = useState<MetodoPagamentoDefault>({
    saldo: true,
    dinheiro: true,
    mbway: false,
    stripe: false,
    transferencia: false,
  });

  const fetchAldeia = async (aldeiaId: string) => {
    try {
      const response = await fetch(`/api/aldeias/${aldeiaId}`);
      if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);
      const data = await response.json();
      if (data.data) {
        setAldeia(data.data);
        setFormData({
          permitirStripe: data.data.permitirStripe || false,
          permitirMBWay: data.data.permitirMBWay || false,
          metodosPagamentoDefault: data.data.metodosPagamentoDefault || '["saldo","dinheiro"]',
          iban: data.data.iban || "",
          nomeTitularConta: data.data.nomeTitularConta || "",
        });
        try {
          const defaultArr = JSON.parse(data.data.metodosPagamentoDefault || '["saldo","dinheiro"]');
          setDefaultMethods({
            saldo: defaultArr.includes("saldo"),
            dinheiro: defaultArr.includes("dinheiro"),
            mbway: defaultArr.includes("mbway"),
            stripe: defaultArr.includes("stripe"),
            transferencia: defaultArr.includes("transferencia"),
          });
        } catch {}
        try {
          const aceitesArr = JSON.parse(data.data.metodosPagamentoAceites || '["dinheiro","saldo","mbway","stripe","transferencia","vendedor"]');
          setMetodosPagamentoAceites({
            dinheiro: aceitesArr.includes("dinheiro"),
            saldo: aceitesArr.includes("saldo"),
            mbway: aceitesArr.includes("mbway"),
            stripe: aceitesArr.includes("stripe"),
            transferencia: aceitesArr.includes("transferencia"),
            vendedor: aceitesArr.includes("vendedor"),
          });
        } catch {}
      } else {
        throw new Error("Dados da aldeia não encontrados");
      }
    } catch (error) {
      console.error("Erro ao buscar aldeia:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setLoading(false);
      return;
    }
    const u = authUser as { role?: string; aldeiaId?: string };
    if (u.role === "super_admin") {
      setError("super_admin");
      setLoading(false);
    } else if (u.aldeiaId) {
      fetchAldeia(u.aldeiaId);
    } else {
      setError("Sem aldeia associada");
      setLoading(false);
    }
  }, [authUser, authLoading]);

  const handleSave = async () => {
    if (!aldeia) return;
    const defaultMethodsArr: string[] = [];
    if (defaultMethods.saldo) defaultMethodsArr.push("saldo");
    if (defaultMethods.dinheiro) defaultMethodsArr.push("dinheiro");
    if (defaultMethods.mbway) defaultMethodsArr.push("mbway");
    if (defaultMethods.stripe) defaultMethodsArr.push("stripe");
    if (defaultMethods.transferencia) defaultMethodsArr.push("transferencia");
    if (defaultMethodsArr.length === 0) defaultMethodsArr.push("saldo", "dinheiro");

    const aceitesArr: string[] = [];
    if (metodosPagamentoAceites.dinheiro) aceitesArr.push("dinheiro");
    if (metodosPagamentoAceites.saldo) aceitesArr.push("saldo");
    if (metodosPagamentoAceites.mbway) aceitesArr.push("mbway");
    if (metodosPagamentoAceites.stripe) aceitesArr.push("stripe");
    if (metodosPagamentoAceites.transferencia) aceitesArr.push("transferencia");
    if (metodosPagamentoAceites.vendedor) aceitesArr.push("vendedor");
    if (aceitesArr.length === 0) aceitesArr.push("dinheiro", "saldo");

    setSaving(true);
    try {
      const response = await fetch(`/api/aldeias/${aldeia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permitirStripe: formData.permitirStripe,
          permitirMBWay: formData.permitirMBWay,
          metodosPagamentoDefault: JSON.stringify(defaultMethodsArr),
          metodosPagamentoAceites: JSON.stringify(aceitesArr),
          iban: formData.iban || null,
          nomeTitularConta: formData.nomeTitularConta || null,
        }),
      });
      if (response.ok) {
        toast.success("Configurações guardadas com sucesso!");
        setFormData(prev => ({ ...prev, metodosPagamentoDefault: JSON.stringify(defaultMethodsArr) }));
        setAldeia({ ...aldeia, ...formData });
      } else {
        toast.error("Erro ao guardar configurações");
      }
    } catch (error) {
      console.error("Erro ao guardar:", error);
      toast.error("Erro ao guardar configurações");
    } finally {
      setSaving(false);
    }
  };

  const copiarIBAN = () => {
    if (formData.iban) {
      navigator.clipboard.writeText(formData.iban);
      toast.success("IBAN copiado!");
    }
  };

  return {
    aldeia, loading, error, saving, ajudaModalOpen, setAjudaModalOpen,
    formData, setFormData, metodosPagamentoAceites, setMetodosPagamentoAceites,
    defaultMethods, setDefaultMethods,
    handleSave, copiarIBAN, setError,
  };
}
