"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Download, Search, Ticket } from "lucide-react"
import { toast } from "sonner"
import { generateCSV, downloadCSV } from "@/lib/export-utils"

interface ParticipacaoRow {
  id: string
  valorPago: number
  metodoPagamento: string
  estadoPagamento: string
  ganhador: boolean
  premioEntregue: boolean
  createdAt: string
  nomeCliente: string | null
  emailCliente: string | null
  telefoneCliente: string | null
  jogo: { nome: string; tipo: string }
}

interface AldeiaParticipacoesProps {
  aldeiaId: string
}

export function AldeiaParticipacoes({ aldeiaId }: AldeiaParticipacoesProps) {
  const [items, setItems] = useState<ParticipacaoRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [ganhador, setGanhador] = useState("all")
  const limit = 50

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        aldeiaId,
        limit: String(limit),
        page: String(page),
      })
      if (ganhador === "ganhadores") params.set("ganhador", "true")
      const res = await fetch(`/api/participacoes?${params.toString()}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setItems(data.data || [])
      setTotal(data.pagination?.total ?? 0)
    } catch {
      toast.error("Erro ao carregar participações")
    } finally {
      setLoading(false)
    }
  }, [aldeiaId, page, ganhador])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredItems = search.trim()
    ? items.filter(i =>
        (i.nomeCliente || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.emailCliente || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.telefoneCliente || "").toLowerCase().includes(search.toLowerCase())
      )
    : items

  const handleExportCSV = () => {
    const csv = generateCSV(
      ["Data", "Jogo", "Cliente", "Email", "Telefone", "Valor (€)", "Método", "Estado", "Ganhador", "Prémio Entregue"],
      filteredItems.map(i => [
        new Date(i.createdAt).toLocaleDateString("pt-PT"),
        i.jogo?.nome || "",
        i.nomeCliente || "",
        i.emailCliente || "",
        i.telefoneCliente || "",
        i.valorPago.toFixed(2),
        i.metodoPagamento,
        i.estadoPagamento,
        i.ganhador ? "Sim" : "Não",
        i.premioEntregue ? "Sim" : "Não",
      ]),
    )
    downloadCSV(csv, `participacoes-aldeia-${aldeiaId.slice(0, 8)}.csv`)
    toast.success("CSV exportado")
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="text-base">Participações</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{total} registo(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={filteredItems.length === 0}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procurar por nome, email ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={ganhador}
            onChange={e => { setGanhador(e.target.value); setPage(1) }}
            className="h-10 rounded-lg border bg-surface-container-low px-3 text-sm"
          >
            <option value="all">Todos</option>
            <option value="ganhadores">Ganhadores</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhuma participação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Jogo</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Prémio</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.map(i => (
                  <tr key={i.id} className="hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap">{new Date(i.createdAt).toLocaleDateString("pt-PT")}</td>
                    <td className="p-3">{i.jogo?.nome || "—"}</td>
                    <td className="p-3">
                      <p>{i.nomeCliente || "—"}</p>
                      {(i.emailCliente || i.telefoneCliente) && (
                        <p className="text-xs text-muted-foreground">{i.emailCliente || i.telefoneCliente}</p>
                      )}
                    </td>
                    <td className="p-3 font-medium">{i.valorPago.toFixed(2)}€</td>
                    <td className="p-3 capitalize">{i.metodoPagamento}</td>
                    <td className="p-3 capitalize">{i.estadoPagamento}</td>
                    <td className="p-3">
                      {i.ganhador ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {i.premioEntregue ? "Entregue" : "Pendente"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
