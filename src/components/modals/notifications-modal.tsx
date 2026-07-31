"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, Trophy, CreditCard, AlertCircle, Info, Banknote, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

// Constants for notification types to avoid magic strings
const NOTIFICATION_TYPES = {
  SISTEMA: 'sistema',
  PAGAMENTO: 'pagamento',
  SORTEIO: 'sorteio',
  PREMIO: 'premio',
  CAMPANHA: 'campanha',
  ALERTA: 'alerta',
  DEPOSITO_CRIADO: 'deposito_criado',
  DEPOSITO_CONFIRMADO: 'deposito_confirmado',
  DEPOSITO_REJEITADO: 'deposito_rejeitado',
} as const;

type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Constants for icons and colors
const ICONES_POR_TIPO = {
  [NOTIFICATION_TYPES.SISTEMA]: Info,
  [NOTIFICATION_TYPES.PAGAMENTO]: CreditCard,
  [NOTIFICATION_TYPES.SORTEIO]: Trophy,
  [NOTIFICATION_TYPES.PREMIO]: Trophy,
  [NOTIFICATION_TYPES.CAMPANHA]: Bell,
  [NOTIFICATION_TYPES.ALERTA]: AlertCircle,
  [NOTIFICATION_TYPES.DEPOSITO_CRIADO]: Banknote,
  [NOTIFICATION_TYPES.DEPOSITO_CONFIRMADO]: ShieldCheck,
  [NOTIFICATION_TYPES.DEPOSITO_REJEITADO]: AlertCircle,
} as const;

const CORES_POR_TIPO = {
  [NOTIFICATION_TYPES.SISTEMA]: "text-secondary",
  [NOTIFICATION_TYPES.PAGAMENTO]: "text-primary",
  [NOTIFICATION_TYPES.SORTEIO]: "text-accent",
  [NOTIFICATION_TYPES.PREMIO]: "text-accent",
  [NOTIFICATION_TYPES.CAMPANHA]: "text-indigo-500",
  [NOTIFICATION_TYPES.ALERTA]: "text-destructive",
  [NOTIFICATION_TYPES.DEPOSITO_CRIADO]: "text-blue-500",
  [NOTIFICATION_TYPES.DEPOSITO_CONFIRMADO]: "text-green-500",
  [NOTIFICATION_TYPES.DEPOSITO_REJEITADO]: "text-destructive",
} as const;

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
}

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notificacoes: Notificacao[];
  onMarcarComoLida: (id: string) => void;
  onMarcarTodasComoLidas: () => void;
  onApagar: (id: string) => void;
}

export function NotificationsModal({
  open,
  onOpenChange,
  notificacoes,
  onMarcarComoLida,
  onMarcarTodasComoLidas,
  onApagar,
}: NotificationsModalProps) {
  const [filtro, setFiltro] = useState<"todas" | "naoLidas">("todas");

  const notificacoesFiltradas = useMemo(() =>
    filtro === "naoLidas" ? notificacoes.filter((n) => !n.lida) : notificacoes,
    [notificacoes, filtro]
  );

  const naoLidas = useMemo(() => notificacoes.filter((n) => !n.lida).length, [notificacoes]);

  const handleFiltroChange = useCallback((novoFiltro: "todas" | "naoLidas") => {
    setFiltro(novoFiltro);
  }, []);

  const handleMarcarComoLida = useCallback((id: string) => {
    onMarcarComoLida(id);
  }, [onMarcarComoLida]);

  const handleApagar = useCallback((id: string) => {
    onApagar(id);
  }, [onApagar]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col" aria-describedby="notifications-description">
        <DialogHeader className="bg-gradient-to-r from-sky-600/10 via-blue-600/10 to-indigo-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-sky-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-sky-600/20 p-2 rounded-lg">
              <Bell className="h-5 w-5 text-sky-600" aria-hidden="true" />
            </div>
            Notificações
            {naoLidas > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full" aria-label={`${naoLidas} notificações não lidas`}>
                {naoLidas}
              </span>
            )}
          </DialogTitle>
          <DialogDescription id="notifications-description">
            As suas notificações e alertas
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex gap-2 mb-2">
          <Button
            type="button"
            variant={filtro === "todas" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFiltroChange("todas")}
            aria-pressed={filtro === "todas"}
          >
            Todas
          </Button>
          <Button
            type="button"
            variant={filtro === "naoLidas" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFiltroChange("naoLidas")}
            aria-pressed={filtro === "naoLidas"}
          >
            Não Lidas
          </Button>
          {naoLidas > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={onMarcarTodasComoLidas} aria-label="Marcar todas como lidas">
              <Check className="h-4 w-4 mr-1" aria-hidden="true" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Lista de notificações */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {notificacoesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">
              <div className="bg-muted/60 mx-auto w-fit p-4 rounded-full mb-2">
                <Bell className="h-10 w-10 opacity-50" aria-hidden="true" />
              </div>
              <p>Sem notificações</p>
            </div>
          ) : (
            <div className="space-y-2" role="list">
              {notificacoesFiltradas.map((notificacao) => {
                const Icone = ICONES_POR_TIPO[notificacao.tipo as keyof typeof ICONES_POR_TIPO] || Info;
                const cor = CORES_POR_TIPO[notificacao.tipo as keyof typeof CORES_POR_TIPO] || "text-muted-foreground";

                return (
                  <div
                    key={notificacao.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all",
                      notificacao.lida ? "bg-muted/50" : "bg-card border-primary/20 shadow-sm"
                    )}
                    role="listitem"
                  >
                    <div className="flex gap-3">
                      <div className={cn("mt-0.5 shrink-0", cor)}>
                        <div className="bg-slate-100 dark:bg-slate-800/60 p-2 rounded-lg">
                          <Icone className="h-5 w-5" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn("font-medium text-sm", !notificacao.lida && "font-semibold")}>
                            {notificacao.titulo}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap" aria-label={`Recebida em ${formatDateTime(notificacao.createdAt)}`}>
                            {formatDateTime(notificacao.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notificacao.mensagem}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {!notificacao.lida && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarcarComoLida(notificacao.id)}
                              aria-label={`Marcar notificação "${notificacao.titulo}" como lida`}
                            >
                              <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                              Marcar como lida
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApagar(notificacao.id)}
                            aria-label={`Apagar notificação "${notificacao.titulo}"`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
                            Apagar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
