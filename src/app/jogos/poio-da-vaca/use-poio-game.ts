"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiRequest } from '@/lib/api-client';
import type { Jogo, Aposta, Dimensoes, JogadorForm, ApostaConfirmada } from "./poio-types";
import { calcularRentabilidade, getRentabilidadeStatus } from "./poio-types";

export function usePoioGame(
  jogo: Jogo | null,
  jogoId: string | null,
  userRole: string | null,
  isAdmin: boolean,
  isNonRegularUser: boolean,
  userOriginalData: { nome: string; telefone: string; email: string },
  playerDataConfirmOpen: boolean,
  setPlayerDataConfirmOpen: (open: boolean) => void,
  playerDataModified: boolean,
  setPlayerDataModified: (modified: boolean) => void,
  refreshBalance: () => void,
  setJogo: (data: Jogo) => void,
) {
  const [loading, setLoading] = useState(true);
  const [selectedSquares, setSelectedSquares] = useState<number[]>([]);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [participacaoCriada, setParticipacaoCriada] = useState<any>(null);
  const [pagamentoPendente, setPagamentoPendente] = useState<any>(null);
  const [jogadorForm, setJogadorForm] = useState<JogadorForm>({
    nome: "", telefone: "", email: "", notificacao: "whatsapp"
  });
  const [vendedorId, setVendedorId] = useState<string | null>(null);
  const [userAldeiaId, setUserAldeiaId] = useState<string | null>(null);
  const [userNome, setUserNome] = useState<string | null>(null);
  const [apostaConfirmada, setApostaConfirmada] = useState<ApostaConfirmada | null>(null);

  const isVendedor = userRole === "vendedor";
  const numerosOcupados = apostas.flatMap(a => a.numeros);

  const apostasParaLista = isVendedor
    ? apostas.filter(a => a.vendedorId === vendedorId)
    : isAdmin
    ? apostas
    : userNome
    ? apostas.filter(a => a.jogadorNome === userNome)
    : [];

  const randomOptions = [1, 3, 5, 10, 15, 20, 30];
  const custoPorQuadrado = jogo?.custoQuadrado || jogo?.preco || 5;
  const valorMercado = jogo?.valorMercadoVaca || jogo?.valorPremioVaca || jogo?.custoPremioDinheiro || 1000;
  const valorCompra = jogo?.valorCompraVaca || 800;

  const dimensoes: Dimensoes = jogo?.dimensoesCampo
    ? JSON.parse(jogo.dimensoesCampo)
    : { x: 10, y: 10, total: 100 };

  const totalCells = dimensoes.x * dimensoes.y;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const row = Math.floor(i / dimensoes.x);
    const col = i % dimensoes.x;
    return {
      id: i + 1, x: col + 1, y: row + 1,
      label: `${col + 1}-${row + 1}`,
      display: `X${col + 1}Y${row + 1}`
    };
  });

  const rentabilidade = calcularRentabilidade(custoPorQuadrado, valorMercado, valorCompra, totalCells);
  const statusRentabilidade = getRentabilidadeStatus(rentabilidade);

  const fetchJogo = useCallback(async () => {
    if (!jogoId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/jogos/${jogoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) setJogo(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar jogo:", error);
    } finally { setLoading(false); }
  }, [jogoId, setJogo]);

  const fetchApostas = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem("user");
      let userParam = "";
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userParam = "&user=" + btoa(JSON.stringify(userData));
      }
      const response = await fetch(`/api/apostas?tipo=poio_da_vaca${userParam}`, { headers: {} });
      const data = await response.json();
      if (data.data) {
        const apostasConvertidas = data.data.map((a: any) => ({
          ...a,
          numeros: typeof a.numeros === 'string' ? JSON.parse(a.numeros) : a.numeros
        }));
        setApostas(apostasConvertidas);
      }
    } catch (error) {
      console.error("Erro ao carregar apostas:", error);
    }
  }, []);

  useEffect(() => {
    fetchApostas();
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.id) setVendedorId(user.id);
        if (user.aldeiaId) setUserAldeiaId(user.aldeiaId);
        if (user.nome) {
          setUserNome(user.nome);
          setJogadorForm(prev => ({
            ...prev,
            nome: user.nome || "",
            telefone: user.telefone || "",
            email: user.email || ""
          }));
        }
      } catch (e) {}
    }
  }, [fetchApostas]);

  const handleSquareClick = (id: number) => {
    if (numerosOcupados.includes(id)) {
      toast.error("Este quadrado já foi escolhido por outro jogador!");
      return;
    }
    setSelectedSquares(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      return [...prev, id];
    });
  };

  const handleRandomPlay = (count: number) => {
    const available = cells.filter(c => !selectedSquares.includes(c.id) && !numerosOcupados.includes(c.id));
    if (available.length < count) {
      toast.error(`Apenas ${available.length} quadrado${available.length !== 1 ? 's' : ''} disponível${available.length !== 1 ? 's' : ''}!`);
      return;
    }
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count).map(c => c.id);
    setSelectedSquares(prev => [...prev, ...selected]);
    toast.success(`${count} quadrado${count > 1 ? 's' : ''} selecionado${count > 1 ? 's' : ''}!`);
  };

  const handleClearSelection = () => setSelectedSquares([]);

  const handleBet = () => {
    if (selectedSquares.length === 0) {
      toast.error("Selecione pelo menos um quadrado!");
      return;
    }
    const numerosIndisponiveis = selectedSquares.filter(n => numerosOcupados.includes(n));
    if (numerosIndisponiveis.length > 0) {
      toast.error("Alguns quadrados selecionados já foram escolhidos por outro jogador!");
      return;
    }
    if (isNonRegularUser && !playerDataModified) {
      setPlayerDataConfirmOpen(true);
    } else {
      setBetModalOpen(true);
    }
  };

  const handlePlayerConfirmOwnData = () => {
    setPlayerDataConfirmOpen(false);
    setPlayerDataModified(false);
    setBetModalOpen(true);
  };

  const handlePlayerConfirmNewData = (data: { nome: string; telefone: string; email: string }) => {
    setJogadorForm(prev => ({ ...prev, nome: data.nome, telefone: data.telefone, email: data.email }));
    setPlayerDataModified(true);
    setPlayerDataConfirmOpen(false);
    setBetModalOpen(true);
  };

  const handleSubmitBet = () => {
    if (!jogadorForm.nome.trim()) {
      toast.error("Por favor, insira o nome do jogador!");
      return;
    }
    if (!vendedorId && !jogadorForm.telefone.trim() && !jogadorForm.email.trim()) {
      toast.error("Por favor, insira um telemóvel ou email do jogador!");
      return;
    }
    if (!jogo) {
      toast.error("Erro: Jogo não encontrado!");
      return;
    }
    const custoTotal = selectedSquares.length * custoPorQuadrado;
    setPagamentoPendente({
      jogoId: jogo.id,
      numeros: selectedSquares,
      jogador: { nome: jogadorForm.nome, telefone: jogadorForm.telefone || undefined, email: jogadorForm.email || undefined },
      vendedorId: vendedorId || undefined,
      custoTotal,
    });
    setBetModalOpen(false);
    setPaymentModalOpen(true);
  };

  const processarPagamento = async (metodo: "dinheiro" | "mbway" | "stripe" | "saldo" | "transferencia") => {
    if (!pagamentoPendente) return;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const canUseDinheiro = ['vendedor', 'aldeia_admin', 'super_admin'].includes(user.role);
    if (metodo === "dinheiro" && !canUseDinheiro) {
      toast.error("Apenas vendedores e administradores podem pagar em dinheiro");
      return;
    }
    try {
      if (metodo === "dinheiro") await criarAposta(true, "dinheiro");
      else if (metodo === "saldo") await criarAposta(true, "saldo");
      else if (metodo === "mbway") {
        const tel = jogadorForm.telefone;
        if (!tel) { toast.error("Telefone obrigatório para MBWay"); return; }
        const res = await apiRequest("/api/pagamentos/mbway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telefone: tel, valor: pagamentoPendente.custoTotal, descricao: `Aposta Poio da Vaca - ${pagamentoPendente.numeros.length} números` })
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Erro ao iniciar pagamento MBWay"); return; }
        toast.success("Pagamento MBWay enviado! Confirme no seu telemóvel.");
        await criarAposta(true, "mbway");
      } else if (metodo === "stripe") {
        toast.info("Stripe em implementação");
      }
    } catch (error) {
      console.error("Erro no pagamento:", error);
      toast.error("Erro ao processar pagamento");
    }
  };

  const criarAposta = async (pago: boolean, metodoPagamento: string = "dinheiro") => {
    if (!pagamentoPendente) return;
    const usarSaldo = metodoPagamento === "saldo";
    try {
      const aposta = { ...pagamentoPendente, pago, usarSaldo };
      const response = await apiRequest("/api/apostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aposta)
      });
      if (response.ok) {
        const novaAposta = await response.json();
        setApostas(prev => [...prev, {
          ...novaAposta.data,
          numeros: typeof novaAposta.data.numeros === 'string' ? JSON.parse(novaAposta.data.numeros) : novaAposta.data.numeros
        }]);
        setPaymentModalOpen(false);
        const labels = pagamentoPendente.numeros.map((id: number) => cells[id - 1]?.display || `N${id}`).join(", ");
        if (jogadorForm.notificacao === "whatsapp" && jogadorForm.telefone) {
          const telLimpo = jogadorForm.telefone.replace(/\D/g, "");
          const msg = encodeURIComponent(`Aposta registada!\n\nJogo: Poio da Vaca\nNúmeros: ${labels}\nPagamento: ${pago ? "Confirmado" : "Pendente"}\nObrigado por participar!`);
          window.open(`https://wa.me/351${telLimpo}?text=${msg}`, "_blank");
        } else if (jogadorForm.notificacao === "email" && jogadorForm.email) {
          const subject = encodeURIComponent("Aposta Registada - Poio da Vaca");
          const body = encodeURIComponent(`Aposta registada!\n\nJogo: Poio da Vaca\nNúmeros: ${labels}\nPagamento: ${pago ? "Confirmado" : "Pendente"}\n\nObrigado por participar!\n\nAldeias Games`);
          window.open(`mailto:${jogadorForm.email}?subject=${subject}&body=${body}`);
        }
        toast.success(`Aposta registada${pago ? " e paga" : ""} para ${jogadorForm.nome}!`);
        setApostaConfirmada({ id: novaAposta.data.id, numeros: pagamentoPendente.numeros, labels, pago, nome: jogadorForm.nome });
        setSelectedSquares([]);
        setJogadorForm({ nome: "", telefone: "", email: "", notificacao: "whatsapp" });
        setPagamentoPendente(null);
        refreshBalance();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao registar aposta.");
      }
    } catch (error) {
      console.error("Erro ao submeter aposta:", error);
      toast.error("Erro ao registar aposta.");
    }
  };

  return {
    loading, setLoading,
    selectedSquares, apostas, betModalOpen, setBetModalOpen,
    paymentModalOpen, setPaymentModalOpen,
    participacaoCriada, pagamentoPendente,
    jogadorForm, setJogadorForm,
    vendedorId, userAldeiaId, userNome,
    apostaConfirmada, setApostaConfirmada,
    dimensoes, cells, totalCells,
    numerosOcupados, apostasParaLista,
    custoPorQuadrado, valorMercado, valorCompra,
    rentabilidade, statusRentabilidade,
    randomOptions, isVendedor,
    fetchJogo, fetchApostas,
    handleSquareClick, handleRandomPlay,
    handleClearSelection, handleBet,
    handleSubmitBet, processarPagamento,
    criarAposta,
    handlePlayerConfirmOwnData, handlePlayerConfirmNewData,
  };
}
