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
    { icon: TrendingUp, label: "HISTÓRICO", path: "/vendedordashboard?tab=historico" },
    { icon: User, label: "PERFIL", path: "/perfil" },
    { icon: House, label: "SAIR", path: "/" },
  ],
  aldeia_admin: [
    { icon: LayoutDashboard, label: "INÍCIO", path: "/admindashboard" },
    { icon: Calendar, label: "EVENTOS", path: "/admindashboard?tab=eventos" },
    { icon: Gamepad2, label: "JOGOS", path: "/admindashboard?tab=jogos" },
    { icon: Users, label: "EQUIPA", path: "/admindashboard?tab=equipa" },
    { icon: House, label: "SAIR", path: "/" },
  ],
  super_admin: [
    { icon: LayoutDashboard, label: "PAINEL", path: "/superadmindashboard" },
    { icon: Building2, label: "ALDEIAS", path: "/superadmindashboard?tab=aldeias" },
    { icon: BarChart3, label: "ESTATS", path: "/superadmindashboard?tab=stats" },
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
    if (!isActive) return "text-[#e0bfb7]/60";
    
    if (index === 0) return "text-secondary drop-shadow-[0_0_8px_rgba(0,218,243,0.5)]";
    
    return "text-primary";
  };

  return (
    <>
      {/* Spacer para evitar que conteúdo seja coberto */}
      <div className="h-24" />
      
      {/* Navigation - Bottom on mobile, Top bar on desktop */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#1a1614] border-t border-[#58413b]/20 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] lg:bottom-auto lg:top-0 lg:left-0 lg:w-full lg:flex-row lg:justify-center lg:py-2 lg:pb-2 lg:gap-1 lg:border-b lg:border-t-0">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path, index);
          
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.path, item.label)}
              className={`
                flex flex-col lg:flex-row items-center justify-center transition-all duration-200
                min-w-[64px] lg:min-w-[80px] py-2 rounded-2xl lg:rounded-lg
                ${active 
                  ? `bg-gradient-to-b ${index === 0 ? 'from-secondary/20 to-transparent' : 'from-primary/20 to-transparent'} lg:scale-100` 
                  : 'hover:bg-[#2e2928]'
                }
              `}
            >
              <Icon 
                className={`h-5 w-5 lg:h-5 lg:w-5 transition-all ${getIconColor(active, index)}`}
                style={active && index === 0 ? { fill: "currentColor" } : {}}
              />
              <span className={`
                font-sans text-[8px] lg:text-[10px] font-bold tracking-widest uppercase mt-1
                ${active ? 'text-primary' : 'text-on-surface-variant opacity-70'}
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
