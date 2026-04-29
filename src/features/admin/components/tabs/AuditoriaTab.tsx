"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Log } from "../types";

interface AuditoriaTabProps {
  logs: Log[];
}

export function AuditoriaTab({ logs }: AuditoriaTabProps) {
  const [logSearch, setLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);

  const filteredLogs = useMemo(() => {
    const searchLower = logSearch.toLowerCase();
    return logs.filter(log => {
      if (!searchLower) return true;
      return (
        log.email?.toLowerCase().includes(searchLower) ||
        log.ip?.toLowerCase().includes(searchLower) ||
        log.userAgent?.toLowerCase().includes(searchLower) ||
        log.motivo?.toLowerCase().includes(searchLower)
      );
    });
  }, [logs, logSearch]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Auditoria e Logs de Acesso</h2>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="flex-1 max-w-md">
          <Label htmlFor="logSearch" className="sr-only">
            Pesquisar log
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="logSearch"
              placeholder="Pesquisar por email, IP, user agent..."
              value={logSearch}
              onChange={(e) => {
                setLogSearch(e.target.value);
                setLogPage(1);
              }}
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
              Os logs de acesso aparecem aqui quando os utilizadores iniciam sessão.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLogs
            .slice((logPage - 1) * 10, logPage * 10)
            .map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant={log.sucesso ? "default" : "destructive"}>
                        {log.sucesso ? "Sucesso" : "Falha"}
                      </Badge>
                      <h3 className="font-semibold">{log.email}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      IP: {log.ip} • User Agent: {log.userAgent?.substring(0, 50)}{log.userAgent?.length > 50 ? '...' : ''}
                    </p>
                    {log.motivo && (
                      <p className="text-xs text-muted-foreground">{log.motivo}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </p>
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
            <Button
              variant="outline"
              size="sm"
              disabled={logPage === 1}
              onClick={() => setLogPage(logPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={logPage * 10 >= filteredLogs.length}
              onClick={() => setLogPage(logPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
