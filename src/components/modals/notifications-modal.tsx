"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, Trophy, CreditCard, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

interface Notificacao {
  id: string;
  tipo: "sistema" | "pagamento" | "sorteio" | "premio" | "campanha" | "alerta";
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

const iconesPorTipo = {
  sistema: Info,
  pagamento: CreditCard,
  sorteio: Trophy,
  premio: Trophy,
  campanha: Bell,
  alerta: AlertCircle,
};

const coresPorTipo = {
  sistema: "text-blue-500",
  pagamento: "text-green-500",
  sorteio: "text-purple-500",
  premio: "text-yellow-500",
  campanha: "text-indigo-500",
  alerta: "text-red-500",
};

export function NotificationsModal({
  open,
  onOpenChange,
  notificacoes,
  onMarcarComoLida,
  onMarcarTodasComoLidas,
  onApagar,
}: NotificationsModalProps) {
  const [filtro, setFiltro] = useState<"todas" | "naoLidas">("todas");

  const notificacoesFiltradas =
    filtro === "naoLidas" ? notificacoes.filter((n) => !n.lida) : notificacoes;

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
            {naoLidas > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {naoLidas}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            As suas notificações e alertas
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex gap-2 mb-2">
          <Button
            variant={filtro === "todas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro("todas")}
          >
            Todas
          </Button>
          <Button
            variant={filtro === "naoLidas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro("naoLidas")}
          >
            Não Lidas
          </Button>
          {naoLidas > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarcarTodasComoLidas}>
              <Check className="h-4 w-4 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Lista de notificações */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {notificacoesFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sem notificações</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notificacoesFiltradas.map((notificacao) => {
                const Icone = iconesPorTipo[notificacao.tipo];
                const cor = coresPorTipo[notificacao.tipo];

                return (
                  <div
                    key={notificacao.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      notificacao.lida ? "bg-muted/50" : "bg-card border-primary/20"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn("mt-0.5", cor)}>
                        <Icone className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn("font-medium text-sm", !notificacao.lida && "font-semibold")}>
                            {notificacao.titulo}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTime(notificacao.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notificacao.mensagem}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {!notificacao.lida && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onMarcarComoLida(notificacao.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Marcar como lida
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApagar(notificacao.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
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
