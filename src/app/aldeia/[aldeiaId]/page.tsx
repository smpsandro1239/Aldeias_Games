"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { LayoutHeader } from "@/components/layout-header"
import { BottomNav } from "@/components/bottom-nav"
import { LoaderScreen } from "@/components/loader-screen"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreateEventoModal } from "@/components/modals/create-evento-modal"
import { CreateJogoModal } from "@/components/modals/create-jogo-modal"
import type { JogoData } from "@/components/modals/create-jogo-types"
import { ArrowLeft, Users, Calendar, Settings, Eye, Ticket } from "lucide-react"
import { toast } from "sonner"
import { apiRequest } from "@/lib/api-client"
import { AldeiaData } from "./aldeia-types"
import { AldeiaHeader } from "./aldeia-header"
import { AldeiaOverview } from "./aldeia-overview"
import { AldeiaParticipacoes } from "./aldeia-participacoes"
import { AldeiaMembers } from "./aldeia-members"
import { AldeiaEvents } from "./aldeia-events"
import { AldeiaSettings } from "./aldeia-settings"
import { AddMemberDialog } from "./aldeia-add-member-dialog"

function AldeiaDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const { user } = useAuth()
  const aldeiaId = params.aldeiaId as string

  const [aldeia, setAldeia] = useState<AldeiaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const VALID_TABS = ["overview", "participacoes", "members", "events", "settings"]

  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<AldeiaData>>({})
  const [saving, setSaving] = useState(false)

  const [showAddMember, setShowAddMember] = useState(false)

  const [expandedEventos, setExpandedEventos] = useState<Set<string>>(new Set())

  const [pendingChanges, setPendingChanges] = useState<any[]>([])

  const [showCreateEvento, setShowCreateEvento] = useState(false)

  const [showAddJogo, setShowAddJogo] = useState(false)
  const [addJogoEventoId, setAddJogoEventoId] = useState<string | null>(null)

  const isSuperAdmin = user?.role === "super_admin"
  const isAdmin = isSuperAdmin || !!aldeia?.admins.some(a => a.id === user?.id)

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
      if (user?.role === "super_admin" || data.admins.some((a: { id: string }) => a.id === user?.id)) {
        fetchPendingChanges()
      }
    } catch (err) {
      console.error("Erro ao buscar aldeia:", err)
      toast.error("Erro ao carregar dados da aldeia")
    } finally {
      setLoading(false)
    }
  }, [aldeiaId])

  const fetchPendingChanges = async () => {
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}/pending-changes`)
      if (res.ok) {
        const data = await res.json()
        setPendingChanges(data)
      }
    } catch {}
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

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

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
      if (editForm.telefoneMBWay !== aldeia?.telefoneMBWay) payload.telefoneMBWay = editForm.telefoneMBWay
      if (editForm.emailPagamentos !== aldeia?.emailPagamentos) payload.emailPagamentos = editForm.emailPagamentos
      // School fields
      if (editForm.nomeEscola !== aldeia?.nomeEscola) payload.nomeEscola = editForm.nomeEscola
      if (editForm.codigoEscola !== aldeia?.codigoEscola) payload.codigoEscola = editForm.codigoEscola
      if (editForm.nivelEnsino !== aldeia?.nivelEnsino) payload.nivelEnsino = editForm.nivelEnsino

      if ((editForm as any).metodosPagamentoAceites !== (aldeia as any)?.metodosPagamentoAceites) {
        payload.metodosPagamentoAceites = (editForm as any).metodosPagamentoAceites
      }
      if (payload.metodosPagamentoAceites === null) delete payload.metodosPagamentoAceites

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

  const handleAddMember = async (email: string, role: string) => {
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}/membros`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro")
      }
      toast.success("Membro adicionado com sucesso")
      setShowAddMember(false)
      fetchAldeia()
    } catch (e: any) {
      toast.error(e.message || "Erro ao adicionar membro")
    }
  }

  const handleRegistarMembro = async (data: { nome: string; email: string; password: string; role: string }) => {
    const res = await apiRequest(`/api/aldeias/${aldeiaId}/membros/registar`, {
      method: "POST",
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Erro ao registar membro")
    }
    toast.success("Utilizador criado e adicionado à aldeia")
    setShowAddMember(false)
    fetchAldeia()
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
      toast.success("Evento criado com sucesso!")
      setShowCreateEvento(false)
      fetchAldeia()
      return { eventoId, jogosSelecionados: data.jogosSelecionados || [] }
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar evento")
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
        <AldeiaHeader
          aldeia={aldeia}
          isAdmin={isAdmin}
          onNewEvento={() => setShowCreateEvento(true)}
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value)
            router.replace(`/aldeia/${aldeiaId}?tab=${value}`, { scroll: false })
          }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="overview"><Eye className="h-4 w-4 mr-2" /> Geral</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="participacoes"><Ticket className="h-4 w-4 mr-2" /> Participações</TabsTrigger>
            )}
            <TabsTrigger value="members"><Users className="h-4 w-4 mr-2" /> Membros</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-2" /> Eventos</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" /> Config</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <AldeiaOverview
              aldeia={aldeia}
              isSuperAdmin={isSuperAdmin}
              onTab={setActiveTab}
              onToggleVerificado={toggleVerificado}
              onToggleAtivo={toggleAtivo}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="participacoes">
              <AldeiaParticipacoes aldeiaId={aldeiaId} />
            </TabsContent>
          )}

          <TabsContent value="members">
            <AldeiaMembers
              aldeia={aldeia}
              isAdmin={isAdmin}
              currentUserId={user?.id}
              onChangeRole={changeRole}
              onRemoveMember={removeMember}
              onAddMember={() => setShowAddMember(true)}
            />
          </TabsContent>

          <TabsContent value="events">
            <AldeiaEvents
              eventos={aldeia.eventos}
              isAdmin={isAdmin}
              expanded={expandedEventos}
              onToggle={toggleEvento}
              onToggleEstado={toggleEventoEstado}
              onAddJogo={openAddJogo}
              onCreateEvento={() => setShowCreateEvento(true)}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="settings">
              <AldeiaSettings
                editForm={editForm}
                editMode={editMode}
                saving={saving}
                isSuperAdmin={isSuperAdmin}
                isAdmin={isAdmin}
                currentUserId={user?.id}
                pendingChanges={pendingChanges}
                onStartEdit={() => { setEditForm(aldeia); setEditMode(true) }}
                onCancelEdit={() => setEditMode(false)}
                onUpdateField={(field, value) => setEditForm(prev => ({ ...prev, [field]: value }))}
                onSave={saveEdits}
                onDecideChange={decidePendingChange}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onAdd={handleAddMember}
        onRegistar={handleRegistarMembro}
        aldeiaId={aldeiaId}
      />

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

export default function AldeiaDetailPage() {
  return (
    <Suspense fallback={<LoaderScreen message="A carregar aldeia..." />}>
      <AldeiaDetailContent />
    </Suspense>
  )
}