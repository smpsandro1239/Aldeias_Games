"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useCallback, useMemo } from "react"
import { AldeiaModal } from "@/components/modals/aldeia-modal"
import { LayoutHeader } from "@/components/layout-header"
import { BottomNav } from "@/components/bottom-nav"
import { RoleGuard } from "@/components/auth/RoleGuard"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Users, Building2, ChevronRight, Loader2, CheckCircle2, Calendar, Gamepad2,
  MapPin, Search, Plus, Download, Landmark, ClipboardCheck, Pencil,
  Euro, Ticket, Filter,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AldeiaCreationWizard } from "@/components/modals/aldeia-creation-wizard"
import { generateCSV, downloadCSV } from "@/lib/export-utils"

interface Aldeia {
  id: string
  nome: string
  slug: string
  descricao?: string
  tipoOrganizacao: string
  verificado: boolean
  ativo: boolean
  telefone?: string
  email?: string
  localidade?: string
  membrosAtivos?: number
  totalEventos?: number
  totalJogos?: number
  totalPremios?: number
  totalParticipacoes?: number
  totalAngariado?: number
  bannerUrl?: string | null
}

const TIPO_LABEL: Record<string, string> = {
  aldeia: "Aldeia",
  escola: "Escola",
  associacao_pais: "Assoc. Pais",
  clube: "Clube",
}

const TIPO_COLOR: Record<string, string> = {
  aldeia: "bg-blue-500/15 text-blue-500 border-blue-500/25",
  escola: "bg-purple-500/15 text-purple-500 border-purple-500/25",
  associacao_pais: "bg-green-500/15 text-green-500 border-green-500/25",
  clube: "bg-orange-500/15 text-orange-500 border-orange-500/25",
}

const TIPO_ACCENT: Record<string, string> = {
  aldeia: "from-blue-500/60 to-blue-500/10",
  escola: "from-purple-500/60 to-purple-500/10",
  associacao_pais: "from-green-500/60 to-green-500/10",
  clube: "from-orange-500/60 to-orange-500/10",
}

const TIPO_ICON: Record<string, typeof Building2> = {
  aldeia: MapPin,
  escola: Building2,
  associacao_pais: Users,
  clube: Building2,
}

export default function AldeiasPage() {
  const [search, setSearch] = useState("")
  const [tipoOrganizacao, setTipoOrganizacao] = useState("all")
  const [estadoVerificado, setEstadoVerificado] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingAldeia, setEditingAldeia] = useState<Aldeia | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aldeias, setAldeias] = useState<Aldeia[]>([])
  const [totalAldeias, setTotalAldeias] = useState(0)
  const [isLoadingAldeias, setIsLoadingAldeias] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [newAldeiaId, setNewAldeiaId] = useState("")
  const [newAldeiaNome, setNewAldeiaNome] = useState("")
  const [bannerErro, setBannerErro] = useState<Set<string>>(new Set())
  const router = useRouter()

  const fetchAldeias = useCallback(async () => {
    setIsLoadingAldeias(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (tipoOrganizacao && tipoOrganizacao !== "all") params.set("tipoOrganizacao", tipoOrganizacao)
      params.set("limit", "50")

      const res = await fetch(`/api/aldeias?${params.toString()}`)
      if (!res.ok) throw new Error("Erro ao carregar aldeias")
      const data = await res.json()
      const items: Aldeia[] = data.aldeias || []
      const filtered = estadoVerificado === "all"
        ? items
        : items.filter((a) => (estadoVerificado === "verificada" ? a.verificado : !a.verificado))
      setAldeias(filtered)
      setTotalAldeias(data.pagination?.total ?? filtered.length)
    } catch (err) {
      console.error(err)
      toast.error("Erro ao carregar aldeias")
    } finally {
      setIsLoadingAldeias(false)
    }
  }, [search, tipoOrganizacao, estadoVerificado])

  useEffect(() => {
    fetchAldeias()
  }, [fetchAldeias])

  const handleSubmitAldeia = async (data: {
    id?: string
    nome: string
    tipoOrganizacao: string
    descricao?: string
    telefone?: string
    email?: string
  }) => {
    setIsLoading(true)
    try {
      const isEditing = !!data.id
      const url = isEditing ? `/api/aldeias/${data.id}` : "/api/aldeias"
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing
          ? {
              nome: data.nome,
              descricao: data.descricao,
              tipoOrganizacao: data.tipoOrganizacao,
              telefone: data.telefone,
              email: data.email,
            }
          : {
              nome: data.nome,
              descricao: data.descricao,
              logoUrl: "",
              tipoOrganizacao: data.tipoOrganizacao,
              telefone: data.telefone,
              email: data.email,
            }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erro ao guardar aldeia")
      }

      const aldeia = await response.json()
      toast.success(isEditing ? "Aldeia atualizada com sucesso!" : "Aldeia criada com sucesso!")
      setIsCreateModalOpen(false)
      setEditingAldeia(null)
      if (!isEditing) {
        const created = aldeia.id || aldeia.data?.id
        if (created) {
          setNewAldeiaId(created)
          setNewAldeiaNome(aldeia.nome || data.nome)
          setWizardOpen(true)
        }
      }
      fetchAldeias()
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar aldeia")
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (aldeias.length === 0) return
    const csv = generateCSV(
      ["Nome", "Tipo", "Estado", "Membros", "Eventos", "Jogos", "Participações", "Angariado (€)", "Email", "Telefone"],
      aldeias.map((a) => [
        a.nome,
        TIPO_LABEL[a.tipoOrganizacao] || a.tipoOrganizacao,
        a.verificado ? "Verificada" : "Pendente",
        a.membrosAtivos ?? 0,
        a.totalEventos ?? 0,
        a.totalJogos ?? 0,
        a.totalParticipacoes ?? 0,
        (a.totalAngariado ?? 0).toFixed(2),
        a.email || "",
        a.telefone || "",
      ]),
    )
    downloadCSV(csv, `aldeias-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success("CSV exportado")
  }

  const metrics = useMemo(() => {
    const sum = (f: (a: Aldeia) => number) => aldeias.reduce((acc, a) => acc + (f(a) || 0), 0)
    return {
      totalMembros: sum((a) => a.membrosAtivos ?? 0),
      totalEventos: sum((a) => a.totalEventos ?? 0),
      totalJogos: sum((a) => a.totalJogos ?? 0),
      totalParticipacoes: sum((a) => a.totalParticipacoes ?? 0),
      totalAngariado: sum((a) => a.totalAngariado ?? 0),
      pendentes: aldeias.filter((a) => !a.verificado).length,
    }
  }, [aldeias])

  const hasActiveFilters = search || tipoOrganizacao !== "all" || estadoVerificado !== "all"

  const clearFilters = () => {
    setSearch("")
    setTipoOrganizacao("all")
    setEstadoVerificado("all")
  }

  const statCards = [
    { label: "Organizações", value: totalAldeias, icon: Building2, accent: "text-blue-500 bg-blue-500/10" },
    { label: "Membros", value: metrics.totalMembros, icon: Users, accent: "text-green-500 bg-green-500/10" },
    { label: "Eventos", value: metrics.totalEventos, icon: Calendar, accent: "text-purple-500 bg-purple-500/10" },
    { label: "Jogos", value: metrics.totalJogos, icon: Gamepad2, accent: "text-orange-500 bg-orange-500/10" },
    { label: "Angariação", value: `${metrics.totalAngariado.toLocaleString("pt-PT", { maximumFractionDigits: 0 })}€`, icon: Euro, accent: "text-amber-500 bg-amber-500/10" },
  ]

  const quickActions = [
    { label: "Nova Aldeia", desc: "Criar organização", icon: Plus, onClick: () => { setEditingAldeia(null); setIsCreateModalOpen(true); }, accent: "from-blue-500/15 to-blue-500/5 text-blue-600 dark:text-blue-400", ring: "hover:border-blue-500/40" },
    { label: "Cofre Global", desc: "Ver saldos e depósitos", icon: Landmark, onClick: () => router.push("/superadmindashboard/cofre"), accent: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400", ring: "hover:border-amber-500/40" },
    { label: "Pedidos Pendentes", desc: "Aprovar alterações", icon: ClipboardCheck, onClick: () => router.push("/pending-changes"), accent: "from-green-500/15 to-green-500/5 text-green-600 dark:text-green-400", ring: "hover:border-green-500/40" },
    { label: "Exportar CSV", desc: "Descarregar lista", icon: Download, onClick: handleExportCSV, accent: "from-purple-500/15 to-purple-500/5 text-purple-600 dark:text-purple-400", ring: "hover:border-purple-500/40" },
  ]

  return (
    <RoleGuard allowedRoles={["super_admin"]} redirectPath="/superadmindashboard" panelName="Aldeias">
      <LayoutHeader>
        <div className="min-h-screen bg-background pb-24">
          <div className="container mx-auto px-4 max-w-6xl pt-6 space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 p-3 rounded-xl flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-serif text-2xl font-bold text-accent">Gestão de Aldeias</h1>
                    <p className="text-xs text-muted-foreground mt-1">
                      Organizações, escolas, associações e clubes — métricas e ações de gestão
                    </p>
                  </div>
                </div>
                <Button onClick={() => { setEditingAldeia(null); setIsCreateModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Criar Aldeia
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {quickActions.map((qa) => {
                const Icon = qa.icon
                return (
                  <button
                    key={qa.label}
                    onClick={qa.onClick}
                    className={`group relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-gradient-to-br ${qa.accent} p-4 text-left transition-all hover:shadow-lg ${qa.ring}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{qa.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{qa.desc}</p>
                      </div>
                      <div className="bg-background/70 dark:bg-background/40 p-2 rounded-xl transition-transform group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Global metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {statCards.map((s) => {
                const Icon = s.icon
                return (
                  <Card key={s.label} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${s.accent}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-black leading-tight truncate">{s.value}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Filters */}
            <Card className="bg-card border-outline-variant/10 overflow-hidden">
              <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 p-1.5 rounded-lg">
                    <Filter className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">Filtros</span>
                </div>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-muted-foreground hover:text-destructive" onClick={clearFilters}>
                    Limpar
                  </Button>
                )}
              </div>
              <CardContent className="p-4">
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar aldeias..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-full"
                    />
                  </div>
                  <Select value={tipoOrganizacao} onValueChange={setTipoOrganizacao}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="aldeia">Aldeia</SelectItem>
                      <SelectItem value="escola">Escola</SelectItem>
                      <SelectItem value="associacao_pais">Associação de Pais</SelectItem>
                      <SelectItem value="clube">Clube Desportivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={estadoVerificado} onValueChange={setEstadoVerificado}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="verificada">Verificadas</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {isLoadingAldeias ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : aldeias.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-14 text-center flex flex-col items-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Building2 className="h-8 w-8 text-primary/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {hasActiveFilters ? "Nenhuma organização encontrada" : "Ainda não existem organizações"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {hasActiveFilters
                      ? "Experimente remover alguns filtros."
                      : "Crie a primeira organização para começar a gerir aldeias, escolas e associações."}
                  </p>
                  {!hasActiveFilters && (
                    <Button size="sm" className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Nova Organização
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {aldeias.map((aldeia) => {
                  const Icon = TIPO_ICON[aldeia.tipoOrganizacao] || Building2
                  return (
                    <Card
                      key={aldeia.id}
                      className="group overflow-hidden h-full transition-all hover:shadow-lg hover:border-primary/50 flex flex-col cursor-pointer"
                      onClick={() => router.push(`/aldeia/${aldeia.id}`)}
                    >
                      {aldeia.bannerUrl && !bannerErro.has(aldeia.id) ? (
                        <div className="relative h-32 overflow-hidden">
                          <img
                            src={aldeia.bannerUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            onError={() => setBannerErro((prev) => new Set(prev).add(aldeia.id))}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="bg-black/40 backdrop-blur-sm text-white border-white/25 text-[10px] font-bold">
                              {TIPO_LABEL[aldeia.tipoOrganizacao] || aldeia.tipoOrganizacao}
                            </Badge>
                            {aldeia.verificado ? (
                              <Badge className="bg-green-500/80 text-white border-transparent text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Verificada
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-500/80 text-white border-transparent text-[10px]">
                                Pendente
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={`h-1 bg-gradient-to-r ${TIPO_ACCENT[aldeia.tipoOrganizacao] || "from-primary/60 to-primary/10"}`} />
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br p-0 flex items-center justify-center border ${TIPO_ACCENT[aldeia.tipoOrganizacao] || "from-primary/60 to-primary/10"}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-base font-semibold text-foreground truncate">{aldeia.nome}</CardTitle>
                              {aldeia.localidade && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" /> {aldeia.localidade}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] font-bold ${TIPO_COLOR[aldeia.tipoOrganizacao] || ""}`}>
                                  {TIPO_LABEL[aldeia.tipoOrganizacao] || aldeia.tipoOrganizacao}
                                </Badge>
                                {aldeia.verificado ? (
                                  <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25 text-[10px]">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Verificada
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600 dark:text-orange-400 text-[10px]">
                                    Pendente
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3 flex-1">
                        {aldeia.descricao && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{aldeia.descricao}</p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 bg-surface-container/60 rounded-lg px-2.5 py-1.5">
                            <Users className="h-3 w-3 flex-shrink-0" />
                            <span>{aldeia.membrosAtivos ?? 0} membros</span>
                          </div>
                          <div className="flex items-center gap-2 bg-surface-container/60 rounded-lg px-2.5 py-1.5">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span>{aldeia.totalEventos ?? 0} eventos</span>
                          </div>
                          <div className="flex items-center gap-2 bg-surface-container/60 rounded-lg px-2.5 py-1.5">
                            <Gamepad2 className="h-3 w-3 flex-shrink-0" />
                            <span>{aldeia.totalJogos ?? 0} jogos</span>
                          </div>
                          <div className="flex items-center gap-2 bg-surface-container/60 rounded-lg px-2.5 py-1.5">
                            <Ticket className="h-3 w-3 flex-shrink-0" />
                            <span>{aldeia.totalParticipacoes ?? 0} part.</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-1">
                          <div className="flex items-center gap-1.5">
                            <Euro className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-sm font-bold">
                              {(aldeia.totalAngariado ?? 0).toLocaleString("pt-PT", { maximumFractionDigits: 0 })}€
                            </span>
                            <span className="text-xs text-muted-foreground">angariados</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-muted-foreground hover:text-foreground"
                              onClick={(e) => { e.stopPropagation(); setEditingAldeia(aldeia); setIsCreateModalOpen(true); }}
                              title="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <AldeiaModal
            open={isCreateModalOpen}
            onOpenChange={(open) => {
              setIsCreateModalOpen(open)
              if (!open) setEditingAldeia(null)
            }}
            onSubmit={handleSubmitAldeia}
            initialData={editingAldeia ? {
              id: editingAldeia.id,
              nome: editingAldeia.nome,
              tipoOrganizacao: (editingAldeia.tipoOrganizacao as "aldeia" | "escola" | "associacao_pais" | "clube"),
              descricao: editingAldeia.descricao || "",
              telefone: editingAldeia.telefone || "",
              email: editingAldeia.email || "",
            } : undefined}
            loading={isLoading}
          />

          <AldeiaCreationWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            aldeiaId={newAldeiaId}
            aldeiaNome={newAldeiaNome}
          />
        </div>
        <BottomNav />
      </LayoutHeader>
    </RoleGuard>
  )
}
