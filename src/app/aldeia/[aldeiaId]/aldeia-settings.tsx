"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Loader2 } from "lucide-react"
import { AldeiaData } from "./aldeia-types"

interface AldeiaSettingsProps {
  editForm: Partial<AldeiaData>
  editMode: boolean
  saving: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  currentUserId?: string
  pendingChanges: any[]
  onStartEdit: () => void
  onCancelEdit: () => void
  onUpdateField: (field: keyof AldeiaData, value: unknown) => void
  onSave: () => void
  onDecideChange: (changeId: string, acao: 'aprovar' | 'rejeitar') => void
}

export function AldeiaSettings(props: AldeiaSettingsProps) {
  const { editForm, editMode, saving, isSuperAdmin, isAdmin, currentUserId, pendingChanges, onStartEdit, onCancelEdit, onUpdateField, onSave, onDecideChange } = props

  const pendentes = pendingChanges.filter(c => c.estado === 'pendente')

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Editar Aldeia</CardTitle>
        {!editMode ? (
          <Button variant="outline" size="sm" onClick={onStartEdit}>
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancelEdit}>Cancelar</Button>
            <Button size="sm" onClick={onSave} disabled={saving}>
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
                onChange={e => onUpdateField('nome', e.target.value)}
                disabled={!editMode}
              />
            </div>
            <div>
              <Label>Tipo de Organização</Label>
              <Select
                value={editForm.tipoOrganizacao || "aldeia"}
                onValueChange={val => onUpdateField('tipoOrganizacao', val)}
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
              onChange={e => onUpdateField('descricao', e.target.value)}
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
                onChange={e => onUpdateField('telefone', e.target.value)}
                disabled={!editMode}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email || ""}
                onChange={e => onUpdateField('email', e.target.value)}
                disabled={!editMode}
              />
            </div>
          </div>
          <div className="mt-3">
            <Label>Morada</Label>
            <Input
              value={editForm.morada || ""}
              onChange={e => onUpdateField('morada', e.target.value)}
              disabled={!editMode}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-3">
            <div>
              <Label>Código Postal</Label>
              <Input
                value={editForm.codigoPostal || ""}
                onChange={e => onUpdateField('codigoPostal', e.target.value)}
                disabled={!editMode}
                placeholder="0000-000"
              />
            </div>
            <div>
              <Label>Localidade</Label>
              <Input
                value={editForm.localidade || ""}
                onChange={e => onUpdateField('localidade', e.target.value)}
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
              onChange={e => onUpdateField('responsavel', e.target.value)}
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
                onChange={e => onUpdateField('iban', e.target.value)}
                disabled={!editMode}
                placeholder="PT50 0000 0000 0000 0000 0000 0"
              />
            </div>
            <div>
              <Label>Titular da Conta</Label>
              <Input
                value={editForm.nomeTitularConta || ""}
                onChange={e => onUpdateField('nomeTitularConta', e.target.value)}
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
                  onChange={e => onUpdateField('nomeEscola', e.target.value)}
                  disabled={!editMode}
                />
              </div>
              <div>
                <Label>Código da Escola</Label>
                <Input
                  value={editForm.codigoEscola || ""}
                  onChange={e => onUpdateField('codigoEscola', e.target.value)}
                  disabled={!editMode}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label>Nível de Ensino</Label>
              <Select
                value={editForm.nivelEnsino || ""}
                onValueChange={val => onUpdateField('nivelEnsino', val)}
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
                onChange={e => onUpdateField('numeroAlvara', e.target.value)}
                disabled={!editMode}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={editForm.autorizacaoCM || false}
                onCheckedChange={val => onUpdateField('autorizacaoCM', val)}
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
                onCheckedChange={val => onUpdateField('documentosVerificados', val)}
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
                onChange={e => onUpdateField('logoUrl', e.target.value)}
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
                value={editForm.bannerUrl || ""}
                onChange={e => onUpdateField('bannerUrl', e.target.value)}
                disabled={!editMode}
                placeholder="https://..."
              />
              {editForm.bannerUrl && (
                <img src={editForm.bannerUrl} alt="Banner" className="mt-2 h-12 w-full rounded-lg object-cover" />
              )}
            </div>
          </div>
        </div>

        {/* Alterações Pendentes */}
        {pendentes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-orange-600 mb-3">
              Alterações Pendentes de Aprovação ({pendentes.length})
            </p>
            <div className="space-y-2">
              {pendentes.map(change => (
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
                    {isAdmin && change.requestedById !== currentUserId && (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => onDecideChange(change.id, 'aprovar')}>
                          Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => onDecideChange(change.id, 'rejeitar')}>
                          Rejeitar
                        </Button>
                      </>
                    )}
                    {change.requestedById === currentUserId && (
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
  )
}