"use client";
import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";

import type {
  Stats,
  Evento,
  Jogo,
  User,
  Aldeia,
  Transacao,
  Log,
  Vencedor,
  VendedorStats,
} from "../components/types";

interface UseAdminDashboardDataProps {
  aldeiaId?: string;
  userRole?: string;
  token?: string;
  aldeia?: {
    id: string;
    nome: string;
    slug: string;
    tipoOrganizacao: string;
    logoUrl?: string;
    metodosPagamentoDefault?: string;
  };
}

export interface UseAdminDashboardDataReturn {
  loading: boolean;
  stats: Stats | null;
  eventos: Evento[];
  jogos: Jogo[];
  users: User[];
  vencedores: Vencedor[];
  aldeias: Aldeia[];
  transacoes: Transacao[];
  logs: Log[];
  vendedoresStats: VendedorStats[];
  pedidosPendentesCount: number;
  entregasPendentesCount: number;
  paymentMethodsDefault: string[];
  selectedEventoIdParaJogo: string;
  filtroEventoId: string | null;
  activeTab: string;
  eventoModalOpen: boolean;

  setActiveTab: (tab: string) => void;
  setPaymentMethodsDefault: (methods: string[]) => void;
  setSelectedEventoIdParaJogo: (id: string) => void;
  setFiltroEventoId: (id: string | null) => void;
  setEventoModalOpen: (open: boolean) => void;

  fetchData: () => Promise<void>;
}

export function useAdminDashboardData({
  aldeiaId,
  userRole = "aldeia_admin",
  token,
  aldeia,
}: UseAdminDashboardDataProps): UseAdminDashboardDataReturn {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState<Stats | null>({
    totalEventos: 0,
    eventosAtivos: 0,
    totalJogos: 0,
    jogosAtivos: 0,
    totalParticipacoes: 0,
    totalAngariado: 0,
  });
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [vencedores, setVencedores] = useState<Vencedor[]>([]);
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [vendedoresStats, setVendedoresStats] = useState<VendedorStats[]>([]);

  const [pedidosPendentesCount, setPedidosPendentesCount] = useState(0);
  const [entregasPendentesCount, setEntregasPendentesCount] = useState(0);

  const [eventoModalOpen, setEventoModalOpen] = useState(false);
  const [paymentMethodsDefault, setPaymentMethodsDefault] = useState<string[]>(["saldo", "dinheiro"]);
  const [selectedEventoIdParaJogo, setSelectedEventoIdParaJogo] = useState("");
  const [filtroEventoId, setFiltroEventoId] = useState<string | null>(null);

  const getApi = useCallback(async (url: string, revalidate: number = 30) => {
    try {
      const res = await apiRequest(url, {
        next: { revalidate },
      });
      if (res.ok) {
        const json = await res.json();
        return json.data ?? json;
      }
      return null;
    } catch (error) {
      console.error("Erro na requisição:", url, error);
      return null;
    }
  }, [token]);

  const fetchPedidosPendentes = useCallback(async () => {
    try {
      const q = aldeiaId ? `?aldeiaId=${aldeiaId}&estado=pendente` : "?estado=pendente";
      const res = await apiRequest(`/api/admin/pedidos-carregamento${q}`, {});
      if (res.ok) {
        const data = await res.json();
        setPedidosPendentesCount(data.data?.length || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos pendentes:", error);
    }
  }, [aldeiaId]);

  const fetchEntregasPendentes = useCallback(async () => {
    try {
      const q = aldeiaId ? `?aldeiaId=${aldeiaId}&estado=solicitado` : "?estado=solicitado";
      const res = await apiRequest(`/api/admin/entregas-saldo${q}`, {});
      if (res.ok) {
        const data = await res.json();
        setEntregasPendentesCount(data.data?.length || 0);
      }
    } catch (error) {
      console.error("Erro ao buscar entregas pendentes:", error);
    }
  }, [aldeiaId]);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const q = aldeiaId ? `?aldeiaId=${aldeiaId}` : "";

      const [st, ev, jg, us, vencedoresData] = await Promise.all([
        getApi(`/api/dashboard/stats${q}`, 20),
        getApi(`/api/eventos${q}`, 30),
        getApi(`/api/jogos${q}`, 30),
        getApi(`/api/users${q}`, 40),
        getApi(`/api/participacoes${q}${q ? '&' : '?'}ganhador=true`, 30),
      ]);

      setStats(st || null);
      setEventos(ev || []);
      setJogos(jg || []);
      setUsers(us || []);
      setVencedores(vencedoresData || []);

      if (userRole === "super_admin") {
        const [al, tr, lg] = await Promise.all([
          getApi(`/api/aldeias`, 60),
          getApi(`/api/admin/transacoes`, 40),
          getApi(`/api/admin/logs`, 60),
        ]);
        setAldeias(al?.aldeias ?? al ?? []);
        setTransacoes(tr || []);
        setLogs(lg || []);
      }

      if (userRole === "aldeia_admin") {
        const vs = await getApi(`/api/admin/vendedores-stats`, 60);
        setVendedoresStats(vs || []);
      }

      await Promise.all([fetchPedidosPendentes(), fetchEntregasPendentes()]);
    } catch (error) {
      toast.error("Erro ao carregar dados do dashboard");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [aldeiaId, userRole, getApi, fetchPedidosPendentes, fetchEntregasPendentes]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Recarregar dados quando o modal de evento fechar
  useEffect(() => {
    if (!eventoModalOpen) {
      fetchData();
    }
  }, [eventoModalOpen, fetchData]);

  // Carregar payment methods defaults
  useEffect(() => {
    if (aldeia?.metodosPagamentoDefault) {
      try {
        const defaults = JSON.parse(aldeia.metodosPagamentoDefault);
        setPaymentMethodsDefault(defaults);
      } catch {
        setPaymentMethodsDefault(["saldo", "dinheiro"]);
      }
    }
  }, [aldeia]);

  return {
    loading,
    stats,
    eventos,
    jogos,
    users,
    vencedores,
    aldeias,
    transacoes,
    logs,
    vendedoresStats,
    pedidosPendentesCount,
    entregasPendentesCount,
    paymentMethodsDefault,
    selectedEventoIdParaJogo,
    filtroEventoId,
    activeTab,
    eventoModalOpen,
    setActiveTab,
    setPaymentMethodsDefault,
    setSelectedEventoIdParaJogo,
    setFiltroEventoId,
    setEventoModalOpen,
    fetchData,
  };
}
