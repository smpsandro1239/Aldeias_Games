"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { apiRequest } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pagination } from "@/components/ui/pagination"
import { Loader2, CheckCircle2, XCircle, Clock, Building2, User, AlertTriangle } from "lucide-react"

interface PendingChange {
  id: string
  aldeiaId: string
  aldeia: { id: string; nome: string; slug: string }
  requestedBy: { id: string; nome: string; email: string }
  decidedBy: { id: string; nome: string } | null
  campo: string
  valorAntes: string | null
  valorDepois: string
  estado: string
  decidedAt: string | null
  observacoes: string | null
  createdAt: string
}

const ESTADO_LABELS: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
}

const ESTADO_COLORS: Record<string, string> = {
  pendente: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  aprovado: "bg-green-500/10 text-green-600 border-green-500/30",
  rejeitado: "bg-red-500/10 text-red-600 border-red-500/30",
}

const CAMPO_LABELS: Record<string, string> = {
  iban: "IBAN",
  nomeTitularConta: "Titular da Conta",
}

export default function PendingChangesClient() {
  const { user } = useAuth()
  const router = useRouter()
  const [changes, setChanges] = useState<PendingChange[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [estadoFilter, setEstadoFilter] = useState("pendente")
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null)
  const [actionType, setActionType] = useState<"aprovar" | "rejeitar">("aprovar")
  const [observacoes, setObservacoes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const isSuperAdmin = user?.role === "super_admin"

  const fetchChanges = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (estadoFilter && estadoFilter !== "all") params.set("estado", estadoFilter)

      const res = await apiRequest(`/api/pending-changes?${params.toString()}`)
      if (!res.ok) throw new Error("Erro ao carregar alterações")
      const data = await res.json()
      setChanges(data.pendingChanges || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
      toast.error("Erro ao carregar alterações pendentes")
    } finally {
      setIsLoading(false)
    }
  }, [page, estadoFilter])

  useEffect(() => {
    fetchChanges()
  }, [fetchChanges])

  const handleAction = async () => {
    if (!selectedChange) return
    setIsProcessing(true)
    try {
      const res = await apiRequest(
        `/api/aldeias/${selectedChange.aldeiaId}/pending-changes/${selectedChange.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acao: actionType,
            observacoes: observacoes || undefined,
          }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao processar")
      }
      toast.success(
        actionType === "aprovar"
          ? "Alteração aprovada com sucesso"
          : "Alteração rejeitada"
      )
      setActionDialogOpen(false)
      setSelectedChange(null)
      setObservacoes("")
      fetchChanges()
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar alteração")
    } finally {
      setIsProcessing(false)
    }
  }

  const openActionDialog = (change: PendingChange, type: "aprovar" | "rejeitar") => {
    setSelectedChange(change)
    setActionType(type)
    setObservacoes("")
    setActionDialogOpen(true)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })

  if (isLoading && changes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="rejeitado">Rejeitado</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {total} pedido{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {changes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-3" />
            <p className="text-muted-foreground">
              {estadoFilter === "pendente"
                ? "Nenhum pedido pendente"
                : "Nenhuma alteração encontrada"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {changes.map((change) => (
            <Card key={change.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={ESTADO_COLORS[change.estado] || ""} variant="outline">
                        {change.estado === "pendente" && <Clock className="h-3 w-3 mr-1" />}
                        {change.estado === "aprovado" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {change.estado === "rejeitado" && <XCircle className="h-3 w-3 mr-1" />}
                        {ESTADO_LABELS[change.estado] || change.estado}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {CAMPO_LABELS[change.campo] || change.campo}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {change.aldeia.nome}
                      </span>
                    </div>

                    {/* Change details */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">De:</span>
                      <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                        {change.valorAntes || "(vazio)"}
                      </code>
                      <span className="text-muted-foreground">→</span>
                      <code className="px-1.5 py-0.5 bg-green-500/10 rounded text-xs font-mono text-green-600">
                        {change.valorDepois}
                      </code>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Solicitado por {change.requestedBy.nome}
                      </span>
                      <span>{formatDate(change.createdAt)}</span>
                      {change.decidedBy && (
                        <span className="flex items-center gap-1">
                          {change.estado === "aprovado" ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          {change.estado === "aprovado" ? "Aprovado" : "Rejeitado"} por{" "}
                          {change.decidedBy.nome}
                        </span>
                      )}
                      {change.observacoes && (
                        <span className="italic">"{change.observacoes}"</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {change.estado === "pendente" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => openActionDialog(change, "aprovar")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => openActionDialog(change, "rejeitar")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} total={total} limit={20} onPageChange={setPage} />

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "aprovar" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {actionType === "aprovar" ? "Aprovar Alteração" : "Rejeitar Alteração"}
            </DialogTitle>
          </DialogHeader>

          {selectedChange && (
            <div className="space-y-3">
              <Card className="bg-muted/50">
                <CardContent className="p-3 space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Aldeia:</span>{" "}
                    <strong>{selectedChange.aldeia.nome}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Campo:</span>{" "}
                    {CAMPO_LABELS[selectedChange.campo] || selectedChange.campo}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">De:</span>
                    <code className="px-1.5 py-0.5 bg-background rounded text-xs font-mono">
                      {selectedChange.valorAntes || "(vazio)"}
                    </code>
                    <span className="text-muted-foreground">→</span>
                    <code className="px-1.5 py-0.5 bg-green-500/10 rounded text-xs font-mono text-green-600">
                      {selectedChange.valorDepois}
                    </code>
                  </div>
                  <p>
                    <span className="text-muted-foreground">Solicitado por:</span>{" "}
                    {selectedChange.requestedBy.nome} ({selectedChange.requestedBy.email})
                  </p>
                </CardContent>
              </Card>

              {actionType === "rejeitar" && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Motivo da rejeição (opcional)</label>
                  <Textarea
                    placeholder="Indique o motivo..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {actionType === "aprovar" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-600">
                    Ao aprovar, o novo valor será aplicado imediatamente na aldeia. Esta ação pode ser desfeita
                    editando o campo novamente.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              variant={actionType === "aprovar" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === "aprovar" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
