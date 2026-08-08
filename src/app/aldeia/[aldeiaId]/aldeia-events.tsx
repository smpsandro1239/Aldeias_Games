"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronDown, Gamepad2, Plus, Power, PowerOff, CheckCircle2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { AldeiaData, GAME_TYPES, gameRoute } from "./aldeia-types"

interface AldeiaEventsProps {
  eventos?: NonNullable<AldeiaData["eventos"]>
  isAdmin: boolean
  expanded: Set<string>
  onToggle: (eventoId: string) => void
  onToggleEstado: (eventoId: string, currentState: string) => void
  onAddJogo: (eventoId: string, eventoNome: string) => void
  onCreateEvento: () => void
}

function getGameIcon(tipo: string): string {
  const game = GAME_TYPES.find(g => g.value === tipo)
  return game?.icon || "🎮"
}

export function AldeiaEvents({ eventos, isAdmin, expanded, onToggle, onToggleEstado, onAddJogo, onCreateEvento }: AldeiaEventsProps) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={onCreateEvento}>
            <Plus className="h-4 w-4 mr-2" /> Criar Evento
          </Button>
        </div>
      )}
      {eventos && eventos.length > 0 ? (
        eventos.map(evento => {
          const isExpanded = expanded.has(evento.id)
          return (
            <Card key={evento.id} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onToggle(evento.id)}
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
                        onToggleEstado(evento.id, evento.estado)
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
                          onAddJogo(evento.id, evento.nome)
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
                        onClick={() => router.push(gameRoute(jogo.tipo, jogo.id))}
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
                              onAddJogo(evento.id, evento.nome)
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
              <Button size="sm" onClick={onCreateEvento}>
                <Plus className="h-4 w-4 mr-2" /> Criar Evento
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}