"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Log } from "@/features/admin/components/types";
import { X } from "lucide-react";

interface AuditLogDetailModalProps {
  log: Log | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailModal({ log, open, onOpenChange }: AuditLogDetailModalProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Registo de Acesso</DialogTitle>
          <DialogDescription>
            Informações completas do registo de acesso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Badge variant={log.sucesso ? "default" : "destructive"}>
                {log.sucesso ? "Sucesso" : "Falha"}
              </Badge>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">Email</span>
              <p className="text-sm">{log.email}</p>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">Endereço IP</span>
              <p className="text-sm font-mono">{log.ip}</p>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">User Agent</span>
              <p className="text-sm text-wrap break-words">{log.userAgent}</p>
            </div>

            {log.motivo && (
              <div className="grid gap-2">
                <span className="text-sm font-medium text-muted-foreground">Motivo</span>
                <p className="text-sm">{log.motivo}</p>
              </div>
            )}

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">Data/Hora</span>
              <p className="text-sm">{formatDate(log.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
