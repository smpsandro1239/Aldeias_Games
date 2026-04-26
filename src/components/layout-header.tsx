"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoaderScreen } from "@/components/loader-screen";
import { UserMenuModal } from "@/components/user-menu-modal";
import { User, Gamepad2, House, Compass, Wallet, LogOut, Menu, X, BarChart3, Settings, Calendar, Ticket, TrendingUp, LayoutDashboard, Building2, Users } from "lucide-react";

interface LayoutHeaderProps {
  children: React.ReactNode;
}

// Navigation items by role
const navItems = {
  super_admin: [
    { icon: Compass, label: "Painel", path: "/superadmindashboard" },
    { icon: Building2, label: "Aldeias", path: "/superadmindashboard?tab=aldeias" },
    { icon: BarChart3, label: "Stats", path: "/superadmindashboard?tab=analytics" },
    { icon: Settings, label: "Config", path: "/configuracoes" },
  ],
  aldeia_admin: [
    { icon: Compass, label: "Dashboard", path: "/admindashboard" },
    { icon: Calendar, label: "Eventos", path: "/admindashboard?tab=eventos" },
    { icon: Gamepad2, label: "Jogos", path: "/admindashboard?tab=jogos" },
    { icon: Users, label: "Equipa", path: "/admindashboard?tab=users" },
  ],
  vendedor: [
    { icon: LayoutDashboard, label: "Vendas", path: "/vendedordashboard" },
    { icon: Wallet, label: "Pedidos", path: "/vendedordashboard/pedidos" },
    { icon: TrendingUp, label: "Histórico", path: "/vendedordashboard?tab=historico" },
  ],
  user: [
    { icon: Gamepad2, label: "Jogos", path: "/jogos" },
    { icon: Ticket, label: "Prémios", path: "/premios" },
    { icon: User, label: "Perfil", path: "/perfil" },
  ],
};

export function LayoutHeader({ children }: LayoutHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || isLoading) {
    return <LoaderScreen />;
  }

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    if (path === "/") {
      localStorage.clear();
    }
    router.push(path);
  };

  const getRoleNavItems = () => {
    if (!isAuthenticated || !user?.role) return navItems.user;
    return navItems[user.role as keyof typeof navItems] || navItems.user;
  };

  return (
    <>
      {/* Header com navegação integrada */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-outline-variant/20">
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
                 <button onClick={() => router.push("/superadmindashboard")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Painel</button>
              )}
              {isAuthenticated && user?.role === 'aldeia_admin' && (
                 <button onClick={() => router.push("/admindashboard")} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Dashboard</button>
              )}
               <button onClick={() => router.push('/jogos')} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Jogos</button>
              {!isAuthenticated && (
                 <button onClick={() => router.push('/')} className="font-label text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-secondary transition-colors">Início</button>
              )}
            </nav>

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
              {getRoleNavItems().map((item) => {
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
