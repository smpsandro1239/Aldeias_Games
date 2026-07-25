"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { LayoutHeader } from "@/components/layout-header"
import { BottomNav } from "@/components/bottom-nav"
import { LoaderScreen } from "@/components/loader-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { CreateEventoModal } from "@/components/modals/create-evento-modal"
import { CreateJogoModal } from "@/components/modals/create-jogo-modal"
import type { JogoData } from "@/components/modals/create-jogo-modal"
import {
  ArrowLeft, Users, Calendar, Settings, Gamepad2,
  MapPin, Loader2, CheckCircle2, XCircle,
  UserPlus, Trash2, Crown, ChevronDown, ChevronRight, Edit, Eye, Plus, PartyPopper,
  Power, PowerOff
} from "lucide-react"
import { toast } from "sonner"
import { apiRequest } from "@/lib/api-client"

interface AldeiaData {
  id: string
  nome: string
  slug: string
  descricao: string | null
  tipoOrganizacao: string
  verificado: boolean
  ativo: boolean
  logoUrl: string | null
  bannerUrl: string | null
  telefone: string | null
  email: string | null
  morada: string | null
  codigoPostal: string | null
  localidade: string | null
  responsavel: string | null
  iban: string | null
  nomeTitularConta: string | null
  nomeEscola: string | null
  codigoEscola: string | null
  nivelEnsino: string | null
  autorizacaoCM: boolean
  numeroAlvara: string | null
  documentosVerificados: boolean
  metodosPagamentoAceites: string | null
  nivel: number
  pontos: number
  createdAt: string
  userAldeiaRoles: Array<{
    id: string
    userId: string
    role: { name: string }
    user: { id: string; nome: string; role: string }
  }>
  admins: Array<{ id: string; nome: string }>
  vendedores: Array<{ id: string; nome: string }>
  _count: { userAldeiaRoles: number; eventos: number; jogos: number; premios: number }
  eventos?: Array<{
    id: string
    nome: string
    dataInicio: string
    dataFim: string | null
    estado: string
    jogos: Array<{
      id: string
      nome: string
      tipo: string
      preco: number
      ativo: boolean
      _count: { participacoes: number }
    }>
  }>
}

const ALL_ROLES = [
  { value: "MEMBRO", label: "Utilizador", color: "bg-secondary text-secondary-foreground" },
  { value: "COLABORADOR", label: "Vendedor", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { value: "MODERADOR", label: "Admin Aldeia", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "ALDEIA_ADMIN", label: "Super Admin", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
]

const GAME_TYPES = [
  { value: "rifa", label: "Rifa", icon: "🎫", defaultPreco: 2 },
  { value: "raspadinha", label: "Raspadinha", icon: "🎰", defaultPreco: 3 },
  { value: "euromilhoes", label: "Euromilhões", icon: "⭐", defaultPreco: 3 },
  { value: "poio_da_vaca", label: "Poio da Vaca", icon: "🐄", defaultPreco: 2 },
]

export default function AldeiaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const aldeiaId = params.aldeiaId as string

  const [aldeia, setAldeia] = useState<AldeiaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<AldeiaData>>({})
  const [saving, setSaving] = useState(false)

  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("MEMBRO")
  const [addingMember, setAddingMember] = useState(false)

  const [expandedEventos, setExpandedEventos] = useState<Set<string>>(new Set())

  const [pendingChanges, setPendingChanges] = useState<any[]>([])
  const [loadingPending, setLoadingPending] = useState(false)

  const [showCreateEvento, setShowCreateEvento] = useState(false)
  const [creatingEvento, setCreatingEvento] = useState(false)

  const [showAddJogo, setShowAddJogo] = useState(false)
  const [addJogoEventoId, setAddJogoEventoId] = useState<string | null>(null)

  const isSuperAdmin = user?.role === "super_admin"
  const isAdmin = isSuperAdmin || aldeia?.admins.some(a => a.id === user?.id)

  const fetchAldeia = useCallback(async () => {
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}`)
      if (!res.ok) {
        setAldeia(null)
        return
      }
      const data = await res.json()
      setAldeia(data)
      setEditForm(data)
      if (isAdmin) fetchPendingChanges()
    } catch (err) {
      console.error("Erro ao buscar aldeia:", err)
      toast.error("Erro ao carregar dados da aldeia")
    } finally {
      setLoading(false)
    }
  }, [aldeiaId])

  const fetchPendingChanges = async () => {
    setLoadingPending(true)
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}/pending-changes`)
      if (res.ok) {
        const data = await res.json()
        setPendingChanges(data)
      }
    } catch {}
    setLoadingPending(false)
  }

  const decidePendingChange = async (changeId: string, acao: 'aprovar' | 'rejeitar') => {
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}/pending-changes/${changeId}`, {
        method: "POST",
        body: JSON.stringify({ acao }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro")
      }
      toast.success(acao === "aprovar" ? "Alteração aprovada e aplicada" : "Alteração rejeitada")
      fetchPendingChanges()
      fetchAldeia()
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar")
    }
  }

  useEffect(() => {
    fetchAldeia()
  }, [fetchAldeia])

  const toggleVerificado = async (verificado: boolean) => {
    if (!isSuperAdmin) return
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}`, {
        method: "PATCH",
        body: JSON.stringify({ verificado }),
      })
      if (!res.ok) throw new Error()
      setAldeia(prev => prev ? { ...prev, verificado } : prev)
      toast.success(verificado ? "Aldeia verificada" : "Verificação removida")
    } catch {
      toast.error("Erro ao alterar verificação")
    }
  }

  const toggleAtivo = async (ativo: boolean) => {
    if (!isAdmin) return
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo }),
      })
      if (!res.ok) throw new Error()
      setAldeia(prev => prev ? { ...prev, ativo } : prev)
      toast.success(ativo ? "Aldeia ativada" : "Aldeia desativada")
    } catch {
      toast.error("Erro ao alterar estado")
    }
  }

  const saveEdits = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      const fields = [
        'nome', 'descricao', 'telefone', 'email', 'morada', 'codigoPostal', 'localidade',
        'responsavel', 'tipoOrganizacao', 'autorizacaoCM', 'numeroAlvara', 'documentosVerificados',
        'logoUrl', 'bannerUrl'
      ]
      for (const field of fields) {
        if ((editForm as any)[field] !== (aldeia as any)?.[field]) {
          payload[field] = (editForm as any)[field]
        }
      }
      // IBAN and titular are sensitive — only include if changed
      if (editForm.iban !== aldeia?.iban) payload.iban = editForm.iban
      if (editForm.nomeTitularConta !== aldeia?.nomeTitularConta) payload.nomeTitularConta = editForm.nomeTitularConta
      // School fields
      if (editForm.nomeEscola !== aldeia?.nomeEscola) payload.nomeEscola = editForm.nomeEscola
      if (editForm.codigoEscola !== aldeia?.codigoEscola) payload.codigoEscola = editForm.codigoEscola
      if (editForm.nivelEnsino !== aldeia?.nivelEnsino) payload.nivelEnsino = editForm.nivelEnsino

      if (Object.keys(payload).length === 0) {
        toast.info("Nenhuma alteração detected")
        setEditMode(false)
        return
      }

      const res = await apiRequest(`/api/aldeias/${aldeiaId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro")
      }
      const result = await res.json().catch(() => ({}))
      if (result.pendingSensitiveChanges) {
        toast.info("Alterações sensíveis ficaram pendentes de aprovação de outro administrador.")
      } else {
        toast.success("Aldeia atualizada com sucesso")
      }
      setEditMode(false)
      fetchAldeia()
    } catch (e: any) {
      toast.error(e.message || "Erro ao guardar alterações")
    } finally {
      setSaving(false)
    }
  }

  const addMember = async () => {
    if (!newMemberEmail.trim()) return
    setAddingMember(true)
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}/membros`, {
        method: "POST",
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro")
      }
      toast.success("Membro adicionado com sucesso")
      setShowAddMember(false)
      setNewMemberEmail("")
      setNewMemberRole("MEMBRO")
      fetchAldeia()
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar membro")
    } finally {
      setAddingMember(false)
    }
  }

  const removeMember = async (userId: string, nome: string) => {
    if (!confirm(`Remover ${nome} desta aldeia?`)) return
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}/membros/${userId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      toast.success(`${nome} removido da aldeia`)
      fetchAldeia()
    } catch {
      toast.error("Erro ao remover membro")
    }
  }

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}/membros/${userId}/role`, {
        method: "POST",
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error()
      toast.success("Função atualizada")
      fetchAldeia()
    } catch {
      toast.error("Erro ao alterar função")
    }
  }

  const handleCreateEvento = async (data: any) => {
    setCreatingEvento(true)
    try {
      const res = await apiRequest("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, aldeiaId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro")
      }
      const evento = await res.json()
      const eventoId = evento.data?.id || evento.id
      const jogosSelecionados = data.jogosSelecionados || []
      toast.success("Evento criado com sucesso!")
      if (jogosSelecionados.length > 0 && eventoId) {
        setShowCreateEvento(false)
        fetchAldeia()
        return { eventoId, jogosSelecionados }
      }
      setShowCreateEvento(false)
      fetchAldeia()
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar evento")
    } finally {
      setCreatingEvento(false)
    }
  }

  const openAddJogo = (eventoId: string, _eventoNome: string) => {
    setAddJogoEventoId(eventoId)
    setShowAddJogo(true)
  }

  const handleSaveJogo = async (data: JogoData) => {
    if (!addJogoEventoId) return
    try {
      const res = await apiRequest("/api/jogos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          eventoId: addJogoEventoId,
          aldeiaId,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.details?.map((d: any) => d.message).join(", ") || "Erro ao criar jogo")
      }
      toast.success("Jogo criado com sucesso!")
      setShowAddJogo(false)
      fetchAldeia()
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar jogo")
      throw e
    }
  }

  const toggleEvento = (eventoId: string) => {
    setExpandedEventos(prev => {
      const next = new Set(prev)
      if (next.has(eventoId)) next.delete(eventoId)
      else next.add(eventoId)
      return next
    })
  }

  const toggleEventoEstado = async (eventoId: string, currentState: string) => {
    if (!isAdmin) return
    const newState = currentState === "ativo" ? "pausado" : "ativo"
    try {
      const res = await apiRequest(`/api/eventos/${eventoId}`, {
        method: "PATCH",
        body: JSON.stringify({ estado: newState }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro")
      }
      setAldeia(prev => {
        if (!prev) return prev
        return {
          ...prev,
          eventos: prev.eventos?.map(e =>
            e.id === eventoId ? { ...e, estado: newState } : e
          )
        }
      })
      toast.success(newState === "ativo" ? "Evento ativado" : "Evento pausado")
    } catch (e: any) {
      toast.error(e.message || "Erro ao alterar estado do evento")
    }
  }

  const getRoleBadge = (roleName: string) => {
    const role = ALL_ROLES.find(r => r.value === roleName)
    if (role) return <Badge className={role.color}>{role.label}</Badge>
    return <Badge variant="secondary">{roleName}</Badge>
  }

  const getGameIcon = (tipo: string) => {
    const game = GAME_TYPES.find(g => g.value === tipo)
    return game?.icon || "🎮"
  }

  if (loading) return <LoaderScreen message="A carregar aldeia..." />
  if (!aldeia) return (
    <LayoutHeader>
      <div className="pt-24 pb-24 px-4 text-center">
        <p className="text-muted-foreground">Aldeia não encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/aldeias")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
      <BottomNav />
    </LayoutHeader>
  )

  return (
    <LayoutHeader>
      <div className="pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => router.push("/aldeias")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar às Aldeias
        </Button>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {aldeia.logoUrl ? (
              <img src={aldeia.logoUrl} alt={aldeia.nome} className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <div className="h-14 w-14 bg-primary/10 flex items-center justify-center rounded-xl">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{aldeia.nome}</h1>
              <div className="flex items-center gap-2 mt-1">
                {aldeia.verificado ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Verificada
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-orange-600">
                    <XCircle className="h-3 w-3 mr-1" /> Não Verificada
                  </Badge>
                )}
                {!aldeia.ativo && <Badge variant="destructive">Inativa</Badge>}
              </div>
            </div>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowCreateEvento(true)}>
              <Plus className="h-4 w-4 mr-2" /> Novo Evento
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview"><Eye className="h-4 w-4 mr-2" /> Geral</TabsTrigger>
            <TabsTrigger value="members"><Users className="h-4 w-4 mr-2" /> Membros</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-2" /> Eventos</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" /> Config</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card
                className="border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => setActiveTab("members")}
              >
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold">{aldeia._count.userAldeiaRoles}</p>
                  <p className="text-sm text-muted-foreground">Membros</p>
                </CardContent>
              </Card>
              <Card
                className="border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => setActiveTab("events")}
              >
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold">{aldeia._count.eventos}</p>
                  <p className="text-sm text-muted-foreground">Eventos</p>
                </CardContent>
              </Card>
              <Card
                className="border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => setActiveTab("events")}
              >
                <CardContent className="pt-6 text-center">
                  <Gamepad2 className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold">{aldeia._count.jogos}</p>
                  <p className="text-sm text-muted-foreground">Jogos</p>
                </CardContent>
              </Card>
              <Card
                className="border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all"
                onClick={() => router.push("/premios")}
              >
                <CardContent className="pt-6 text-center">
                  <PartyPopper className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-3xl font-bold">{aldeia._count.premios}</p>
                  <p className="text-sm text-muted-foreground">Prémios</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {aldeia.descricao && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Descrição</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground">{aldeia.descricao}</p></CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-base">Admins</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {aldeia.admins.map(admin => (
                      <Badge key={admin.id} className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <Crown className="h-3 w-3 mr-1" /> {admin.nome}
                      </Badge>
                    ))}
                    {aldeia.admins.length === 0 && <p className="text-sm text-muted-foreground">Sem admins atribuídos</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {isSuperAdmin && (
              <Card className="mt-6">
                <CardHeader><CardTitle className="text-base">Administração</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Verificar Aldeia</p>
                      <p className="text-sm text-muted-foreground">Aldeias verificadas são visíveis publicamente</p>
                    </div>
                    <Switch checked={aldeia.verificado} onCheckedChange={toggleVerificado} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Aldeia Ativa</p>
                      <p className="text-sm text-muted-foreground">Aldeias inativas ficam indisponíveis</p>
                    </div>
                    <Switch checked={aldeia.ativo} onCheckedChange={toggleAtivo} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Membros da Aldeia</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{aldeia.userAldeiaRoles.length} membro(s)</p>
                </div>
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowAddMember(true)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aldeia.userAldeiaRoles.map(membro => (
                    <div key={membro.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-medium text-sm text-primary">{membro.user.nome.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{membro.user.nome}</p>
                          <p className="text-xs text-muted-foreground">{membro.user.role === "aldeia_admin" ? "Admin da Aldeia" : membro.user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(membro.role.name)}
                        {isAdmin && membro.userId !== user?.id && (
                          <>
                            <Select value={membro.role.name} onValueChange={(val) => changeRole(membro.userId, val)}>
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_ROLES.map(r => (
                                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeMember(membro.userId, membro.user.nome)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {aldeia.userAldeiaRoles.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Nenhum membro encontrado</p>
                      {isAdmin && (
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddMember(true)}>
                          <UserPlus className="h-4 w-4 mr-2" /> Adicionar primeiro membro
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <div className="space-y-4">
              {isAdmin && (
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => setShowCreateEvento(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Criar Evento
                  </Button>
                </div>
              )}
              {aldeia.eventos && aldeia.eventos.length > 0 ? (
                aldeia.eventos.map(evento => {
                  const isExpanded = expandedEventos.has(evento.id)
                  return (
                    <Card key={evento.id} className="overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleEvento(evento.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{evento.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(evento.dataInicio).toLocaleDateString("pt-PT")}
                              {evento.dataFim ? ` — ${new Date(evento.dataFim).toLocaleDateString("pt-PT")}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-2">
                            {evento.estado === "ativo" ? (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">Ativo</Badge>
                            ) : evento.estado === "pausado" ? (
                              <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">Pausado</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs capitalize">{evento.estado}</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{evento.jogos.length} jogo(s)</Badge>
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={evento.estado === "ativo" ? "Pausar evento" : "Ativar evento"}
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleEventoEstado(evento.id, evento.estado)
                              }}
                            >
                              {evento.estado === "ativo" ? (
                                <PowerOff className="h-3.5 w-3.5 text-yellow-500" />
                              ) : (
                                <Power className="h-3.5 w-3.5 text-green-500" />
                              )}
                            </Button>
                          )}
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t px-4 pb-4 pt-3">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-muted-foreground">Jogos</p>
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openAddJogo(evento.id, evento.nome)
                                }}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Adicionar Jogo
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {evento.jogos.map(jogo => (
                              <div
                                key={jogo.id}
                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => router.push(`/jogos/${jogo.tipo === "poio_da_vaca" ? "poio-da-vaca" : jogo.tipo === "raspadinha" ? "raspadinha-premium" : jogo.tipo}?jogoId=${jogo.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-lg">{getGameIcon(jogo.tipo)}</span>
                                  <div>
                                    <p className="font-medium text-sm">{jogo.nome}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {jogo.tipo.replace(/_/g, " ")} · €{jogo.preco.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{jogo._count.participacoes} vendas</Badge>
                                  {jogo.ativo ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            ))}
                            {evento.jogos.length === 0 && (
                              <div className="text-center py-8">
                                <Gamepad2 className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground">Sem jogos neste evento</p>
                                {isAdmin && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="mt-1"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openAddJogo(evento.id, evento.nome)
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Adicionar jogo
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Calendar className="h-14 w-14 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-1">Nenhum evento encontrado</p>
                    <p className="text-sm text-muted-foreground/70 mb-4">Crie o primeiro evento para esta aldeia</p>
                    {isAdmin && (
                      <Button size="sm" onClick={() => setShowCreateEvento(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Criar Evento
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="settings">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Editar Aldeia</CardTitle>
                  {!editMode ? (
                    <Button variant="outline" size="sm" onClick={() => { setEditMode(true); setEditForm(aldeia) }}>
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Cancelar</Button>
                      <Button size="sm" onClick={saveEdits} disabled={saving}>
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Guardar
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Informações Básicas */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Informações Básicas</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={editForm.nome || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label>Tipo de Organização</Label>
                        <Select
                          value={editForm.tipoOrganizacao || "aldeia"}
                          onValueChange={val => setEditForm(prev => ({ ...prev, tipoOrganizacao: val }))}
                          disabled={!editMode}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aldeia">Aldeia</SelectItem>
                            <SelectItem value="escola">Escola</SelectItem>
                            <SelectItem value="associacao_pais">Associação de Pais</SelectItem>
                            <SelectItem value="clube">Clube</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Descrição</Label>
                      <Textarea
                        value={editForm.descricao || ""}
                        onChange={e => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
                        disabled={!editMode}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Contactos */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Contactos</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Telefone</Label>
                        <Input
                          value={editForm.telefone || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, telefone: e.target.value }))}
                          disabled={!editMode}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={editForm.email || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <Label>Morada</Label>
                      <Input
                        value={editForm.morada || ""}
                        onChange={e => setEditForm(prev => ({ ...prev, morada: e.target.value }))}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 mt-3">
                      <div>
                        <Label>Código Postal</Label>
                        <Input
                          value={editForm.codigoPostal || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, codigoPostal: e.target.value }))}
                          disabled={!editMode}
                          placeholder="0000-000"
                        />
                      </div>
                      <div>
                        <Label>Localidade</Label>
                        <Input
                          value={editForm.localidade || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, localidade: e.target.value }))}
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Responsável */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Responsável</p>
                    <div>
                      <Label>Nome do Responsável</Label>
                      <Input
                        value={editForm.responsavel || ""}
                        onChange={e => setEditForm(prev => ({ ...prev, responsavel: e.target.value }))}
                        disabled={!editMode}
                      />
                    </div>
                  </div>

                  {/* Dados Bancários — SENSÍVEIS */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      Dados Bancários
                      {!isSuperAdmin && <span className="text-xs text-orange-500 ml-2">(requer aprovação de outro admin)</span>}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>IBAN</Label>
                        <Input
                          value={editForm.iban || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, iban: e.target.value }))}
                          disabled={!editMode}
                          placeholder="PT50 0000 0000 0000 0000 0000 0"
                        />
                      </div>
                      <div>
                        <Label>Titular da Conta</Label>
                        <Input
                          value={editForm.nomeTitularConta || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, nomeTitularConta: e.target.value }))}
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Escola (condicional) */}
                  {editForm.tipoOrganizacao === "escola" && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">Dados da Escola</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Nome da Escola</Label>
                          <Input
                            value={editForm.nomeEscola || ""}
                            onChange={e => setEditForm(prev => ({ ...prev, nomeEscola: e.target.value }))}
                            disabled={!editMode}
                          />
                        </div>
                        <div>
                          <Label>Código da Escola</Label>
                          <Input
                            value={editForm.codigoEscola || ""}
                            onChange={e => setEditForm(prev => ({ ...prev, codigoEscola: e.target.value }))}
                            disabled={!editMode}
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Label>Nível de Ensino</Label>
                        <Select
                          value={editForm.nivelEnsino || ""}
                          onValueChange={val => setEditForm(prev => ({ ...prev, nivelEnsino: val }))}
                          disabled={!editMode}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pre_escolar">Pré-Escolar</SelectItem>
                            <SelectItem value="primeiro_ciclo">1.º Ciclo</SelectItem>
                            <SelectItem value="segundo_ciclo">2.º Ciclo</SelectItem>
                            <SelectItem value="terceiro_ciclo">3.º Ciclo</SelectItem>
                            <SelectItem value="secundario">Secundário</SelectItem>
                            <SelectItem value="superior">Superior</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Conformidade Legal */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Conformidade Legal</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Nº Alvará</Label>
                        <Input
                          value={editForm.numeroAlvara || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, numeroAlvara: e.target.value }))}
                          disabled={!editMode}
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <Switch
                          checked={editForm.autorizacaoCM || false}
                          onCheckedChange={val => setEditForm(prev => ({ ...prev, autorizacaoCM: val }))}
                          disabled={!editMode}
                        />
                        <div>
                          <Label>Autorização Câmara Municipal</Label>
                          <p className="text-xs text-muted-foreground">Autorização obtida</p>
                        </div>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex items-center gap-3 mt-3">
                        <Switch
                          checked={editForm.documentosVerificados || false}
                          onCheckedChange={val => setEditForm(prev => ({ ...prev, documentosVerificados: val }))}
                          disabled={!editMode}
                        />
                        <div>
                          <Label>Documentos Verificados</Label>
                          <p className="text-xs text-muted-foreground">Documentação validada pela equipa</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Imagens */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Imagens</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>URL do Logo</Label>
                        <Input
                          value={editForm.logoUrl || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                          disabled={!editMode}
                          placeholder="https://..."
                        />
                        {editForm.logoUrl && (
                          <img src={editForm.logoUrl} alt="Logo" className="mt-2 h-12 w-12 rounded-lg object-cover" />
                        )}
                      </div>
                      <div>
                        <Label>URL do Banner</Label>
                        <Input
                          value={(editForm as any).bannerUrl || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, bannerUrl: e.target.value }))}
                          disabled={!editMode}
                          placeholder="https://..."
                        />
                        {(editForm as any).bannerUrl && (
                          <img src={(editForm as any).bannerUrl} alt="Banner" className="mt-2 h-12 w-full rounded-lg object-cover" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alterações Pendentes */}
                  {pendingChanges.filter(c => c.estado === 'pendente').length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-orange-600 mb-3">
                        Alterações Pendentes de Aprovação ({pendingChanges.filter(c => c.estado === 'pendente').length})
                      </p>
                      <div className="space-y-2">
                        {pendingChanges.filter(c => c.estado === 'pendente').map(change => (
                          <div key={change.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10">
                            <div>
                              <p className="text-sm font-medium">
                                {change.campo === 'iban' ? 'IBAN' : 'Titular da Conta'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {change.valorAntes ? `De: ${change.valorAntes.slice(0, 10)}...` : 'Vazio'} → Para: {change.valorDepois?.slice(0, 10)}...
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Solicitado por: {change.requestedBy?.nome} em {new Date(change.createdAt).toLocaleDateString("pt-PT")}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {isAdmin && change.requestedById !== user?.id && (
                                <>
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => decidePendingChange(change.id, 'aprovar')}>
                                    Aprovar
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => decidePendingChange(change.id, 'rejeitar')}>
                                    Rejeitar
                                  </Button>
                                </>
                              )}
                              {change.requestedById === user?.id && (
                                <Badge variant="secondary" className="text-xs">Aguardando aprovação</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email do Utilizador</Label>
              <Input
                value={newMemberEmail}
                onChange={e => setNewMemberEmail(e.target.value)}
                placeholder="email@exemplo.com"
                onKeyDown={e => e.key === "Enter" && addMember()}
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancelar</Button>
            <Button onClick={addMember} disabled={addingMember || !newMemberEmail.trim()}>
              {addingMember && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateJogoModal
        open={showAddJogo}
        onOpenChange={setShowAddJogo}
        onSubmit={handleSaveJogo}
        eventoId={addJogoEventoId || undefined}
      />

      <CreateEventoModal
        open={showCreateEvento}
        onOpenChange={setShowCreateEvento}
        onSubmit={handleCreateEvento}
        aldeiaId={aldeiaId}
        onSubmitJogo={handleSaveJogo}
      />

      <BottomNav />
    </LayoutHeader>
  )
}
