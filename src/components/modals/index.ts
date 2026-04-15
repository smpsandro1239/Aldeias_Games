// Exportar todos os modais
export { LoginModal } from "./login-modal";
export { RegisterModal } from "./register-modal";
export { ProfileModal } from "./profile-modal";
export { CreateEventoModal } from "./create-evento-modal";
export { CreateJogoModal } from "./create-jogo-modal";
export { PaymentModal } from "./payment-modal";
export { SelectPaymentModal } from "./select-payment-modal";
export { PaymentMethodModal } from "./payment-method-modal";
export { ScratchCardModal } from "./scratch-card-modal";
export { NumberSelectorModal } from "./number-selector-modal";
export { PoioDaVacaModal } from "./poio-da-vaca-modal";
export { SorteioModal } from "./sorteio-modal";
export { NotificationsModal } from "./notifications-modal";
export { ConfirmModal } from "./confirm-modal";
export { AldeiaModal } from "./aldeia-modal";
export { UserModal } from "./user-modal";
export { ResultadosExternosModal } from "./resultados-externos-modal";
export { PremioModal, PremioList } from "./premio-modal";
export { AldeiaWizardModal } from "./aldeia-wizard-modal";

// Export new components
export { VictoryCelebration } from "@/components/victory-celebration";
export { WalletBalance, AddBalanceModal, WalletHistory } from "@/components/wallet/wallet-balance";
export { POSView } from "@/features/vendedor/pos-view";
export { SetupWizard } from "@/components/setup-wizard";
export { GameTutorial, useTutorialSeen, markTutorialSeen } from "@/components/game-tutorial";
export { QRCodeGenerator, QuickShare } from "@/components/qr-code-generator";
export { GamificationBadge, LevelProgress, GamificationDashboard, LEVELS, BADGES } from "@/components/gamification";
export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonStats, 
  SkeletonList, 
  SkeletonProfile, 
  SkeletonWallet,
  SkeletonGameCard,
  SkeletonGrid,
  SkeletonButton,
  SkeletonTabs
} from "@/components/skeleton";
export { 
  EmptyState, 
  EmptyJogos, 
  EmptyParticipacoes, 
  EmptyEventos, 
  EmptyVendedores,
  EmptyVendas,
  EmptyNotificacoes,
  EmptyTransacoes,
  EmptyResultados,
  EmptyAldeias,
  EmptyPremios,
  EmptyUsuarios,
  EmptyComponents
} from "@/components/empty-state";
