"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Award, 
  Flame, 
  Shield, 
  Crown,
  TrendingUp,
  Gift,
  Sparkles,
  Medal
} from "lucide-react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  unlocked: boolean;
}

export interface Level {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
}

export const LEVELS: Level[] = [
  {
    level: 1,
    name: "Iniciado",
    minXP: 0,
    maxXP: 100,
    icon: <Star className="h-5 w-5" />,
    color: "#9cefff",
    benefits: ["Acesso a rifas básicas"],
  },
  {
    level: 2,
    name: "Aventureiro",
    minXP: 100,
    maxXP: 300,
    icon: <Target className="h-5 w-5" />,
    color: "#00ff88",
    benefits: ["Acesso a euromilhoes"],
  },
  {
    level: 3,
    name: "Competidor",
    minXP: 300,
    maxXP: 600,
    icon: <Flame className="h-5 w-5" />,
    color: "#ff8844",
    benefits: ["Cashback 3%", "Acesso a raspadinhas"],
  },
  {
    level: 4,
    name: "Expert",
    minXP: 600,
    maxXP: 1000,
    icon: <Award className="h-5 w-5" />,
    color: "#ff4488",
    benefits: ["Cashback 4%", "Prioridade em prémios"],
  },
  {
    level: 5,
    name: "Mestre",
    minXP: 1000,
    maxXP: Infinity,
    icon: <Crown className="h-5 w-5" />,
    color: "#ffcc00",
    benefits: ["Cashback 5%", "Badge especial", "Acesso antecipado"],
  },
];

export const BADGES: Badge[] = [
  {
    id: "first_game",
    name: "Primeiro Jogo",
    description: "Participaste no teu primeiro jogo",
    icon: "🎮",
    unlocked: false,
  },
  {
    id: "first_win",
    name: "Primeira Vitória",
    description: "Ganhaste o teu primeiro prémio",
    icon: "🏆",
    unlocked: false,
  },
  {
    id: "big_spender",
    name: "Grande Jogador",
    description: "Participaste em 10 jogos",
    icon: "💰",
    unlocked: false,
  },
  {
    id: "lucky",
    name: "Sortudo",
    description: "Ganhaste 3 prémios",
    icon: "🍀",
    unlocked: false,
  },
  {
    id: "collector",
    name: "Colecionador",
    description: "Participaste em todos os tipos de jogo",
    icon: "🎯",
    unlocked: false,
  },
  {
    id: "vip",
    name: "VIP",
    description: "Alcançaste o nível máximo",
    icon: "⭐",
    unlocked: false,
  },
  {
    id: "referrer",
    name: "Embaixador",
    description: "Convidaste 5 amigos",
    icon: "👥",
    unlocked: false,
  },
  {
    id: "streak_7",
    name: "Semana de Ouro",
    description: "Jogaste 7 dias seguidos",
    icon: "🔥",
    unlocked: false,
  },
];

interface GamificationBadgeProps {
  badge: Badge;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

export function GamificationBadge({ badge, size = "md", showDescription = false }: GamificationBadgeProps) {
  const sizes = {
    sm: { container: "w-12 h-12", icon: "text-xl", text: "text-xs" },
    md: { container: "w-20 h-20", icon: "text-2xl", text: "text-xs" },
    lg: { container: "w-28 h-28", icon: "text-3xl", text: "text-sm" },
  };

  const s = sizes[size];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative ${s.container} flex flex-col items-center justify-center`}
    >
      {/* Background */}
      <div
        className={`absolute inset-0 rounded-2xl ${
          badge.unlocked
            ? "bg-gradient-to-br from-primary/20 to-destructive/20 border border-primary/30"
            : "bg-surface-container-low border border-outline-variant/20 opacity-50"
        }`}
      >
        {badge.unlocked && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
        )}
      </div>

      {/* Icon */}
      <span className={`${s.icon} ${!badge.unlocked && "grayscale"}`}>
        {badge.icon}
      </span>

      {/* Lock overlay */}
      {!badge.unlocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="h-4 w-4 text-outline-variant" />
        </div>
      )}

      {/* Name */}
      <span className={`${s.text} mt-1 text-center px-1 ${!badge.unlocked && "opacity-50"}`}>
        {badge.name}
      </span>

      {/* Description on hover */}
      {showDescription && badge.unlocked && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-surface-container border border-primary/30 rounded-lg px-3 py-2 whitespace-nowrap z-10"
        >
          <p className="text-xs text-foreground font-medium">{badge.name}</p>
          <p className="text-[10px] text-muted-foreground">{badge.description}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

interface LevelProgressProps {
  currentXP: number;
  showDetails?: boolean;
}

export function LevelProgress({ currentXP, showDetails = false }: LevelProgressProps) {
  const currentLevel = LEVELS.find(
    (l) => currentXP >= l.minXP && currentXP < l.maxXP
  ) || LEVELS[LEVELS.length - 1];

  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  const progress = nextLevel
    ? ((currentXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100;

  return (
    <Card className="bg-surface-container border-outline-variant/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${currentLevel.color}20` }}
          >
            <div style={{ color: currentLevel.color }}>
              {currentLevel.icon}
            </div>
          </div>

          {/* Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-foreground">
                Nível {currentLevel.level}
              </span>
              <span className="text-xs text-muted-foreground">
                {currentXP} / {nextLevel?.minXP || "∞"} XP
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: currentLevel.color }}
              />
            </div>

            {showDetails && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentLevel.name}
                </span>
                {currentLevel.benefits.length > 0 && (
                  <>
                    <span className="text-outline-variant">•</span>
                    <span className="text-xs text-secondary">
                      {currentLevel.benefits[0]}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface GamificationDashboardProps {
  stats: {
    xp: number;
    level: number;
    totalWins: number;
    totalGames: number;
    currentStreak: number;
  };
  badges: Badge[];
}

export function GamificationDashboard({ stats, badges }: GamificationDashboardProps) {
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <LevelProgress currentXP={stats.xp} showDetails />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/10">
          <Trophy className="h-5 w-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.totalWins}</p>
          <p className="text-[10px] text-muted-foreground">Vitórias</p>
        </div>
        <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/10">
          <Gamepad2 className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.totalGames}</p>
          <p className="text-[10px] text-muted-foreground">Jogos</p>
        </div>
        <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/10">
          <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{stats.currentStreak}</p>
          <p className="text-[10px] text-muted-foreground">Sequência</p>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Medal className="h-4 w-4 text-primary" />
          Minhas Medalhas ({unlockedBadges.length}/{badges.length})
        </h4>
        
        <div className="grid grid-cols-4 gap-3">
          {badges.map((badge) => (
            <GamificationBadge key={badge.id} badge={badge} size="sm" />
          ))}
        </div>
      </div>

      {/* Next Badge Progress */}
      {lockedBadges.length > 0 && (
        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-secondary" />
            Próxima Medalha
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{lockedBadges[0].icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{lockedBadges[0].name}</p>
              <p className="text-xs text-muted-foreground">{lockedBadges[0].description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Import Gamepad2 for the component
import { Gamepad2 } from "lucide-react";
