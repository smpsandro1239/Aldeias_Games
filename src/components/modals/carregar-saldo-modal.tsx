"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useReducer, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CarregarSaldoModalProps, PaymentMethod, reducer, initialState } from "./carregar-saldo-types";
import { useSaldo, useDadosConta, useVendedores, safeParseFloat } from "./carregar-saldo-hooks";
import { CarregarSaldoForm } from "./carregar-saldo-form";
import { PedidoEnviadoView, CarregamentoRegistadoView } from "./carregar-saldo-result-views";

interface User {
  id: string;
}

export function CarregarSaldoModal({
  open,
  onOpenChange,
  aldeiaId,
  aldeiaNome,
  eventoId,
  eventoNome
}: CarregarSaldoModalProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [user, setUser] = useState<User | null>(null);

  const { saldo, setSaldo } = useSaldo(user?.id || "");
  const { dadosConta, metodosPagamentoAceites } = useDadosConta(aldeiaId);
  const vendedores = useVendedores(open, aldeiaId);

  // Efeito para inicializar dados do usuário
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error("Erro ao parsear dados do usuário:", error);
        toast.error("Erro ao carregar dados do usuário");
      }
    }
  }, []);

  // Atualizar estado com dados externos
  useEffect(() => {
    dispatch({ type: 'SET_SALDO', payload: saldo });
  }, [saldo]);

  useEffect(() => {
    dispatch({ type: 'SET_DADOS_CONTA', payload: dadosConta });
  }, [dadosConta]);

  useEffect(() => {
    dispatch({ type: 'SET_VENDEDORES', payload: vendedores });
  }, [vendedores]);

  // Auto-select first available method if current is not allowed
  useEffect(() => {
    if (!metodosPagamentoAceites.includes(state.metodoCarregamento)) {
      const firstAvailable = metodosPagamentoAceites[0];
      if (firstAvailable) {
        dispatch({ type: 'SET_METODO', payload: firstAvailable as PaymentMethod });
      }
    }
  }, [metodosPagamentoAceites, state.metodoCarregamento]);

  const handleCarregar = useCallback(async () => {
    const valorNum = safeParseFloat(state.valor);
    if (valorNum <= 0) {
      toast.error("Insira um valor válido");
      return;
    }

    if (valorNum < 1) {
      toast.error("Valor mínimo é 1€");
      return;
    }

    if (!state.selectedVendedor) {
      toast.error("Selecione um vendedor para processar o carregamento");
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await apiRequest("/api/wallet/carregar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valor: valorNum,
          metodoCarregamento: state.metodoCarregamento,
          vendedorId: state.selectedVendedor.id,
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
        toast.error(data.error || "Erro ao criar pedido de carregamento");
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
      toast.success("Pedido de carregamento criado!");

    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast.error("Erro ao criar pedido de carregamento");
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state, eventoNome, aldeiaNome, eventoId, aldeiaId]);

  const copiarIBAN = useCallback(() => {
    if (state.dadosConta.iban && navigator.clipboard) {
      navigator.clipboard.writeText(state.dadosConta.iban);
      toast.success("IBAN copiado!");
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = state.dadosConta.iban || "";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success("IBAN copiado!");
    }
  }, [state.dadosConta.iban]);

  const handleMetodoChange = useCallback((metodo: PaymentMethod) => {
    dispatch({ type: 'SET_METODO', payload: metodo });
  }, []);

  const handleValorChange = useCallback((valor: string) => {
    dispatch({ type: 'SET_VALOR', payload: valor });
  }, []);

  const handleDescricaoChange = useCallback((descricao: string) => {
    dispatch({ type: 'SET_DESCRICAO', payload: descricao });
  }, []);

  const toggleVendedorDropdown = useCallback(() => {
    dispatch({ type: 'SET_VENDEDOR_DROPDOWN_OPEN', payload: !state.vendedorDropdownOpen });
  }, [state.vendedorDropdownOpen]);

  const handleVendedorSelect = useCallback((vendedor: { id: string; nome: string }) => {
    dispatch({ type: 'SET_SELECTED_VENDEDOR', payload: vendedor });
    dispatch({ type: 'SET_VENDEDOR_DROPDOWN_OPEN', payload: false });
  }, []);

  // Renderização condicional baseada no resultado
  if (state.pedidoResult) {
    return (
      <PedidoEnviadoView
        open={open}
        onOpenChange={onOpenChange}
        result={state.pedidoResult}
        onFechar={() => {
          dispatch({ type: 'SET_PEDIDO_RESULT', payload: null });
          dispatch({ type: 'SET_VALOR', payload: "" });
          dispatch({ type: 'SET_DESCRICAO', payload: "" });
          onOpenChange(false);
        }}
      />
    );
  }

  if (state.carregamentoResult) {
    return (
      <CarregamentoRegistadoView
        open={open}
        onOpenChange={onOpenChange}
        result={state.carregamentoResult}
        saldo={state.saldo}
        onFechar={() => {
          dispatch({ type: 'SET_CARREGAMENTO_RESULT', payload: null });
          dispatch({ type: 'SET_VALOR', payload: "" });
          dispatch({ type: 'SET_DESCRICAO', payload: "" });
          onOpenChange(false);
        }}
      />
    );
  }

  return (
    <CarregarSaldoForm
      open={open}
      onOpenChange={onOpenChange}
      state={state}
      metodosPagamentoAceites={metodosPagamentoAceites}
      onMetodoChange={handleMetodoChange}
      onValorChange={handleValorChange}
      onDescricaoChange={handleDescricaoChange}
      onToggleVendedor={toggleVendedorDropdown}
      onVendedorSelect={handleVendedorSelect}
      onCopiarIBAN={copiarIBAN}
      onCarregar={handleCarregar}
    />
  );
}