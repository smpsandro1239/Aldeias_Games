"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { ALL_ROLES } from "./aldeia-types"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (email: string, role: string) => Promise<void>
}

export function AddMemberDialog({ open, onOpenChange, onAdd }: AddMemberDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("MEMBRO")
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!email.trim() || adding) return
    setAdding(true)
    try {
      await onAdd(email, role)
      setEmail("")
      setRole("MEMBRO")
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Email do Utilizador</Label>
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div>
            <Label>Função</Label>
            <Select value={role} onValueChange={setRole}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleAdd} disabled={adding || !email.trim()}>
            {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}