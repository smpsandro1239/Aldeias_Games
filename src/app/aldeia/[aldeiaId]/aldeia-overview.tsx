"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Users, Calendar, Gamepad2, PartyPopper, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { AldeiaData } from "./aldeia-types"

interface AldeiaOverviewProps {
  aldeia: AldeiaData
  isSuperAdmin: boolean
  onTab: (tab: string) => void
  onToggleVerificado: (v: boolean) => void
  onToggleAtivo: (v: boolean) => void
}

export function AldeiaOverview({ aldeia, isSuperAdmin, onTab, onToggleVerificado, onToggleAtivo }: AldeiaOverviewProps) {
  const router = useRouter()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 md:col-span-2">
        <Card
          className="border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all"
          onClick={() => onTab("members")}
        >
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold">{aldeia._count.userAldeiaRoles}</p>
            <p className="text-sm text-muted-foreground">Membros</p>
          </CardContent>
        </Card>
        <Card
          className="border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all"
          onClick={() => onTab("events")}
        >
          <CardContent className="pt-6 text-center">
            <Calendar className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold">{aldeia._count.eventos}</p>
            <p className="text-sm text-muted-foreground">Eventos</p>
          </CardContent>
        </Card>
        <Card
          className="border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all"
          onClick={() => onTab("events")}
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

      <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
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
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Administração</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Verificar Aldeia</p>
                <p className="text-sm text-muted-foreground">Aldeias verificadas são visíveis publicamente</p>
              </div>
              <Switch checked={aldeia.verificado} onCheckedChange={onToggleVerificado} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Aldeia Ativa</p>
                <p className="text-sm text-muted-foreground">Aldeias inativas ficam indisponíveis</p>
              </div>
              <Switch checked={aldeia.ativo} onCheckedChange={onToggleAtivo} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}