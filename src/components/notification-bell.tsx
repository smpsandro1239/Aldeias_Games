"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { NotificationsModal } from "@/components/modals/notifications-modal";
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";

const POLL_INTERVAL = 30000;

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
}

export function NotificationBell({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotificacoes = useCallback(async () => {
    try {
      const res = await apiRequest("/api/notificacoes?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotificacoes(data.data || []);
        setNaoLidas(data.naoLidas ?? 0);
      }
    } catch {
      // Silently fail on polling errors
    }
  }, [token]);

  useEffect(() => {
    fetchNotificacoes();
    intervalRef.current = setInterval(fetchNotificacoes, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotificacoes]);

  const handleMarcarComoLida = async (id: string) => {
    try {
      const res = await apiRequest(`/api/notificacoes/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotificacoes(prev =>
          prev.map(n => n.id === id ? { ...n, lida: true } : n)
        );
        setNaoLidas(prev => Math.max(0, prev - 1));
      }
    } catch {
      toast.error("Erro ao marcar como lida");
    }
  };

  const handleMarcarTodasComoLidas = async () => {
    try {
      const res = await apiRequest("/api/notificacoes", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
        setNaoLidas(0);
      }
    } catch {
      toast.error("Erro ao marcar todas como lidas");
    }
  };

  const handleApagar = async (id: string) => {
    try {
      const res = await apiRequest(`/api/notificacoes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const removida = notificacoes.find(n => n.id === id);
        setNotificacoes(prev => prev.filter(n => n.id !== id));
        if (removida && !removida.lida) {
          setNaoLidas(prev => Math.max(0, prev - 1));
        }
      }
    } catch {
      toast.error("Erro ao apagar notificação");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
        aria-label={`Notificações${naoLidas > 0 ? `, ${naoLidas} não lidas` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </Button>
      <NotificationsModal
        open={open}
        onOpenChange={setOpen}
        notificacoes={notificacoes}
        onMarcarComoLida={handleMarcarComoLida}
        onMarcarTodasComoLidas={handleMarcarTodasComoLidas}
        onApagar={handleApagar}
      />
    </>
  );
}
