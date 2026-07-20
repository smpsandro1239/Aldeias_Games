"use client";

import { useRouter, usePathname } from "next/navigation";
import { 
  Compass, 
  Gamepad2, 
  Ticket, 
  History, 
  User, 
  Wallet,
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  Calendar,
  Users,
  Settings,
  Building2,
  LayoutDashboard,
  Sparkles,
  House
} from "lucide-react";

interface BottomNavProps {
  role?: string;
  currentPath?: string;
}

const navItems = {
  user: [
    { icon: LayoutDashboard, label: "INÍCIO", path: "/clientedashboard" },
    { icon: Gamepad2, label: "JOGOS", path: "/jogos" },
    { icon: Ticket, label: "PRÉMIOS", path: "/premios" },
    { icon: User, label: "PERFIL", path: "/perfil" },
    { icon: House, label: "SAIR", path: "/" },
  ],
  vendedor: [
    { icon: LayoutDashboard, label: "INÍCIO", path: "/vendedordashboard" },
    { icon: DollarSign, label: "VENDAS", path: "/vendedordashboard?venda=true" },
    { icon: Wallet, label: "CAIXA", path: "/vendedordashboard?tab=cofre" },
    { icon: TrendingUp, label: "HISTÓRICO", path: "/vendedordashboard?tab=historico" },
    { icon: Gamepad2, label: "JOGOS", path: "/jogos" },
    { icon: House, label: "SAIR", path: "/" },
  ],
  aldeia_admin: [
    { icon: LayoutDashboard, label: "INÍCIO", path: "/admindashboard" },
    { icon: Calendar, label: "EVENTOS", path: "/admindashboard?tab=eventos" },
    { icon: Gamepad2, label: "JOGOS", path: "/admindashboard?tab=jogos" },
    { icon: Wallet, label: "COFRE", path: "/admindashboard/cofre" },
    { icon: Users, label: "EQUIPA", path: "/admindashboard?tab=equipa" },
    { icon: House, label: "SAIR", path: "/" },
  ],
  super_admin: [
    { icon: LayoutDashboard, label: "PAINEL", path: "/superadmindashboard" },
    { icon: Building2, label: "ALDEIAS", path: "/superadmindashboard?tab=aldeias" },
    { icon: BarChart3, label: "STATS", path: "/superadmindashboard?tab=analytics" },
    { icon: Gamepad2, label: "JOGOS", path: "/jogos" },
    { icon: Settings, label: "CONFIG", path: "/configuracoes" },
    { icon: House, label: "SAIR", path: "/" },
  ],
  default: [
    { icon: Compass, label: "INÍCIO", path: "/" },
    { icon: Gamepad2, label: "JOGOS", path: "/jogos" },
    { icon: Ticket, label: "PRÉMIOS", path: "/premios" },
    { icon: User, label: "PERFIL", path: "/perfil" },
    { icon: House, label: "SAIR", path: "/" },
  ],
};

export function BottomNav({ role, currentPath }: BottomNavProps) {
  const router = useRouter();
  const pathname = currentPath || usePathname();
  
  const items = role ? (navItems[role as keyof typeof navItems] || navItems.default) : navItems.default;

  const handleNavClick = (path: string, label: string) => {
    if (label === "SAIR") {
      localStorage.clear();
      router.push("/");
    } else {
      router.push(path);
    }
  };

  const isActive = (path: string, index: number) => {
    if (index === 0) return pathname.startsWith(path);
    return pathname.startsWith(path);
  };

const getIconColor = (isActive: boolean, index: number) => {
  if (!isActive) return "text-muted-foreground/60";
  
  return "text-primary";
};

  return (
    <>
       {/* Desktop/Tablet: Nav no topo */}
       <nav className="hidden sm:block sticky top-0 z-50 bg-background/90 border-b border-outline/20 backdrop-blur">
         <div className="flex justify-center items-center py-2 px-2 sm:px-4">
           <div className="flex gap-1 overflow-x-auto">
             {items.map((item, index) => {
               const Icon = item.icon;
               const active = isActive(item.path, index);
               
               return (
                 <button
                   key={item.label}
                   onClick={() => handleNavClick(item.path, item.label)}
                   className={`
                     flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap
                     ${active 
                       ? 'bg-primary/20 text-primary' 
                       : 'hover:bg-muted/50 text-muted-foreground/70'
                     }
                   `}
                 >
                   <Icon className={`h-3 w-3 sm:h-4 sm:w-4`} />
                   <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                     {item.label}
                   </span>
                 </button>
               );
             })}
           </div>
         </div>
       </nav>
       
       {/* Desktop spacer para empurrar conteúdo para baixo do nav */}
       <div className="hidden sm:block h-[44px] sm:h-[56px]" />
       
       {/* Mobile spacer - evita que conteúdo seja coberto pelo nav fixo */}
       <div className="sm:hidden h-20" />
       
       {/* Mobile: Bottom bar fixed */}
       <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 pb-safe pt-2 bg-background/90 border-t border-outline/20 backdrop-blur shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
         {items.map((item, index) => {
           const Icon = item.icon;
           const active = isActive(item.path, index);
           
           return (
             <button
               key={item.label}
               onClick={() => handleNavClick(item.path, item.label)}
               className={`
                 flex flex-col items-center justify-center transition-all duration-200
                 min-w-[56px] py-2 rounded-xl
                 ${active 
                   ? 'bg-primary/20' 
                   : 'hover:bg-muted/50'
                 }
               `}
             >
               <Icon 
                 className={`h-5 w-5 transition-all ${getIconColor(active, index)}`}
               />
               <span className={`
                 font-sans text-[9px] font-bold tracking-wider uppercase mt-1
                 ${active ? 'text-primary' : 'text-muted-foreground/70'}
               `}>
                 {item.label}
               </span>
             </button>
           );
         })}
       </nav>
    </>
  );
}
