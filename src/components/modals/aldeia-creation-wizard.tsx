"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Gamepad2, Users, ArrowRight, Check, PartyPopper } from "lucide-react"

interface AldeiaWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  aldeiaId: string
  aldeiaNome: string
}

const STEPS = [
  {
    id: "evento",
    icon: Calendar,
    title: "Criar Evento",
    description: "Crie o primeiro evento para a sua aldeia. Os eventos agrupam jogos por data e tema.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "jogos",
    icon: Gamepad2,
    title: "Adicionar Jogos",
    description: "Adicione jogos ao evento: Rifas, Raspadinhas, Euromilhões ou Poio da Vaca.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "equipe",
    icon: Users,
    title: "Montar Equipa",
    description: "Adicione administradores e vendedores para gerir a sua aldeia.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
]

export function AldeiaCreationWizard({ open, onOpenChange, aldeiaId, aldeiaNome }: AldeiaWizardProps) {
  const router = useRouter()
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  const handleStepClick = (stepId: string) => {
    switch (stepId) {
      case "evento":
        onOpenChange(false)
        router.push(`/aldeia/${aldeiaId}?tab=events&create=true`)
        break
      case "jogos":
        onOpenChange(false)
        router.push(`/aldeia/${aldeiaId}?tab=events&expandFirst=true`)
        break
      case "equipe":
        onOpenChange(false)
        router.push(`/aldeia/${aldeiaId}?tab=members&addMember=true`)
        break
    }
  }

  const allDone = completedSteps.size === STEPS.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-primary" />
            Aldeia Criada com Sucesso!
          </DialogTitle>
          <DialogDescription>
            Para a sua aldeia <strong>{aldeiaNome}</strong> ficar funcionál, precisa de pelo menos:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = completedSteps.has(step.id)
            return (
              <Card
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isCompleted ? "border-green-500/30 bg-green-50/50 dark:bg-green-900/10" : "hover:border-primary/30"
                }`}
                onClick={() => handleStepClick(step.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${step.bgColor} flex items-center justify-center shrink-0`}>
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Icon className={`h-5 w-5 ${step.color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{step.title}</p>
                      <Badge variant="outline" className="text-[10px]">Passo {index + 1}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Depois
          </Button>
          <Button size="sm" onClick={() => handleStepClick("evento")}>
            Começar agora
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
