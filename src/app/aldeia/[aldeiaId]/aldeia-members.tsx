"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Trash2, Users } from "lucide-react"
import { ALL_ROLES, AldeiaData } from "./aldeia-types"

interface AldeiaMembersProps {
  aldeia: AldeiaData
  isAdmin: boolean
  currentUserId?: string
  onChangeRole: (userId: string, newRole: string) => void
  onRemoveMember: (userId: string, nome: string) => void
  onAddMember: () => void
}

function getRoleBadge(roleName: string) {
  const role = ALL_ROLES.find(r => r.value === roleName)
  if (role) return <Badge className={role.color}>{role.label}</Badge>
  return <Badge variant="secondary">{roleName}</Badge>
}

export function AldeiaMembers({ aldeia, isAdmin, currentUserId, onChangeRole, onRemoveMember, onAddMember }: AldeiaMembersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Membros da Aldeia</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{aldeia.userAldeiaRoles.length} membro(s)</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={onAddMember}>
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
                {isAdmin && membro.userId !== currentUserId && (
                  <>
                    <Select value={membro.role.name} onValueChange={(val) => onChangeRole(membro.userId, val)}>
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
                      onClick={() => onRemoveMember(membro.userId, membro.user.nome)}
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
                <Button variant="outline" size="sm" className="mt-3" onClick={onAddMember}>
                  <UserPlus className="h-4 w-4 mr-2" /> Adicionar primeiro membro
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}