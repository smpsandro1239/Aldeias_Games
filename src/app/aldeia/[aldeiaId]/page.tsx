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
import {
  ArrowLeft, Shield, ShieldCheck, Users, Calendar, Settings, Gamepad2,
  MapPin, Phone, Mail, CreditCard, Loader2, CheckCircle2, XCircle,
  UserPlus, Trash2, Crown, ChevronDown, ChevronRight, Edit, Eye, EyeOff
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
  iban: string | null
  nomeTitularConta: string | null
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
    ativo: boolean
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
    } catch (err) {
      console.error("Erro ao buscar aldeia:", err)
      toast.error("Erro ao carregar dados da aldeia")
    } finally {
      setLoading(false)
    }
  }, [aldeiaId])

  useEffect(() => {
    fetchAldeia()
  }, [fetchAldeia])

  const toggleVerificado = async (verificado: boolean) => {
    if (!isSuperAdmin) return
    try {
      await apiRequest(`/api/aldeias/${aldeiaId}`, {
        method: "PATCH",
        body: JSON.stringify({ verificado }),
      })
      setAldeia(prev => prev ? { ...prev, verificado } : prev)
      toast.success(verificado ? "Aldeia verificada" : "Verificação removida")
    } catch {
      toast.error("Erro ao alterar verificação")
    }
  }

  const toggleAtivo = async (ativo: boolean) => {
    if (!isAdmin) return
    try {
      await apiRequest(`/api/aldeias/${aldeiaId}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo }),
      })
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
      if (editForm.nome !== aldeia?.nome) payload.nome = editForm.nome
      if (editForm.descricao !== aldeia?.descricao) payload.descricao = editForm.descricao
      if (editForm.telefone !== aldeia?.telefone) payload.telefone = editForm.telefone
      if (editForm.email !== aldeia?.email) payload.email = editForm.email
      if (editForm.iban !== aldeia?.iban) payload.iban = editForm.iban
      if (editForm.nomeTitularConta !== aldeia?.nomeTitularConta) payload.nomeTitularConta = editForm.nomeTitularConta
      if (editForm.tipoOrganizacao !== aldeia?.tipoOrganizacao) payload.tipoOrganizacao = editForm.tipoOrganizacao

      await apiRequest(`/api/aldeias/${aldeiaId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
      toast.success("Aldeia atualizada com sucesso")
      setEditMode(false)
      fetchAldeia()
    } catch {
      toast.error("Erro ao guardar alterações")
    } finally {
      setSaving(false)
    }
  }

  const addMember = async () => {
    if (!newMemberEmail.trim()) return
    setAddingMember(true)
    try {
      await apiRequest(`/api/aldeias/${aldeiaId}/membros`, {
        method: "POST",
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      })
      toast.success("Membro adicionado com sucesso")
      setShowAddMember(false)
      setNewMemberEmail("")
      setNewMemberRole("MEMBRO")
      fetchAldeia()
    } catch {
      toast.error("Erro ao adicionar membro")
    } finally {
      setAddingMember(false)
    }
  }

  const removeMember = async (userId: string, nome: string) => {
    if (!confirm(`Remover ${nome} desta aldeia?`)) return
    try {
      await apiRequest(`/api/aldeias/${aldeiaId}/membros/${userId}`, {
        method: "DELETE",
      })
      toast.success(`${nome} removido da aldeia`)
      fetchAldeia()
    } catch {
      toast.error("Erro ao remover membro")
    }
  }

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await apiRequest(`/api/aldeias/${aldeiaId}/membros/${userId}/role`, {
        method: "POST",
        body: JSON.stringify({ role: newRole }),
      })
      toast.success("Função atualizada")
      fetchAldeia()
    } catch {
      toast.error("Erro ao alterar função")
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

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case "ADMIN": return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Admin</Badge>
      case "MODERADOR": return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Moderador</Badge>
      case "VENDEDOR": return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Vendedor</Badge>
      default: return <Badge variant="secondary">Membro</Badge>
    }
  }

  const getGameIcon = (tipo: string) => {
    switch (tipo) {
      case "rifa": return "🎫"
      case "raspadinha": return "🎰"
      case "euromilhoes": return "⭐"
      case "poio_da_vaca": return "🐄"
      default: return "🎮"
    }
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
              <img src={aldeia.logoUrl} alt={aldeia.nome} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="h-16 w-16 bg-primary/10 flex items-center justify-center rounded-xl">
                <MapPin className="h-8 w-8 text-primary" />
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
                <span className="text-sm text-muted-foreground">Nível {aldeia.nivel}</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview"><Eye className="h-4 w-4 mr-2" /> Visão Geral</TabsTrigger>
            <TabsTrigger value="members"><Users className="h-4 w-4 mr-2" /> Membros ({aldeia._count.userAldeiaRoles})</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-2" /> Eventos ({aldeia._count.eventos})</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" /> Configurações</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Membros</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{aldeia._count.userAldeiaRoles}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Eventos</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{aldeia._count.eventos}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Jogos</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{aldeia._count.jogos}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Prémios</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{aldeia._count.premios}</p></CardContent>
              </Card>
            </div>

            {aldeia.descricao && (
              <Card className="mt-6">
                <CardHeader><CardTitle>Descrição</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">{aldeia.descricao}</p></CardContent>
              </Card>
            )}

            {isSuperAdmin && (
              <Card className="mt-6">
                <CardHeader><CardTitle>Administração</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Verificar Aldeia</p>
                      <p className="text-sm text-muted-foreground">Aldeias verificadas são visíveis publicamente</p>
                    </div>
                    <Switch
                      checked={aldeia.verificado}
                      onCheckedChange={toggleVerificado}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Aldeia Ativa</p>
                      <p className="text-sm text-muted-foreground">Aldeias inativas ficam indisponíveis</p>
                    </div>
                    <Switch
                      checked={aldeia.ativo}
                      onCheckedChange={toggleAtivo}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="mt-6">
              <CardHeader><CardTitle>Admins</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {aldeia.admins.map(admin => (
                    <Badge key={admin.id} className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      <Crown className="h-3 w-3 mr-1" /> {admin.nome}
                    </Badge>
                  ))}
                  {aldeia.admins.length === 0 && <p className="text-sm text-muted-foreground">Sem admins</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Membros da Aldeia</CardTitle>
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowAddMember(true)}>
                    <UserPlus className="h-4 w-4 mr-2" /> Adicionar
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aldeia.userAldeiaRoles.map(membro => (
                    <div key={membro.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="font-medium text-sm">{membro.user.nome.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium">{membro.user.nome}</p>
                          <p className="text-xs text-muted-foreground">{membro.user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(membro.role.name)}
                        {isAdmin && membro.userId !== user?.id && (
                          <>
                            <Select
                              value={membro.role.name}
                              onValueChange={(val) => changeRole(membro.userId, val)}
                            >
                              <SelectTrigger className="w-[120px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MEMBRO">Membro</SelectItem>
                                <SelectItem value="MODERADOR">Moderador</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
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
                    <p className="text-center text-muted-foreground py-8">Nenhum membro encontrado</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <div className="space-y-4">
              {aldeia.eventos && aldeia.eventos.length > 0 ? (
                aldeia.eventos.map(evento => (
                  <Card key={evento.id}>
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleEvento(evento.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedEventos.has(evento.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <div>
                            <CardTitle className="text-base">{evento.nome}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {new Date(evento.dataInicio).toLocaleDateString("pt-PT")}
                              {evento.dataFim ? ` — ${new Date(evento.dataFim).toLocaleDateString("pt-PT")}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {evento.ativo ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Ativo</Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                          <Badge variant="outline">{evento.jogos.length} jogos</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    {expandedEventos.has(evento.id) && (
                      <CardContent className="pt-0">
                        <div className="space-y-2 mt-2">
                          {evento.jogos.map(jogo => (
                            <div
                              key={jogo.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => router.push(`/jogos/${jogo.tipo === "poio_da_vaca" ? "poio-da-vaca" : jogo.tipo === "raspadinha" ? "raspadinha-premium" : jogo.tipo}?jogoId=${jogo.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{getGameIcon(jogo.tipo)}</span>
                                <div>
                                  <p className="font-medium">{jogo.nome}</p>
                                  <p className="text-xs text-muted-foreground">{jogo.tipo.replace(/_/g, " ")} · €{jogo.preco}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{jogo._count.participacoes} participações</Badge>
                                {jogo.ativo ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          ))}
                          {evento.jogos.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">Sem jogos neste evento</p>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum evento encontrado</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="settings">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Editar Aldeia</CardTitle>
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
                <CardContent className="space-y-4">
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
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={editForm.descricao || ""}
                      onChange={e => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
                      disabled={!editMode}
                      rows={3}
                    />
                  </div>
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
                        value={editForm.email || ""}
                        onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!editMode}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>IBAN</Label>
                      <Input
                        value={editForm.iban || ""}
                        onChange={e => setEditForm(prev => ({ ...prev, iban: e.target.value }))}
                        disabled={!editMode}
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
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBRO">Membro</SelectItem>
                  <SelectItem value="MODERADOR">Moderador</SelectItem>
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

      <BottomNav />
    </LayoutHeader>
  )
}
