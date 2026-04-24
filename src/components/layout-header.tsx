"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoaderScreen } from "@/components/loader-screen";
import { UserMenuModal } from "@/components/user-menu-modal";
import { Zap, Rocket, User, Gamepad2, House, Compass, Wallet, LogOut } from "lucide-react";

interface LayoutHeaderProps {
  children: React.ReactNode;
}

export function LayoutHeader({ children }: LayoutHeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUserMenuOpen(false);
  }, [logout]);

  if (!isMounted || isLoading) {
    return <LoaderScreen />;
  }

  return (
    <>
      {/* Header com navegação integrada */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <House className="h-8 w-8 text-[#ff734b]" />
              <span className="font-serif italic text-[#ff734b] text-lg font-bold">
                Aldeias Games
              </span>
            </button>
          </div>

          {/* BottomNav integrado no header (visível apenas em mobile) */}
          <div className="flex items-center gap-2">
            {/* Navegação mobile - ícones sem texto */}
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => router.push("/jogos")}
                  className="flex flex-col items-center justify-center text-[#e0bfb7] px-2 py-1"
                >
                  <Gamepad2 className="h-5 w-5" />
                </button>
                {user?.role === 'vendedor' && (
                  <button
                    onClick={() => router.push("/vendedordashboard")}
                    className="flex flex-col items-center justify-center text-[#e0bfb7] px-2 py-1"
                  >
                    <Wallet className="h-5 w-5" />
                  </button>
                )}
                {user?.role === 'aldeia_admin' && (
                  <button
                    onClick={() => router.push("/admindashboard")}
                    className="flex flex-col items-center justify-center text-[#e0bfb7] px-2 py-1"
                  >
                    <Compass className="h-5 w-5" />
                  </button>
                )}
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => router.push("/superadmindashboard")}
                    className="flex flex-col items-center justify-center text-[#e0bfb7] px-2 py-1"
                  >
                    <Compass className="h-5 w-5" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => router.push("/jogos")}
                className="flex flex-col items-center justify-center text-[#e0bfb7] px-2 py-1"
              >
                <Gamepad2 className="h-5 w-5" />
              </button>
            )}

            {/* User menu */}
            <div className="w-9 h-9 rounded-full bg-[#2e2928] overflow-hidden border border-[#ff734b]/20 relative ml-2">
              {isAuthenticated && user ? (
                <button
                  onClick={() => setUserMenuOpen(true)}
                  className="w-full h-full bg-[#ff734b]/20 flex items-center justify-center hover:bg-[#ff734b]/30 transition-colors"
                >
                  <User className="h-4 w-4 text-[#ff734b]" />
                </button>
              ) : (
                <button
                  onClick={() => router.push("/")}
                  className="w-full h-full flex items-center justify-center text-[#ff734b] font-bold text-lg"
                >
                  +
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navegação desktop (apenas em telas maiores) */}
        <div className="hidden md:flex justify-center gap-8 pb-3">
          <button
            onClick={() => document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth' })}
            className="font-label text-xs font-bold tracking-widest uppercase text-[#e0bfb7] hover:text-[#9cefff] transition-colors"
          >
            Eventos
          </button>
          <button
            onClick={() => document.getElementById('aldeias')?.scrollIntoView({ behavior: 'smooth' })}
            className="font-label text-xs font-bold tracking-widest uppercase text-[#9cefff] transition-colors"
          >
            Aldeias
          </button>
          <button
            onClick={() => router.push('/jogos')}
            className="font-label text-xs font-bold tracking-widest uppercase text-[#e0bfb7] hover:text-[#9cefff] transition-colors"
          >
            Jogos
          </button>
        </div>
      </header>

      {/* Espaçador para o conteúdo não ficar por baixo do header */}
      <div className="h-16" />

      {/* Conteúdo principal */}
      <main className="min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#58413b]/10 py-12 bg-[#110d0c]">
        <div className="container max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <House className="h-8 w-8 text-[#ff734b]" />
                <span className="font-serif text-xl font-bold text-[#ff734b]">Aldeias Games</span>
              </div>
              <p className="text-sm text-[#e0bfb7]">A plataforma de angariação de fundos para comunidades locais portuguesas.</p>
            </div>
            <div>
              <h4 className="font-label font-bold uppercase tracking-widest text-xs mb-4">Navegação</h4>
              <ul className="space-y-2 text-sm text-[#e0bfb7]">
                <li><button onClick={() => document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#ff734b] transition-colors">Eventos</button></li>
                <li><button onClick={() => router.push('/jogos')} className="hover:text-[#ff734b] transition-colors">Jogos</button></li>
                <li><button onClick={() => document.getElementById('aldeias')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#ff734b] transition-colors">Aldeias</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-label font-bold uppercase tracking-widest text-xs mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-[#e0bfb7]">
                <li><a href="/termos" className="hover:text-[#ff734b] transition-colors">Termos de Serviço</a></li>
                <li><a href="/privacidade" className="hover:text-[#ff734b] transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-[#ff734b] transition-colors">RGPD</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-label font-bold uppercase tracking-widest text-xs mb-4">Contacto</h4>
              <p className="text-sm text-[#e0bfb7]">suporte@aldeiasgames.pt</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#58413b]/10 text-center text-sm text-[#e0bfb7]">
            © 2026 Aldeias Games. Desenvolvido com ❤️ para Portugal.
          </div>
        </div>
      </footer>

      {/* Modal do usuário */}
      <UserMenuModal open={userMenuOpen} onOpenChange={setUserMenuOpen} />
    </>
  );
}
