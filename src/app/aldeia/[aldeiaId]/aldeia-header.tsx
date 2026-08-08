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

export function AldeiaHeader({ aldeia, isAdmin, onNewEvento }: AldeiaHeaderProps) {
  const router = useRouter()

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

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {aldeia.logoUrl ? (
            <img src={aldeia.logoUrl} alt={aldeia.nome} className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="h-14 w-14 bg-primary/10 flex items-center justify-center rounded-xl">
              <MapPin className="h-7 w-7 text-primary" />
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
            </div>
          </div>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={onNewEvento}>
            <Plus className="h-4 w-4 mr-2" /> Novo Evento
          </Button>
        )}
      </div>
    </>
  )
}