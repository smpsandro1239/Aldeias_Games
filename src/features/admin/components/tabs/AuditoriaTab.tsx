"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Search, History, LogIn, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AuditLogDetailModal } from "@/components/modals/audit-log-detail-modal";

interface LogEntry {
  id: string;
  tipo: 'acesso' | 'audit';
  email: string;
  sucesso: boolean;
  ip: string;
  userAgent: string;
  motivo?: string;
  createdAt: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  metadata?: unknown;
  user?: { nome: string; role: string } | null;
}

interface AuditoriaTabProps {
  logs: LogEntry[];
}

export function AuditoriaTab({ logs }: AuditoriaTabProps) {
  const [logSearch, setLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'acesso' | 'audit'>('todos');

  const filteredLogs = useMemo(() => {
    const searchLower = logSearch.toLowerCase();
    return logs.filter(log => {
      if (filtroTipo !== 'todos' && log.tipo !== filtroTipo) return false;
      if (!searchLower) return true;
      return (
        log.email?.toLowerCase().includes(searchLower) ||
        log.ip?.toLowerCase().includes(searchLower) ||
        log.userAgent?.toLowerCase().includes(searchLower) ||
        log.motivo?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower)
      );
    });
  }, [logs, logSearch, filtroTipo]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Auditoria e Logs</h2>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filtroTipo === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroTipo('todos')}
        >
          <FileText className="w-4 h-4 mr-1" />
          Todos
        </Button>
        <Button
          variant={filtroTipo === 'acesso' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroTipo('acesso')}
        >
          <LogIn className="w-4 h-4 mr-1" />
          Acessos
        </Button>
        <Button
          variant={filtroTipo === 'audit' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltroTipo('audit')}
        >
          <History className="w-4 h-4 mr-1" />
          Auditoria
        </Button>
        <div className="flex-1 max-w-md ml-auto">
          <Label htmlFor="logSearch" className="sr-only">Pesquisar log</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="logSearch"
              placeholder="Pesquisar..."
              value={logSearch}
              onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      {filteredLogs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem registos</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Os logs de acesso e auditoria aparecem aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLogs
            .slice((logPage - 1) * 10, logPage * 10)
            .map((log) => (
              <Card key={log.id} className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center mb-1">
                        <Badge variant={log.tipo === 'acesso' ? (log.sucesso ? 'default' : 'destructive') : 'secondary'}>
                          {log.tipo === 'acesso' ? (log.sucesso ? 'Login' : 'Falha') : 'Ação'}
                        </Badge>
                        {log.tipo === 'audit' && log.action && (
                          <Badge variant="outline" className="font-mono text-xs">
                            {log.action}
                          </Badge>
                        )}
                        {log.user?.nome && (
                          <span className="text-xs text-muted-foreground">{log.user.nome}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {log.tipo === 'acesso' ? log.email : log.motivo || log.action}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        IP: {log.ip}
                        {log.userAgent && ` • ${log.userAgent.substring(0, 60)}${log.userAgent.length > 60 ? '...' : ''}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {log.tipo === 'acesso' ? (
                        <LogIn className={`w-5 h-5 ${log.sucesso ? 'text-green-500' : 'text-destructive'}`} />
                      ) : (
                        <History className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Paginação */}
      {filteredLogs.length > 10 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {(logPage - 1) * 10 + 1} a {Math.min(logPage * 10, filteredLogs.length)} de {filteredLogs.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={logPage === 1} onClick={() => setLogPage(logPage - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={logPage * 10 >= filteredLogs.length} onClick={() => setLogPage(logPage + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
