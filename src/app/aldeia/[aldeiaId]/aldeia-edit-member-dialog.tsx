"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface EditMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  membro: { userId: string; nome: string; role?: string } | null
  onSave: (data: { nome: string; email: string }) => Promise<void>
}

export function EditMemberDialog({ open, onOpenChange, membro, onSave }: EditMemberDialogProps) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !membro) return
    setNome(membro.nome)
    setEmail((membro as { email?: string }).email || "")
  }, [open, membro])

  const handleSave = async () => {
    if (!membro || saving) return
    setSaving(true)
    try {
      await onSave({ nome: nome.trim(), email: email.trim() })
    } finally {
      setSaving(false)
    }
  }

  const nomeChanged = nome.trim() !== "" && nome.trim() !== membro?.nome
  const changed = email.trim() !== "" || nomeChanged
  const nomeValid = nome.trim() === "" || nome.trim().length >= 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Membro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-membro-nome">Nome</Label>
            <Input
              id="edit-membro-nome"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome do membro"
            />
          </div>
          <div>
            <Label htmlFor="edit-membro-email">Email (opcional)</Label>
            <Input
              id="edit-membro-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !changed || !nomeValid}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
