"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { LoaderScreen } from "@/components/loader-screen";
import { UserMenuModal } from "@/components/user-menu-modal";
import { User, Gamepad2, House, Compass, Wallet, LogOut, Menu, X, BarChart3, Settings, Calendar, Ticket, TrendingUp, LayoutDashboard, Building2, Users, Sun, Moon, Banknote, Scan } from "lucide-react";

// Constants
const ROLE_PATHS = {
  super_admin: "/superadmindashboard",
  aldeia_admin: "/admindashboard",
  vendedor: "/vendedordashboard",
  user: "/clientedashboard",
} as const;

const NAV_ITEMS = {
  super_admin: [
    { icon: Compass, label: "Painel", path: "/superadmindashboard" },
    { icon: Building2, label: "Aldeias", path: "/superadmindashboard?tab=aldeias" },
    { icon: BarChart3, label: "Stats", path: "/superadmindashboard?tab=analytics" },
    { icon: Ticket, label: "Números", path: "/numeros-jogados" },
    { icon: Settings, label: "Config", path: "/configuracoes" },
    { icon: Gamepad2, label: "Jogos", path: "/jogos" },
  ],
  aldeia_admin: [
    { icon: Compass, label: "Dashboard", path: "/admindashboard" },
    { icon: Calendar, label: "Eventos", path: "/admindashboard?tab=eventos" },
    { icon: Gamepad2, label: "Jogos", path: "/admindashboard?tab=jogos" },
    { icon: Ticket, label: "Números", path: "/numeros-jogados" },
    { icon: Banknote, label: "Cofre", path: "/admindashboard/cofre" },
    { icon: Users, label: "Equipa", path: "/admindashboard?tab=users" },
    { icon: Scan, label: "Verificar", path: "/verificar" },
  ],
  vendedor: [
    { icon: LayoutDashboard, label: "Vendas", path: "/vendedordashboard" },
    { icon: Ticket, label: "Números", path: "/numeros-jogados" },
    { icon: Wallet, label: "Pedidos", path: "/vendedordashboard/pedidos" },
    { icon: Banknote, label: "Caixa", path: "/vendedordashboard?tab=cofre" },
    { icon: TrendingUp, label: "Histórico", path: "/vendedordashboard?tab=historico" },
    { icon: Gamepad2, label: "Jogos", path: "/jogos" },
    { icon: Scan, label: "Verificar", path: "/verificar" },
  ],
  user: [
    { icon: Gamepad2, label: "Jogos", path: "/jogos" },
    { icon: Ticket, label: "Números", path: "/numeros-jogados" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ],
} as const;

interface LayoutHeaderProps {
  children: React.ReactNode;
}



export function LayoutHeader({ children }: LayoutHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Todos os hooks devem ser chamados sempre na mesma ordem, antes de qualquer condição
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNavClick = useCallback((path: string) => {
    setMobileMenuOpen(false);
    if (path === "/") {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn("Error clearing localStorage:", error);
      }
    }
    router.push(path);
  }, [router]);

  const roleNavItems = useMemo(() => {
    if (!isAuthenticated || !user?.role) return NAV_ITEMS.user;
    return NAV_ITEMS[user.role as keyof typeof NAV_ITEMS] || NAV_ITEMS.user;
  }, [isAuthenticated, user?.role]);

  // Early return APÓS todos os hooks serem chamados
  if (!isMounted || isLoading) {
    return <LoaderScreen />;
  }

  return (
    <>
      {/* Header com navegação integrada */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-outline-variant/20">
        {/* Skip to main content — WCAG 2.4.1 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[9999] focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:font-bold"
        >
          Saltar para o conteúdo principal
        </a>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
                    <House className="h-8 w-8 text-primary" />
              <span className="font-serif italic text-primary text-lg font-bold">
                Aldeias Games
              </span>
            </button>
          </div>

          {/* Right side: Hamburger menu (mobile) + User menu */}
          <div className="flex items-center gap-2">
            {/* Hamburger menu button - only on mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {isAuthenticated && user?.role === 'super_admin' && (
                <>
                  <button onClick={() => router.push("/superadmindashboard")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Painel</button>
                  <button onClick={() => router.push("/superadmindashboard?tab=aldeias")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Aldeias</button>
                  <button onClick={() => router.push("/configuracoes")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Config</button>
                </>
              )}
              {isAuthenticated && user?.role === 'aldeia_admin' && (
                <>
                  <button onClick={() => router.push("/admindashboard")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Dashboard</button>
                  <button onClick={() => router.push("/admindashboard?tab=eventos")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Eventos</button>
                  <button onClick={() => router.push("/admindashboard/cofre")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Cofre</button>
                </>
              )}
              {isAuthenticated && user?.role === 'vendedor' && (
                <>
                  <button onClick={() => router.push("/vendedordashboard")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Vendas</button>
                  <button onClick={() => router.push("/vendedordashboard?tab=cofre")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Caixa</button>
                </>
              )}
              {isAuthenticated && user?.role === 'user' && (
                <>
                  <button onClick={() => router.push("/participacoes")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Participações</button>
                  <button onClick={() => router.push("/perfil")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Perfil</button>
                </>
              )}
               <button onClick={() => router.push('/jogos')} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Jogos</button>
              {!isAuthenticated && (
                 <button onClick={() => router.push('/')} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Início</button>
              )}
            </nav>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center hover:bg-surface-container transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            </button>

            {/* User menu */}
            <div className="w-9 h-9 rounded-full bg-surface-container-low overflow-hidden border border-primary/20 relative">
              {isAuthenticated && user ? (
                <button
                  onClick={() => setUserMenuOpen(true)}
                   className="w-full h-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
                >
                  <User className="h-4 w-4 text-primary" />
                </button>
              ) : (
                <button
                  onClick={() => router.push("/")}
                  className="w-full h-full flex items-center justify-center text-primary font-bold text-lg"
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-primary/10 shadow-lg z-50">
            <nav className="px-4 py-6 space-y-1">
              {roleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path.split('?')[0];
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:bg-surface-container-low'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              {/* Theme toggle mobile */}
              <div className="pt-4 mt-4 border-t border-outline-variant/20">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-surface-container-low transition-colors"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  <span className="font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
                </button>
              </div>
              {/* Logout option */}
               <div className="pt-4 mt-4 border-t border-outline-variant/20">
                <button
                  onClick={() => handleNavClick("/")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Espaçador para o conteúdo não ficar por baixo do header */}
      <div className="h-16" />

      {/* Conteúdo principal */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Footer */}
        <footer className="border-t border-outline-variant/10 py-8 md:py-12 bg-background">
         <div className="container max-w-7xl mx-auto px-4 md:px-8">
           {/* Mobile: Simplified footer */}
           <div className="md:hidden text-center space-y-4">
             <div className="flex items-center justify-center gap-3">
                <House className="h-6 w-6 text-primary" />
                <span className="font-serif text-lg font-bold text-primary">Aldeias Games</span>
             </div>
              <p className="text-xs text-muted-foreground">Plataforma de angariação de fundos para comunidades locais</p>
              <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                <a href="/termos" className="hover:text-primary transition-colors">Termos</a>
                <a href="/privacidade" className="hover:text-primary transition-colors">Privacidade</a>
                <a href="mailto:suporte@aldeiasgames.pt" className="hover:text-primary transition-colors">Contacto</a>
             </div>
              <p className="text-xs text-muted-foreground/60">© 2026 Aldeias Games</p>
           </div>

           {/* Desktop: Full footer */}
           <div className="hidden md:block">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div>
                 <div className="flex items-center gap-3 mb-4">
                   <House className="h-8 w-8 text-primary" />
                    <span className="font-serif text-xl font-bold text-primary">Aldeias Games</span>
                 </div>
                  <p className="text-sm text-muted-foreground">A plataforma de angariação de fundos para comunidades locais portuguesas.</p>
               </div>
               <div>
                 <h4 className="font-label font-bold uppercase tracking-widest text-xs mb-4">Navegação</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><button onClick={() => document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors">Eventos</button></li>
                    <li><button onClick={() => router.push('/jogos')} className="hover:text-primary transition-colors">Jogos</button></li>
                    <li><button onClick={() => document.getElementById('aldeias')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-primary transition-colors">Aldeias</button></li>
                  </ul>
               </div>
               <div>
                 <h4 className="font-label font-bold uppercase tracking-widest text-xs mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="/termos" className="hover:text-primary transition-colors">Termos de Serviço</a></li>
                    <li><a href="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
                    <li><a href="#" className="hover:text-primary transition-colors">RGPD</a></li>
                  </ul>
               </div>
               <div>
                 <h4 className="font-label font-bold uppercase tracking-widest text-xs mb-4">Contacto</h4>
                  <p className="text-sm text-muted-foreground">suporte@aldeiasgames.pt</p>
               </div>
             </div>
              <div className="mt-8 pt-8 border-t border-outline-variant/10 text-center text-sm text-muted-foreground">
               © 2026 Aldeias Games. Desenvolvido com ❤️ para Portugal.
             </div>
           </div>
         </div>
       </footer>

      {/* Modal do usuário */}
      <UserMenuModal open={userMenuOpen} onOpenChange={setUserMenuOpen} />
    </>
  );
}
