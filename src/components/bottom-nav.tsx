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
  Sparkles
} from "lucide-react";

interface BottomNavProps {
  role?: string;
  currentPath?: string;
}

const navItems = {
  user: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/clientedashboard" },
    { icon: Ticket, label: "Jogos", path: "/jogos" },
    { icon: History, label: "Histórico", path: "/perfil" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ],
  vendedor: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/vendedordashboard" },
    { icon: DollarSign, label: "Vendas", path: "/vendedordashboard" },
    { icon: TrendingUp, label: "Histórico", path: "/vendedordashboard" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ],
  aldeia_admin: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admindashboard" },
    { icon: Calendar, label: "Eventos", path: "/admindashboard" },
    { icon: Gamepad2, label: "Jogos", path: "/admindashboard" },
    { icon: Users, label: "Equipa", path: "/admindashboard" },
  ],
  super_admin: [
    { icon: LayoutDashboard, label: "Super Admin", path: "/superadmindashboard" },
    { icon: Building2, label: "Aldeias", path: "/superadmindashboard" },
    { icon: BarChart3, label: "Analytics", path: "/superadmindashboard" },
    { icon: Settings, label: "Config", path: "/configuracoes" },
  ],
  default: [
    { icon: Compass, label: "Explorar", path: "/" },
    { icon: Gamepad2, label: "Jogos", path: "/jogos" },
    { icon: Ticket, label: "Prémios", path: "/premios" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ],
};

export function BottomNav({ role, currentPath }: BottomNavProps) {
  const router = useRouter();
  const pathname = currentPath || usePathname();
  
  const items = role ? (navItems[role as keyof typeof navItems] || navItems.default) : navItems.default;

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
      <div className="h-24 md:hidden" />
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-high/80 backdrop-blur-2xl border-t border-outline-variant/10 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] md:hidden rounded-t-[2rem]">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path, index);
          
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`
                flex flex-col items-center justify-center transition-all duration-200
                min-w-[64px] py-2 rounded-2xl
                ${active 
                  ? `bg-gradient-to-b ${index === 0 ? 'from-secondary/20 to-transparent' : 'from-primary/20 to-transparent'} scale-110` 
                  : 'hover:bg-surface-container-high/50'
                }
              `}
            >
              <Icon 
                className={`h-6 w-6 transition-all ${getIconColor(active, index)}`}
                style={active && index === 0 ? { fill: "currentColor" } : {}}
              />
              <span className={`
                font-sans text-[10px] font-bold tracking-widest uppercase mt-1
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
