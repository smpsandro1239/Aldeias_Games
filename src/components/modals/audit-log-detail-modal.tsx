"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Log } from "@/features/admin/components/types";
import { X, ShieldAlert } from "lucide-react";

interface AuditLogDetailModalProps {
  log: Log | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailModal({ log, open, onOpenChange }: AuditLogDetailModalProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-describedby="audit-log-description">
        <DialogHeader className="bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-red-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-amber-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-amber-600/20 p-2 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>
            Detalhes do Registo de Acesso
          </DialogTitle>
          <DialogDescription id="audit-log-description">
            Informações completas do registo de acesso #{log.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Badge variant={log.sucesso ? "default" : "destructive"} aria-label={`Status do acesso: ${log.sucesso ? "Sucesso" : "Falha"}`}>
                {log.sucesso ? "Sucesso" : "Falha"}
              </Badge>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">Email</span>
              <p className="text-sm" aria-label={`Email do utilizador: ${log.email}`}>
                {log.email}
              </p>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">Endereço IP</span>
              <p className="text-sm font-mono" aria-label={`Endereço IP: ${log.ip}`}>
                {log.ip}
              </p>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">User Agent</span>
              <p className="text-sm text-wrap break-words" aria-label={`User Agent: ${log.userAgent}`}>
                {log.userAgent}
              </p>
            </div>

            {log.motivo && (
              <div className="grid gap-2">
                <span className="text-sm font-medium text-muted-foreground">Motivo</span>
                <p className="text-sm" aria-label={`Motivo da falha: ${log.motivo}`}>
                  {log.motivo}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">Data/Hora</span>
              <p className="text-sm" aria-label={`Data e hora do acesso: ${formatDate(log.createdAt)}`}>
                {formatDate(log.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} aria-label="Fechar modal de detalhes do registo de acesso">
            <X className="h-4 w-4 mr-2" aria-hidden="true" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}