import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Gamepad2 } from "lucide-react";
import { CreateJogoModal } from "@/components/modals/create-jogo-modal";
import { EVENTO_GAME_TYPES } from "./evento-game-types";
import type { GameType, JogoData } from "./create-jogo-types";

interface EventoGamesStepProps {
  open: boolean;
  onClose: () => void;
  eventoNome: string;
  tipoIds: string[];
  configured: Set<string>;
  onConfigured: (tipoId: string) => void;
  onSubmitJogo: (data: any) => Promise<void>;
  eventoId: string;
  aldeiaId: string;
}

export function EventoGamesStep({
  open,
  onClose,
  eventoNome,
  tipoIds,
  configured,
  onConfigured,
  onSubmitJogo,
  eventoId,
  aldeiaId,
}: EventoGamesStepProps) {
  const [jogoModalOpen, setJogoModalOpen] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null);

  const openGameModal = (tipoId: string) => {
    setSelectedGameType(tipoId);
    setJogoModalOpen(true);
  };

  const handleCreateGame = async (data: any) => {
    await onSubmitJogo(data);
    if (selectedGameType) {
      onConfigured(selectedGameType);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="configure-games-description">
          <DialogHeader className="bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-green-500/20">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="bg-green-600/20 p-2 rounded-lg">
                <Gamepad2 className="h-5 w-5 text-green-600" />
              </div>
              Configurar Jogos
            </DialogTitle>
            <DialogDescription id="configure-games-description">
              Configure cada jogo selecionado para o evento &quot;{eventoNome}&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4 pr-2">
            {tipoIds.map((tipoId) => {
              const jogoType = EVENTO_GAME_TYPES.find(g => g.id === tipoId);
              if (!jogoType) return null;
              const Icon = jogoType.icon;
              const isConfigured = configured.has(tipoId);
              return (
                <div key={tipoId} className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                  isConfigured
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-outline-variant/20 bg-surface-container-low/50"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isConfigured ? "bg-green-500/10" : "bg-primary/10"
                    }`}>
                      {isConfigured ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Icon className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{jogoType.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {isConfigured ? "Configurado" : "Pendente"}
                      </p>
                    </div>
                  </div>
                  {!isConfigured && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openGameModal(tipoId)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Configurar
                    </Button>
                  )}
                </div>
              );
            })}

            {configured.size === tipoIds.length && (
              <div className="p-4 rounded-xl border-2 border-green-500/30 bg-green-500/5 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Todos os jogos foram configurados!
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-2 border-t" style={{ zIndex: 1000 }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              style={{ position: 'relative', zIndex: 1001 }}
            >
              {configured.size > 0 ? "Concluir" : "Depois"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateJogoModal
        open={jogoModalOpen}
        onOpenChange={setJogoModalOpen}
        onSubmit={handleCreateGame}
        eventoId={eventoId}
        aldeiaId={aldeiaId}
        initialData={selectedGameType ? { tipo: selectedGameType as GameType } as JogoData : undefined}
      />
    </>
  );
}