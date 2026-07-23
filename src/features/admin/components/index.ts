// Dashboard Components
export { DashboardLoadingSkeleton } from "./dashboard-loading-skeleton";
export { DashboardHeader } from "./dashboard-header";
export { DashboardStatCards } from "./dashboard-stat-cards";
export { DashboardTabsNavigation } from "./dashboard-tabs-navigation";
export { DashboardTabContent } from "./dashboard-tab-content";
export { DashboardModalsLayer } from "./dashboard-modals-layer";

// Tabs
export { OverviewTab } from "./tabs/OverviewTab";
export { EventosTab } from "./tabs/EventosTab";
export { JogosTab } from "./tabs/JogosTab";
export { VencedoresTab } from "./tabs/VencedoresTab";
export { UsersTab } from "./tabs/UsersTab";
export { AldeiasTab } from "./tabs/AldeiasTab";
export { TransacoesTab } from "./tabs/TransacoesTab";
export { AuditoriaTab } from "./tabs/AuditoriaTab";
export { ComissoesTab } from "./tabs/ComissoesTab";
export { VerificarTab } from "./tabs/VerificarTab";
export { MinhaAldeiaTab } from "./tabs/MinhaAldeiaTab";

// Tipos
export type {
  Stats,
  Evento,
  Jogo,
  User,
  Vencedor,
  Aldeia,
  Transacao,
  Log,
  VendedorStats,
} from "./types";
