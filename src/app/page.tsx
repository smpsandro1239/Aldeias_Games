"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutHeader } from "@/components/layout-header";
import { useAuth } from "@/hooks/use-auth";
import { SplashScreen } from "@/components/splash-screen";
import { LandingPage } from "@/components/landing-page";
import { LoaderScreen } from "@/components/loader-screen";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Zap, Rocket } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, register } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

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
    return <SplashScreen onLoginClick={() => { setHasEntered(true); setLoginModalOpen(true); }} />;
  }

  return (
    <>
      <LayoutHeader>
        <main className="pt-24 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
          <LandingPage
            jogos={jogos}
            eventos={eventos}
            aldeias={aldeias}
            onLoginClick={() => setLoginModalOpen(true)}
            onRegisterClick={() => setRegisterModalOpen(true)}
          />
        </main>
      </LayoutHeader>

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
                    onClick={() => setLoginForm({ email: "admin@aldeias.pt", password: "123456" })}
                  >
                    Super Admin
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-[10px] h-8 bg-[#2e2928] text-[#eae0de]"
                    onClick={() => setLoginForm({ email: "admin.valeazinha@aldeias.pt", password: "123456" })}
                  >
                    Admin Aldeia
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-[10px] h-8 bg-[#2e2928] text-[#eae0de]"
                    onClick={() => setLoginForm({ email: "vendedor.valeazinha@aldeias.pt", password: "123456" })}
                  >
                    Vendedor
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-[10px] h-8 bg-[#2e2928] text-[#eae0de]"
                    onClick={() => setLoginForm({ email: "jogador1@email.pt", password: "123456" })}
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
    </>
  );
}
