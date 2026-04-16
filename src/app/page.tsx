"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { SplashScreen } from "@/components/splash-screen";
import { LandingPage } from "@/components/landing-page";
import { LoaderScreen } from "@/components/loader-screen";
import { UserMenuModal } from "@/components/user-menu-modal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Rocket, Menu, User, Gamepad2, House, Compass, Wallet } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();
  
  const [mounted, setMounted] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    nome: "",
    email: "",
    password: "",
    telefone: ""
  });

  const [eventos, setEventos] = useState([]);
  const [jogos, setJogos] = useState([]);
  const [aldeias, setAldeias] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [resEv, resJo, resAl] = await Promise.all([
        fetch("/api/eventos?publico=true"),
        fetch("/api/jogos?ativos=true"),
        fetch("/api/aldeias")
      ]);
      const [dataEv, dataJo, dataAl] = await Promise.all([
        resEv.json(),
        resJo.json(),
        resAl.json()
      ]);
      if (dataEv.data) setEventos(dataEv.data);
      if (dataJo.data) setJogos(dataJo.data);
      if (dataAl.data) setAldeias(dataAl.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  // Redirecionamento automático se já estiver logado
  useEffect(() => {
    if (mounted && isAuthenticated && user) {
      const rolePaths: Record<string, string> = {
        "super_admin": "/superadmindashboard",
        "aldeia_admin": "/admindashboard",
        "vendedor": "/vendedordashboard",
        "user": "/clientedashboard"
      };
      router.push(rolePaths[user.role] || "/clientedashboard");
    }
  }, [mounted, isAuthenticated, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(loginForm);
    if (result.success) {
      setLoginModalOpen(false);
      setLoginForm({ email: "", password: "" });
      // Redirecionar para o dashboard correto após login
      const rolePaths: Record<string, string> = {
        "super_admin": "/superadmindashboard",
        "aldeia_admin": "/admindashboard",
        "vendedor": "/vendedordashboard",
        "user": "/clientedashboard"
      };
      router.push(rolePaths[result.data?.user?.role] || "/clientedashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await register({ ...registerForm, role: "user" });
    if (result.success) {
      setRegisterModalOpen(false);
      setRegisterForm({ nome: "", email: "", password: "", telefone: "" });
      // Redirecionar para o dashboard correto após registo
      router.push("/clientedashboard");
    }
  };

  if (!mounted || isLoading) return <LoaderScreen />;

  if (!hasEntered && !isAuthenticated) {
    return <SplashScreen onEnter={() => setHasEntered(true)} onLoginClick={() => { setHasEntered(true); setLoginModalOpen(true); }} />;
  }

  return (
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-4">
            <Menu className="text-[#ff734b] text-2xl cursor-pointer hover:opacity-80 transition-opacity" />
            <div className="flex items-center gap-2">
              <House className="h-8 w-8 text-[#ff734b]" />
              <h1 className="font-serif text-xl font-bold text-[#ff734b] tracking-tight italic">Aldeias Games</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-6">
              <button onClick={() => document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth' })} className="font-label text-xs font-bold tracking-widest uppercase text-[#e0bfb7] hover:text-[#9cefff] transition-colors">Eventos</button>
              <button onClick={() => document.getElementById('aldeias')?.scrollIntoView({ behavior: 'smooth' })} className="font-label text-xs font-bold tracking-widest uppercase text-[#9cefff] transition-colors">Aldeias</button>
              <button onClick={() => router.push('/jogos')} className="font-label text-xs font-bold tracking-widest uppercase text-[#e0bfb7] hover:text-[#9cefff] transition-colors">Competir</button>
            </nav>
            <div className="w-10 h-10 rounded-full bg-[#2e2928] overflow-hidden border-2 border-[#ff734b]/20 relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setUserMenuOpen(true)}
                  className="w-full h-full bg-[#ff734b]/20 flex items-center justify-center hover:bg-[#ff734b]/30 transition-colors"
                >
                  <User className="h-5 w-5 text-[#ff734b]" />
                </button>
              ) : (
                <button onClick={() => setLoginModalOpen(true)} className="w-full h-full flex items-center justify-center text-[#ff734b] font-bold text-lg">
                  +
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
        <LandingPage 
          jogos={jogos} 
          eventos={eventos} 
          aldeias={aldeias} 
          onLoginClick={() => setLoginModalOpen(true)} 
          onRegisterClick={() => setRegisterModalOpen(true)} 
        />
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

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-[#1a1614]/80 backdrop-blur-2xl z-50 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.4)] md:hidden">
        <button onClick={() => document.getElementById('aldeias')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center justify-center text-[#9cefff] bg-[#9cefff]/10 rounded-2xl px-4 py-2 scale-110 transition-all">
          <House className="h-6 w-6" style={{ fill: 'currentColor' }} />
          <span className="font-label text-[10px] font-bold tracking-widest uppercase mt-1">Aldeias</span>
        </button>
        <button onClick={() => router.push('/jogos')} className="flex flex-col items-center justify-center text-[#e0bfb7] opacity-70 hover:opacity-100 transition-all">
          <Gamepad2 className="h-6 w-6" />
          <span className="font-label text-[10px] font-bold tracking-widest uppercase mt-1">Competir</span>
        </button>
        <button onClick={() => isAuthenticated ? setUserMenuOpen(true) : setLoginModalOpen(true)} className="flex flex-col items-center justify-center text-[#e0bfb7] opacity-70 hover:opacity-100 transition-all">
          <Wallet className="h-6 w-6" />
          <span className="font-label text-[10px] font-bold tracking-widest uppercase mt-1">{isAuthenticated ? 'Ver Saldo' : 'Carteira'}</span>
        </button>
      </div>

      <UserMenuModal open={userMenuOpen} onOpenChange={setUserMenuOpen} />

      {/* Login Modal */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#1a1614] border border-[#58413b]/10 p-0 overflow-hidden text-[#eae0de]">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="font-serif text-2xl text-center">Entrar</DialogTitle>
            <DialogDescription className="text-center text-[#e0bfb7]">
              Acede à tua conta para jogar e ganhar prémios
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="px-8 pb-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                  className="bg-[#110d0c] border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-[#9cefff]/50 text-[#eae0de]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest ml-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  className="bg-[#110d0c] border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-[#9cefff]/50 text-[#eae0de]"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 flex-col gap-4">
              <div className="flex gap-2 w-full">
                <Button type="button" variant="outline" onClick={() => setLoginModalOpen(false)} className="flex-1 bg-transparent border-[#58413b]/20 text-[#eae0de]">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-[#ff734b] text-[#110d0c] font-bold">
                  <Zap className="h-4 w-4 mr-2" />
                  Entrar
                </Button>
              </div>

              {/* Botões de Atalho para Testes (Quick Login) */}
              <div className="pt-4 border-t border-[#58413b]/10 w-full">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#e0bfb7] mb-3 text-center">Acesso Rápido (Dev Mode)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    className="text-[10px] h-8 bg-[#2e2928] text-[#eae0de]"
                    onClick={() => setLoginForm({ email: "admin@aldeias.pt", password: "123" })}
                  >
                    Super Admin
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    className="text-[10px] h-8 bg-[#2e2928] text-[#eae0de]"
                    onClick={() => setLoginForm({ email: "aldeia@gmail.com", password: "123" })}
                  >
                    Admin Aldeia
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    className="text-[10px] h-8 bg-[#2e2928] text-[#eae0de]"
                    onClick={() => setLoginForm({ email: "vendedor@gmail.com", password: "123" })}
                  >
                    Vendedor
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    className="text-[10px] h-8 bg-[#2e2928] text-[#eae0de]"
                    onClick={() => setLoginForm({ email: "smpsandro1239@gmail.com", password: "123" })}
                  >
                    Jogador
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#1a1614] border border-[#58413b]/10 p-0 overflow-hidden text-[#eae0de]">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="font-serif text-2xl text-center">Criar Conta</DialogTitle>
            <DialogDescription className="text-center text-[#e0bfb7]">
              Regista-te para participar nos jogos e campanhas
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="px-8 pb-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-xs font-bold uppercase tracking-widest ml-1">Nome</Label>
                <Input
                  id="nome"
                  placeholder="O teu nome"
                  value={registerForm.nome}
                  onChange={(e) => setRegisterForm({ ...registerForm, nome: e.target.value })}
                  required
                  className="bg-[#110d0c] border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-[#9cefff]/50 text-[#eae0de]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-xs font-bold uppercase tracking-widest ml-1">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="teu@email.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                  className="bg-[#110d0c] border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-[#9cefff]/50 text-[#eae0de]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-xs font-bold uppercase tracking-widest ml-1">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                  minLength={8}
                  className="bg-[#110d0c] border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-[#9cefff]/50 text-[#eae0de]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-xs font-bold uppercase tracking-widest ml-1">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="+351 9XX XXX XXX"
                  value={registerForm.telefone}
                  onChange={(e) => setRegisterForm({ ...registerForm, telefone: e.target.value })}
                  className="bg-[#110d0c] border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-[#9cefff]/50 text-[#eae0de]"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setRegisterModalOpen(false)} className="flex-1 bg-transparent border-[#58413b]/20 text-[#eae0de]">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-[#ff734b] text-[#110d0c] font-bold">
                <Rocket className="h-4 w-4 mr-2" />
                Registar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
