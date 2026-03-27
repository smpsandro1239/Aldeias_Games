"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Gamepad2, Award, User, Wallet } from "lucide-react";

interface BottomNavProps {
  currentPath?: string;
}

export function BottomNav({ currentPath }: BottomNavProps) {
  const router = useRouter();
  const pathname = currentPath || usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const navItems = [
    { icon: Home, label: "Início", path: "/" },
    { icon: Gamepad2, label: "Jogos", path: "/jogos" },
    { icon: Award, label: "Prémios", path: "/premios" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/15 shadow-2xl flex justify-around items-center px-4 pb-6 pt-2 rounded-t-3xl md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              active
                ? "text-[#ff734b] bg-[#2e2928]/60"
                : "text-[#e0bfb7]/60 hover:bg-[#2e2928]/40"
            }`}
          >
            <Icon className="w-6 h-6" style={active ? { fill: "currentColor" } : {}} />
            <span className="font-sans text-[11px] font-medium tracking-tight mt-1">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
