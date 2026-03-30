"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  LucideIcon, 
  Gamepad2, 
  Ticket, 
  Calendar, 
  Users, 
  ShoppingCart, 
  Bell, 
  CreditCard, 
  Trophy, 
  Gift,
  Search
} from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "compact" | "large";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "default",
}: EmptyStateProps) {
  const sizes = {
    default: {
      iconSize: "h-12 w-12",
      iconInner: "h-6 w-6",
      title: "text-lg",
      description: "text-sm",
      padding: "p-8",
    },
    compact: {
      iconSize: "h-8 w-8",
      iconInner: "h-4 w-4",
      title: "text-base",
      description: "text-xs",
      padding: "p-4",
    },
    large: {
      iconSize: "h-16 w-16",
      iconInner: "h-8 w-8",
      title: "text-xl",
      description: "text-base",
      padding: "p-12",
    },
  };

  const size = sizes[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center ${size.padding}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
        className="relative mb-4"
      >
        <div className={`${size.iconSize} bg-[#2e2928] rounded-2xl flex items-center justify-center`}>
          <Icon className={size.iconInner} />
        </div>
        <div className="absolute inset-0 bg-[#ff734b]/10 rounded-2xl blur-xl -z-10" />
      </motion.div>

      <h3 className={`${size.title} font-bold text-white mb-2`}>
        {title}
      </h3>
      <p className={`${size.description} text-[#e0bfb7] max-w-sm mb-6`}>
        {description}
      </p>

      {action && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={action.onClick}
            className="bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold"
          >
            {action.label}
          </Button>
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className="border-[#ff734b]/30 text-[#ff734b] hover:bg-[#ff734b]/10"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function EmptyJogos({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Gamepad2}
      title="Nenhum jogo disponível"
      description="De momento não há jogos ativos. Volta mais tarde para descobrir novas oportunidades!"
      action={
        onAction
          ? {
              label: "Verificar Novamente",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export function EmptyParticipacoes({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Ticket}
      title="Nenhuma participação"
      description="Ainda não participaste em nenhum jogo. Escolhe um jogo para começar!"
      action={
        onAction
          ? {
              label: "Ver Jogos",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export function EmptyEventos({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="Nenhum evento criado"
      description="Cria o teu primeiro evento para começar a organizar rifas e jogos."
      action={
        onAction
          ? {
              label: "Criar Evento",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export function EmptyVendedores() {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum vendedor"
      description="Convida vendedores para ajudar a vender rifas e aumentar as tuas angariações."
    />
  );
}

export function EmptyVendas() {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Nenhuma venda registada"
      description="As tuas vendas aparecerão aqui. Começa a vender para veres o teu progresso!"
    />
  );
}

export function EmptyNotificacoes() {
  return (
    <EmptyState
      icon={Bell}
      title="Sem notificações"
      description="Aqui aparecerão as tuas notificações - ganhos, resultados e muito mais!"
      variant="compact"
    />
  );
}

export function EmptyTransacoes() {
  return (
    <EmptyState
      icon={CreditCard}
      title="Nenhuma transação"
      description="O teu histórico de transações aparecerá aqui."
      variant="compact"
    />
  );
}

export function EmptyResultados() {
  return (
    <EmptyState
      icon={Trophy}
      title="Resultados em breve"
      description="Os resultados dos sorteios aparecerão aqui após o sorteio."
    />
  );
}

export function EmptyAldeias({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="Nenhuma aldeia encontrada"
      description="Parece que ainda não há aldeias registadas na plataforma."
      action={
        onAction
          ? {
              label: "Adicionar Aldeia",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export function EmptyPremios({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Gift}
      title="Nenhum prémio definido"
      description="Adiciona prémios ao teu jogo para motivar os participantes."
      action={
        onAction
          ? {
              label: "Adicionar Prémio",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export function EmptyUsuarios({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum utilizador"
      description="Convida utilizadores para a tua organização."
      action={
        onAction
          ? {
              label: "Adicionar Utilizador",
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}

export const EmptyComponents = {
  jogos: EmptyJogos,
  participacoes: EmptyParticipacoes,
  eventos: EmptyEventos,
  vendedores: EmptyVendedores,
  vendas: EmptyVendas,
  notificacoes: EmptyNotificacoes,
  transacoes: EmptyTransacoes,
  resultados: EmptyResultados,
  aldeias: EmptyAldeias,
  premios: EmptyPremios,
  usuarios: EmptyUsuarios,
} as const;

export type EmptyType = keyof typeof EmptyComponents;
