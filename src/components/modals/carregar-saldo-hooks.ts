"use client";

import { useState, useEffect } from "react";
import { DadosConta, Vendedor } from "./carregar-saldo-types";

// Safe parsing helpers
export const safeParseFloat = (val: string, fallback: number = 0): number => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

// Hook customizado para gerenciar saldo
export function useSaldo(userId: string) {
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const res = await fetch("/api/wallet");
        const data = await res.json();
        if (typeof data.saldo === 'number') {
          setSaldo(data.saldo);
        }
      } catch (e) {
        console.error("Erro ao buscar saldo:", e);
      }
    };
    fetchSaldo();
  }, [userId]);

  return { saldo, setSaldo };
}

// Hook customizado para dados da conta
export function useDadosConta(aldeiaId?: string) {
  const [dadosConta, setDadosConta] = useState<DadosConta>({});
  const [metodosPagamentoAceites, setMetodosPagamentoAceites] = useState<string[]>(['dinheiro', 'mbway', 'transferencia', 'vendedor']);

  useEffect(() => {
    if (!aldeiaId) return;
    const fetchDadosConta = async () => {
      try {
        const res = await fetch(`/api/aldeias/${aldeiaId}`);
        if (!res.ok) {
          throw new Error("Erro ao buscar dados da conta");
        }
        const data = await res.json();
        if (data.data) {
          setDadosConta({
            iban: data.data.iban,
            nomeTitularConta: data.data.nomeTitularConta,
            telefoneMBWay: data.data.telefoneMBWay,
            emailPagamentos: data.data.emailPagamentos
          });
          // Parse metodosPagamentoAceites
          if (data.data.metodosPagamentoAceites) {
            try {
              const aceites = JSON.parse(data.data.metodosPagamentoAceites);
              if (Array.isArray(aceites) && aceites.length > 0) {
                setMetodosPagamentoAceites(aceites);
              }
            } catch (e) {
              console.error("Erro ao parsear métodos aceites:", e);
            }
          }
        }
      } catch (e) {
        console.error("Erro ao buscar dados da conta:", e);
      }
    };
    fetchDadosConta();
  }, [aldeiaId]);

  return { dadosConta, metodosPagamentoAceites };
}

// Hook customizado para vendedores
export function useVendedores(open: boolean, aldeiaId?: string) {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);

  useEffect(() => {
    if (!open || !aldeiaId) return;
    const fetchVendedores = async () => {
      try {
        const res = await fetch(`/api/vendedores?aldeiaId=${aldeiaId}`);
        if (!res.ok) {
          throw new Error("Erro ao buscar vendedores");
        }
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