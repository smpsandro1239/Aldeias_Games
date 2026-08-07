import { Gift, Star, Award, Gamepad2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface EventoGameType {
  id: string;
  nome: string;
  descricao: string;
  icon: LucideIcon;
}

export const EVENTO_GAME_TYPES: readonly EventoGameType[] = [
  { id: "raspadinha", nome: "Raspadinha", descricao: "Jogo de raspar instantâneo", icon: Gift },
  { id: "rifa", nome: "Rifa", descricao: "Sorteio de números", icon: Star },
  { id: "euromilhoes", nome: "Euromilhões", descricao: "Lotaria tradicional", icon: Award },
  { id: "poio_da_vaca", nome: "Poio da Vaca", descricao: "Jogo rápido", icon: Gamepad2 },
] as const;