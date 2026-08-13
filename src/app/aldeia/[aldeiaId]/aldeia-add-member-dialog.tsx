"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, Loader2, User } from "lucide-react"
import { apiRequest } from "@/lib/api-client"
import { ALL_ROLES } from "./aldeia-types"

interface SearchResult {
  id: string
  nome: string
  email: string
  role: string
}

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (email: string, role: string) => Promise<void>
  onRegistar: (data: { nome: string; email: string; password: string; role: string }) => Promise<void>
  aldeiaId: string
}

export function AddMemberDialog({ open, onOpenChange, onAdd, onRegistar, aldeiaId }: AddMemberDialogProps) {
  const [modo, setModo] = useState<"procurar" | "criar">("procurar")
  const [q, setQ] = useState("")
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [pesquisando, setPesquisando] = useState(false)
  const [erroPesquisa, setErroPesquisa] = useState("")
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [role, setRole] = useState("MEMBRO")
  const [submitting, setSubmitting] = useState(false)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorRegistar, setErrorRegistar] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    setModo("procurar")
    setQ("")
    setResultados([])
    setSelected(null)
    setErroPesquisa("")
    setRole("MEMBRO")
    setNome("")
    setEmail("")
    setPassword("")
    setErrorRegistar("")
  }, [open])

  useEffect(() => {
    if (modo !== "procurar" || q.trim().length < 2) {
      setResultados([])
      setErroPesquisa("")
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPesquisando(true)
      setErroPesquisa("")
      try {
        const res = await apiRequest(`/api/aldeias/${aldeiaId}/membros/search?q=${encodeURIComponent(q.trim())}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || "Erro na pesquisa")
        }
        const data = await res.json()
        setResultados(data.users || [])
      } catch (e: any) {
        setResultados([])
        setErroPesquisa(e.message || "Erro na pesquisa")
      } finally {
        setPesquisando(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q, modo, aldeiaId])

  const handleAdicionar = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    try {
      await onAdd(selected.email, role)
      setSelected(null)
      setRole("MEMBRO")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCriar = async () => {
    if (submitting) return
    setSubmitting(true)
    setErrorRegistar("")
    try {
      await onRegistar({ nome, email, password, role })
    } catch (e: any) {
      setErrorRegistar(e.message || "Erro ao registar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg bg-surface-container-low p-1">
          <button
            type="button"
            onClick={() => setModo("procurar")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${modo === "procurar" ? "bg-background shadow" : "text-muted-foreground"}`}
          >
            Procurar
          </button>
          <button
            type="button"
            onClick={() => setModo("criar")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${modo === "criar" ? "bg-background shadow" : "text-muted-foreground"}`}
          >
            Criar novo
          </button>
        </div>

        {modo === "procurar" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={e => { setQ(e.target.value); setSelected(null) }}
                placeholder="Procurar por nome ou email..."
                className="pl-10"
              />
            </div>

            {q.trim().length < 2 && (
              <p className="text-sm text-muted-foreground">Escreve pelo menos 2 caracteres para pesquisar.</p>
            )}

            {pesquisando && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> A procurar...</p>}

            {!pesquisando && erroPesquisa && (
              <p className="text-sm text-red-500" role="alert">{erroPesquisa}</p>
            )}

            {!pesquisando && !erroPesquisa && q.trim().length >= 2 && resultados.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border p-1">
                {resultados.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelected(u)}
                    className={`w-full flex items-center gap-3 rounded-lg p-2 text-left transition-colors ${selected?.id === u.id ? "bg-primary/10" : "hover:bg-surface-container-low"}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{u.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{u.role}</span>
                  </button>
                ))}
              </div>
            )}

            {!pesquisando && !erroPesquisa && q.trim().length >= 2 && resultados.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum utilizador encontrado.{" "}
                <button type="button" className="text-primary underline" onClick={() => { setModo("criar"); setEmail(q.includes("@") ? q : "") }}>
                  Criar novo utilizador
                </button>
              </p>
            )}

            {selected && (
              <div className="rounded-xl border p-3 space-y-3">
                <p className="text-sm"><span className="font-medium">{selected.nome}</span> · {selected.email}</p>
                <div>
                  <Label>Função</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {modo === "criar" && (
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={12}
                placeholder="Mínimo 12 caracteres, maiúscula, minúscula, número e símbolo"
              />
            </div>
            <div>
              <Label>Função</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {errorRegistar && <p className="text-sm text-red-500" role="alert">{errorRegistar}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {modo === "procurar" ? (
            <Button onClick={handleAdicionar} disabled={!selected || submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar à aldeia
            </Button>
          ) : (
            <Button onClick={handleCriar} disabled={submitting || !nome.trim() || !email.trim() || !password}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar e adicionar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
