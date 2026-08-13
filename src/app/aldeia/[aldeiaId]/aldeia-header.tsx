"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Plus, CheckCircle2, XCircle } from "lucide-react"
import { AldeiaData } from "./aldeia-types"

interface AldeiaHeaderProps {
  aldeia: AldeiaData
  isAdmin: boolean
  onNewEvento: () => void
}

const TIPO_BANNER: Record<string, string> = {
  aldeia: "from-blue-600 via-blue-500 to-blue-400",
  escola: "from-purple-600 via-purple-500 to-purple-400",
  associacao_pais: "from-green-600 via-green-500 to-green-400",
  clube: "from-orange-600 via-orange-500 to-orange-400",
}

export function AldeiaHeader({ aldeia, isAdmin, onNewEvento }: AldeiaHeaderProps) {
  const router = useRouter()
  const bannerGradient = TIPO_BANNER[aldeia.tipoOrganizacao] || "from-primary via-primary/70 to-primary/40"

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/aldeias")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar às Aldeias
      </Button>

      <div className="relative overflow-hidden rounded-2xl border border-outline-variant/20">
        {aldeia.bannerUrl ? (
          <>
            <img
              src={aldeia.bannerUrl}
              alt={aldeia.nome}
              className="h-48 md:h-64 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          </>
        ) : (
          <div className={`h-48 md:h-64 w-full bg-gradient-to-br ${bannerGradient}`} />
        )}

        <div className="absolute top-4 right-4 z-10">
          {isAdmin && (
            <Button size="sm" onClick={onNewEvento} className="bg-white/90 hover:bg-white text-foreground shadow">
              <Plus className="h-4 w-4 mr-2" /> Novo Evento
            </Button>
          )}
        </div>

        <div className="relative z-10 flex items-end gap-4 p-5 md:p-6">
          {aldeia.logoUrl ? (
            <img
              src={aldeia.logoUrl}
              alt={aldeia.nome}
              className="h-16 w-16 rounded-2xl border-2 border-white/70 shadow object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-primary/20 border-2 border-white/70 shadow flex items-center justify-center">
              <MapPin className="h-8 w-8 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-white drop-shadow">{aldeia.nome}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {aldeia.verificado ? (
                <Badge className="bg-white/20 text-white backdrop-blur border border-white/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Verificada
                </Badge>
              ) : (
                <Badge className="bg-orange-500/80 text-white backdrop-blur border border-white/30">
                  <XCircle className="h-3 w-3 mr-1" /> Não Verificada
                </Badge>
              )}
              {!aldeia.ativo && <Badge className="bg-red-500/80 text-white backdrop-blur border border-white/30">Inativa</Badge>}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}