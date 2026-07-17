"use client";
import { useCallback } from "react";
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";
import { logJogoToggle } from "@/lib/audit";
import { Badge } from "@/components/ui/badge";
import type { JogoData } from "@/components/modals/create-jogo-modal";
import type { AldeiaData } from "@/components/modals/aldeia-modal";
import type { UserData } from "@/components/modals/user-modal";
import type { Jogo, Aldeia, User } from "../components/types";

export interface AdminCrudHandlersParams {
  fetchData: () => Promise<void>;
  aldeiaId?: string;
  userRole: string;
  // Modal states
  eventoModalOpen: boolean;
  jogoModalOpen: boolean;
  aldeiaModalOpen: boolean;
  userModalOpen: boolean;
  convertPrizeOpen: boolean;
  deleteData: { type: string; id: string } | null;
  toggleJogoData: { jogo: Jogo; novoEstado: "aberto" | "fechado" } | null;
  selectedEventoIdParaJogo: string;
  filtroEventoId: string | null;
  // Setters
  setTestJogoOpen: (v: boolean) => void;
  setTestJogo: (v: Jogo | null) => void;
  setTestJogoTotalParticipacoes: (v: number) => void;
  setSelectedEventoIdParaJogo: (v: string) => void;
  setFiltroEventoId: (v: string | null) => void;
  setEventoModalOpen: (v: boolean) => void;
  setJogoModalOpen: (v: boolean) => void;
  setAldeiaModalOpen: (v: boolean) => void;
  setUserModalOpen: (v: boolean) => void;
  setConvertPrizeOpen: (v: boolean) => void;
  setDeleteData: (v: { type: string; id: string } | null) => void;
  setToggleJogoData: (v: { jogo: Jogo; novoEstado: "aberto" | "fechado" } | null) => void;
  setSelectedEvento: (v: any) => void;
  setSelectedJogo: (v: JogoData | null) => void;
  setSelectedAldeia: (v: AldeiaData | null) => void;
  setSelectedUser: (v: UserData | null) => void;
}

export default function useAdminCrudHandlers(params: AdminCrudHandlersParams) {
  const {
    fetchData,
    aldeiaId,
    userRole,
    deleteData,
    toggleJogoData,
    setTestJogoOpen,
    setTestJogo,
    setTestJogoTotalParticipacoes,
    setSelectedEventoIdParaJogo,
    setFiltroEventoId,
    setEventoModalOpen,
    setJogoModalOpen,
    setAldeiaModalOpen,
    setUserModalOpen,
    setConvertPrizeOpen,
    setDeleteData,
    setToggleJogoData,
    setSelectedJogo,
    setSelectedAldeia,
    setSelectedUser,
  } = params;

  const handleProcessRecurringEvents = useCallback(async () => {
    try {
      const res = await apiRequest("/api/eventos/process-recurring", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao processar eventos recorrentes");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar eventos recorrentes");
    }
  }, [fetchData]);

  const handleSaveEvento = useCallback(async (data: any) => {
    const isEditing = !!data.id;
    const jogosSelecionados = data.jogosSelecionados || [];
    const eventoData = { ...data };
    delete eventoData.jogosSelecionados;

    const url = isEditing ? `/api/eventos/${data.id}` : `/api/eventos`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await apiRequest(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventoData),
      });

      if (res.ok) {
        const evento = await res.json();
        const eventoId = evento.data?.id || evento.id;

        if (jogosSelecionados.length > 0 && eventoId) {
          try {
            const jogosRes = await apiRequest(`/api/jogos?eventoId=${eventoId}`, {});

            let jogosExistentes: any[] = [];
            if (jogosRes.ok) {
              const jogosData = await jogosRes.json();
              jogosExistentes = jogosData.data || [];
            }

            const jogosExistentesTipos = jogosExistentes.map((j: any) => j.tipo);
            const jogosParaCriar = jogosSelecionados.filter((tipo: string) => !jogosExistentesTipos.includes(tipo));
            const jogosParaRemover = jogosExistentes.filter((j: any) => !jogosSelecionados.includes(j.tipo));

            for (const tipoJogo of jogosParaCriar) {
              const jogoData = {
                nome: `${data.nome} - ${tipoJogo}`,
                tipo: tipoJogo,
                configuracao: "{}",
                preco: tipoJogo === "rifa" ? 2 : 3,
                stockInicial: 100,
                eventoId,
                aldeiaId: data.aldeiaId,
                estado: "aberto",
              };

              await fetch("/api/jogos", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(jogoData),
              });
            }

            for (const jogo of jogosParaRemover) {
              const participacoesRes = await fetch(`/api/participacoes?jogoId=${jogo.id}&limit=1`, {});

              if (participacoesRes.ok) {
                const participacoesData = await participacoesRes.json();
                const totalParticipacoes = participacoesData.pagination?.total || 0;

                if (totalParticipacoes === 0) {
                  await fetch(`/api/jogos/${jogo.id}`, {
                    method: "DELETE",
                  });
                }
              }
            }

            const mensagem = isEditing
              ? `${jogosParaCriar.length} jogo(s) adicionado(s) e ${jogosParaRemover.length} jogo(s) removido(s)`
              : `${jogosSelecionados.length} jogo(s) criado(s)`;

            if (jogosParaCriar.length > 0 || jogosParaRemover.length > 0) {
              toast.success(mensagem);
            }
          } catch (error) {
            console.error("Erro ao gerenciar jogos:", error);
            toast.error("Erro ao gerenciar jogos do evento");
          }
        }

        toast.success(`Evento ${isEditing ? "atualizado" : "criado"} com sucesso!`);
        setTimeout(() => {
          fetchData();
          setEventoModalOpen(false);
        }, 500);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar evento");
      }
    } catch (error: any) {
      console.error("Erro ao salvar evento:", error);
      toast.error(error.message || "Erro ao salvar evento");
    }
  }, [fetchData, setEventoModalOpen]);

  const handleSaveJogo = useCallback(async (data: any) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/jogos/${data.id}` : `/api/jogos`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await apiRequest(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        toast.success(`Jogo ${isEditing ? "atualizado" : "criado"} com sucesso!`);
        fetchData();
        setJogoModalOpen(false);
      } else {
        const errorMsg = result.error || result.details?.map((d: any) => d.message).join(", ") || "Erro ao salvar jogo";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      if (!error.message) {
        toast.error("Erro ao salvar jogo");
      }
      throw error;
    }
  }, [fetchData, setJogoModalOpen]);

  const handleToggleJogoEstado = useCallback((jogo: Jogo) => {
    const novoEstado = jogo.estado === "aberto" ? "fechado" : "aberto";
    setToggleJogoData({ jogo, novoEstado });
  }, [setToggleJogoData]);

  const handleTestarJogo = useCallback(async (jogo: Jogo) => {
    setTestJogo(jogo);
    try {
      const res = await fetch(`/api/participacoes?jogoId=${jogo.id}&estadoPagamento=concluido&page=1&limit=1`, {});
      if (res.ok) {
        const data = await res.json();
        const total = data.pagination?.total || 0;
        setTestJogoTotalParticipacoes(total);
      } else {
        console.error("Erro ao buscar participações:", res.status);
        setTestJogoTotalParticipacoes(0);
      }
    } catch (error) {
      console.error("Erro ao buscar participações:", error);
      setTestJogoTotalParticipacoes(0);
    }
    setTestJogoOpen(true);
  }, [setTestJogo, setTestJogoTotalParticipacoes, setTestJogoOpen]);

  const executeToggleJogoEstado = useCallback(async () => {
    if (!toggleJogoData) return;
    const { jogo, novoEstado } = toggleJogoData;
    try {
      const res = await fetch(`/api/jogos/${jogo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: novoEstado }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Jogo ${novoEstado === "aberto" ? "ativado" : "desativado"} com sucesso!`);
        fetchData();

        logJogoToggle(
          userRole,
          jogo.id,
          jogo.nome,
          jogo.estado,
          novoEstado
        );
      } else {
        toast.error(data.error || "Erro ao alterar estado do jogo");
      }
    } catch (error) {
      toast.error("Erro de conexão ao alterar estado do jogo");
    } finally {
      setToggleJogoData(null);
    }
  }, [toggleJogoData, fetchData, userRole, setToggleJogoData]);

  const handleSaveAldeia = useCallback(async (data: any) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/aldeias/${data.id}` : `/api/aldeias`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await apiRequest(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(`Organização ${isEditing ? "atualizada" : "criada"} com sucesso!`);
        fetchData();
        setAldeiaModalOpen(false);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar organização");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar organização");
    }
  }, [fetchData, setAldeiaModalOpen]);

  const handleSaveUser = useCallback(async (data: any) => {
    const isEditing = !!data.id;
    const url = isEditing ? `/api/users/${data.id}` : `/api/users`;
    const method = isEditing ? "PUT" : "POST";

    let userData = { ...data };

    if (userRole === "aldeia_admin" && aldeiaId) {
      userData.aldeiaId = aldeiaId;
      if (data.role === "aldeia_admin") {
        throw new Error("Não tem permissão para criar administradores de aldeia");
      }
    }

    try {
      const res = await apiRequest(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (res.ok) {
        toast.success(`Utilizador ${isEditing ? "atualizado" : "criado"} com sucesso!`);
        fetchData();
        setUserModalOpen(false);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar utilizador");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar utilizador");
    }
  }, [fetchData, setUserModalOpen, userRole, aldeiaId]);

  const handleConvertPrize = useCallback(async (participacaoId: string, valor: number) => {
    try {
      const res = await apiRequest("/api/admin/convert-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participacaoId, valor }),
      });

      if (res.ok) {
        toast.success("Prémio convertido em saldo com sucesso!");
        fetchData();
        setConvertPrizeOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao converter prémio");
      }
    } catch (error) {
      toast.error("Erro ao converter prémio");
    }
  }, [fetchData, setConvertPrizeOpen]);

  const requestDelete = useCallback((type: string, id: string) => {
    setDeleteData({ type, id });
  }, [setDeleteData]);

  const executeDelete = useCallback(async () => {
    if (!deleteData) return;

    const urls: Record<string, string> = {
      evento: `/api/eventos/${deleteData.id}`,
      jogo: `/api/jogos/${deleteData.id}`,
      aldeia: `/api/aldeias/${deleteData.id}`,
      user: `/api/users/${deleteData.id}`,
    };

    try {
      const res = await fetch(urls[deleteData.type], {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Eliminado com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao eliminar");
      }
    } catch (error) {
      toast.error("Erro ao eliminar");
    } finally {
      setDeleteData(null);
    }
  }, [deleteData, fetchData, setDeleteData]);

  const getEstadoBadge = useCallback((estado: string) => {
    const variants: Record<string, any> = {
      rascunho: "secondary",
      ativo: "default",
      aberto: "default",
      pausado: "warning",
      fechado: "destructive",
      finalizado: "outline",
    };
    return <Badge variant={variants[estado] || "default"}>{estado}</Badge>;
  }, []);

  const handleVerJogos = useCallback((eventoId: string) => {
    setSelectedEventoIdParaJogo(eventoId);
    setFiltroEventoId(eventoId);
  }, [setSelectedEventoIdParaJogo, setFiltroEventoId]);

  const handleLimparFiltroJogos = useCallback(() => {
    setFiltroEventoId(null);
    setSelectedEventoIdParaJogo("");
  }, [setFiltroEventoId, setSelectedEventoIdParaJogo]);

  const convertJogoToJogoData = useCallback((jogo: Jogo): JogoData => {
    let config: Record<string, unknown> = {};
    if (jogo.configuracao) {
      try {
        config = JSON.parse(jogo.configuracao);
      } catch {
        config = {};
      }
    }
    const jogoData: JogoData = {
      id: jogo.id,
      nome: jogo.nome,
      tipo: jogo.tipo as "poio_da_vaca" | "rifa" | "euromilhoes" | "raspadinha",
      descricao: (jogo as any).descricao,
      preco: jogo.preco,
      stockInicial: jogo.stockInicial ?? 100,
      limitePorUsuario: (config.limitePorUsuario as number) ?? 10,
      eventoId: jogo.eventoId,
      configuracao: config,
    };
    if (config.modoSorteio === "app" || config.modoSorteio === "externo") {
      jogoData.modoSorteio = config.modoSorteio;
    }
    if (typeof config.detalhesSorteioExterno === "string") {
      jogoData.detalhesSorteioExterno = config.detalhesSorteioExterno;
    }
    if (Array.isArray(config.premios)) {
      jogoData.premios = config.premios;
    }
    if (typeof config.custoQuadrado === "number") {
      jogoData.custoQuadrado = config.custoQuadrado;
    }
    if (typeof config.valorMercadoVaca === "number") {
      jogoData.valorMercadoVaca = config.valorMercadoVaca;
    }
    if (typeof config.valorCompraVaca === "number") {
      jogoData.valorCompraVaca = config.valorCompraVaca;
    }
    if (typeof config.dimensoesCampo === "string") {
      jogoData.dimensoesCampo = config.dimensoesCampo;
    }
    if (typeof config.permitirStripe === "boolean") {
      jogoData.permitirStripe = config.permitirStripe;
    }
    return jogoData;
  }, []);

  const convertAldeiaToAldeiaData = useCallback((aldeia: Aldeia): AldeiaData => {
    return {
      id: aldeia.id,
      nome: aldeia.nome,
      tipoOrganizacao: aldeia.tipoOrganizacao as "aldeia" | "escola" | "associacao_pais" | "clube",
      descricao: (aldeia as any).descricao,
      telefone: (aldeia as any).telefone,
      email: aldeia.email,
    };
  }, []);

  const convertUserToUserData = useCallback((user: User): UserData => {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      password: undefined,
      role: user.role as "super_admin" | "aldeia_admin" | "vendedor" | "user",
      telefone: user.telefone,
      aldeiaId: user.aldeiaId,
    };
  }, []);

  const handleSetSelectedJogo = useCallback((jogo: Jogo | null) => {
    setSelectedJogo(jogo ? convertJogoToJogoData(jogo) : null);
  }, [convertJogoToJogoData, setSelectedJogo]);

  const handleSetSelectedAldeia = useCallback((aldeia: Aldeia | null) => {
    setSelectedAldeia(aldeia ? convertAldeiaToAldeiaData(aldeia) : null);
  }, [convertAldeiaToAldeiaData, setSelectedAldeia]);

  const handleSetSelectedUser = useCallback((user: User | null) => {
    setSelectedUser(user ? convertUserToUserData(user) : null);
  }, [convertUserToUserData, setSelectedUser]);

  return {
    handleProcessRecurringEvents,
    handleSaveEvento,
    handleSaveJogo,
    handleToggleJogoEstado,
    handleTestarJogo,
    executeToggleJogoEstado,
    handleSaveAldeia,
    handleSaveUser,
    handleConvertPrize,
    requestDelete,
    executeDelete,
    getEstadoBadge,
    handleVerJogos,
    handleLimparFiltroJogos,
    convertJogoToJogoData,
    convertAldeiaToAldeiaData,
    convertUserToUserData,
    handleSetSelectedJogo,
    handleSetSelectedAldeia,
    handleSetSelectedUser,
  };
}
