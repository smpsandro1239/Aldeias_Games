'use client';
import { useState, useEffect, useCallback, useReducer } from "react";
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
import type { Jogo, Aldeia, Evento } from "@/types/project";

// Constants
const ROLE_PATHS = {
  super_admin: "/superadmindashboard",
  aldeia_admin: "/admindashboard",
  vendedor: "/vendedordashboard",
  user: "/clientedashboard",
} as const;

const DEFAULT_ROLE = "user";

// Types
interface LandingEvento {
  id: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  dataInicio: string;
  dataFim: string;
  aldeia?: { nome: string };
}

interface LandingJogo {
  id: string;
  nome: string;
  tipo: string;
  descricao?: string;
  preco: number;
  stockAtual: number;
}

interface LoginFormState {
  email: string;
  password: string;
}

interface RegisterFormState {
  nome: string;
  email: string;
  password: string;
  telefone: string;
}

// Reducer for form state
type FormAction =
  | { type: 'UPDATE_LOGIN'; field: keyof LoginFormState; value: string }
  | { type: 'RESET_LOGIN' }
  | { type: 'UPDATE_REGISTER'; field: keyof RegisterFormState; value: string }
  | { type: 'RESET_REGISTER' };

function formReducer(state: { login: LoginFormState; register: RegisterFormState }, action: FormAction) {
  switch (action.type) {
    case 'UPDATE_LOGIN':
      return { ...state, login: { ...state.login, [action.field]: action.value } };
    case 'RESET_LOGIN':
      return { ...state, login: { email: "", password: "" } };
    case 'UPDATE_REGISTER':
      return { ...state, register: { ...state.register, [action.field]: action.value } };
    case 'RESET_REGISTER':
      return { ...state, register: { nome: "", email: "", password: "", telefone: "" } };
    default:
      return state;
  }
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login, register } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const [formState, dispatchForm] = useReducer(formReducer, {
    login: { email: "", password: "" },
    register: { nome: "", email: "", password: "", telefone: "" }
  });

  const [eventos, setEventos] = useState<LandingEvento[]>([]);
  const [jogos, setJogos] = useState<LandingJogo[]>([]);
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);

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

      // Transform data to match expected types
      if (dataEv.data) {
        const transformedEventos = dataEv.data.map((evento: any) => ({
          ...evento,
          dataInicio: evento.dataInicio ? new Date(evento.dataInicio).toISOString().split('T')[0] : '',
          dataFim: evento.dataFim ? new Date(evento.dataFim).toISOString().split('T')[0] : ''
        }));
        setEventos(transformedEventos);
      }

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
      const targetPath = ROLE_PATHS[user.role as keyof typeof ROLE_PATHS] || ROLE_PATHS.user;
      router.push(targetPath);
    }
  }, [mounted, isAuthenticated, user, router]);

  const doLogin = useCallback(async (email: string, password: string, totpCode?: string) => {
    setIsLoggingIn(true);
    try {
      const result = await login({ email, password, totpCode });

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        return result;
      }

      if (result.success) {
        setLoginModalOpen(false);
        setRequiresTwoFactor(false);
        setTotpCode("");
        dispatchForm({ type: 'RESET_LOGIN' });
        const targetPath = ROLE_PATHS[result.data?.user?.role as keyof typeof ROLE_PATHS] || ROLE_PATHS.user;

        if (typeof window !== 'undefined') {
          window.location.href = targetPath;
        } else {
          router.push(targetPath);
        }
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao fazer login' };
    } finally {
      setIsLoggingIn(false);
    }
  }, [login, router]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(formState.login.email, formState.login.password);
  }, [doLogin, formState.login]);

  const handleTotpSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(formState.login.email, formState.login.password, totpCode);
  }, [doLogin, formState.login, totpCode]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await register({ ...formState.register, role: DEFAULT_ROLE });
    if (result.success) {
      setRegisterModalOpen(false);
      dispatchForm({ type: 'RESET_REGISTER' });
      // Redirecionar para o dashboard correto após registo
      router.push(ROLE_PATHS.user);
    }
  }, [register, formState.register, router]);

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
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden text-foreground">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="font-serif text-2xl text-center">Entrar</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Acede à tua conta para jogar e ganhar prémio
            </DialogDescription>
          </DialogHeader>
          {/* Login Form */}
          <form onSubmit={requiresTwoFactor ? handleTotpSubmit : handleLogin} className="px-8 pb-8 space-y-6">
            <div className="space-y-4">
              {!requiresTwoFactor && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest ml-1">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="teu@email.com"
                      value={formState.login.email}
                      onChange={(e) => dispatchForm({ type: 'UPDATE_LOGIN', field: 'email', value: e.target.value })}
                      required
                      className="bg-background border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50 text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest ml-1">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formState.login.password}
                      onChange={(e) => dispatchForm({ type: 'UPDATE_LOGIN', field: 'password', value: e.target.value })}
                      required
                      className="bg-background border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50 text-foreground"
                    />
                    {/* Esqueci-me da password link */}
                    <div className="text-right mt-1">
                      <a href="/forgot-password" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        Esqueci-me da password
                      </a>
                    </div>
                  </div>
                </>
              )}

              {requiresTwoFactor && (
                <div className="space-y-2">
                  <Label htmlFor="totpCode" className="text-xs font-bold uppercase tracking-widest ml-1">Código 2FA</Label>
                  <Input
                    id="totpCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    className="bg-background border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50 text-foreground text-center text-lg tracking-[0.5em]"
                  />
                  <p className="text-[10px] text-muted-foreground text-center">
                    Introduza o código de 6 dígitos da sua aplicação autenticadora
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 flex-col gap-4">
              <div className="flex gap-2 w-full">
                {requiresTwoFactor ? (
                  <Button type="button" variant="outline" onClick={() => { setRequiresTwoFactor(false); setTotpCode(""); }} className="flex-1 bg-transparent border-outline-variant/20 text-foreground">
                    Voltar
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setLoginModalOpen(false)} className="flex-1 bg-transparent border-outline-variant/20 text-foreground">
                    Cancelar
                  </Button>
                )}
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold" disabled={isLoggingIn}>
                  <Zap className="h-4 w-4 mr-2" />
                  {isLoggingIn ? 'Entrando...' : requiresTwoFactor ? 'Verificar Código' : 'Entrar'}
                </Button>
              </div>
            </DialogFooter>

            {/* Divider */}
            {!requiresTwoFactor && (
              <>
                <div className="flex items-center my-6">
                  <div className="w-1 bg-outline-variant/20 flex-1"></div>
                  <span className="px-3 text-[10px] text-muted-foreground">ou continue com</span>
                  <div className="w-1 bg-outline-variant/20 flex-1"></div>
                </div>

            {/* Social Login Buttons */}
            <div className="pt-4 space-y-3">
              {/* Google Login Button */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3"
                  onClick={() => {
                    window.location.href = "/api/auth/google";
                  }}
                  disabled={isLoggingIn}
                >
                  <span className="flex items-center gap-2">
                    {/* Ícone oficial do Google */}
                    <img src="https://fonts.gstatic.com/s/i/googlematerialicons/gm6_2024Q2/googlelogo_color_72x24dp.png"
                         alt="Google"
                         className="h-4 w-auto"
                         onError={(e) => {
                           // Fallback em caso de falha ao carregar o ícone
                           (e.target as HTMLImageElement).src = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_72x24dp.png";
                         }}
                    />
                    <span className="text-xs font-medium">{isLoggingIn ? 'Entrando...' : 'Continuar com o Google'}</span>
                  </span>
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  ou usa o teu e-mail e palavra-passe
                </p>
              </div>

              {/* Apple Login Button */}
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-3"
                  onClick={() => {
                    window.location.href = "/api/auth/apple";
                  }}
                  disabled={isLoggingIn}
                >
                  <span className="flex items-center gap-2">
                    {/* Apple Logo */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L14.5 8.25H22L15 12.75L17.5 20H12L8.5 12.75L1.5 8.25H9L12 2Z" fill="currentColor"/>
                    </svg>
                    <span className="text-xs font-medium">{isLoggingIn ? 'Entrando...' : 'Continuar com a Apple'}</span>
                  </span>
                </Button>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  ou usa o teu e-mail e palavra-passe
                </p>
              </div>
            </div>
            </>
            )}

            {/* Botões de Atalho para Testes (apenas dev) */}
              {process.env.NODE_ENV !== 'production' && (
                <div className="pt-4 border-t border-outline-variant/10 w-full">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 text-center">Acesso Rápido (Dev Mode)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-[10px] h-8 bg-surface-container-low text-foreground"
                      onClick={async () => {
                        await doLogin("admin@aldeias.pt", "123456");
                      }}
                    >
                      Super Admin
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-[10px] h-8 bg-surface-container-low text-foreground"
                      onClick={async () => {
                        await doLogin("admin.valeazinha@aldeias.pt", "123456");
                      }}
                    >
                      Admin Aldeia
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-[10px] h-8 bg-surface-container-low text-foreground"
                      onClick={async () => {
                        await doLogin("vendedor1@valeazinha.pt", "123456");
                      }}
                    >
                      Vendedor
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="text-[10px] h-8 bg-surface-container-low text-foreground"
                      onClick={async () => {
                        await doLogin("jogador1@valeazinha.pt", "123456");
                      }}
                    >
                      Jogador
                    </Button>
                  </div>
                </div>
              )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden text-foreground">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="font-serif text-2xl text-center">Criar Conta</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
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
                  value={formState.register.nome}
                  onChange={(e) => dispatchForm({ type: 'UPDATE_REGISTER', field: 'nome', value: e.target.value })}
                  required
                  className="bg-background border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-xs font-bold uppercase tracking-widest ml-1">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="teu@email.com"
                  value={formState.register.email}
                  onChange={(e) => dispatchForm({ type: 'UPDATE_REGISTER', field: 'email', value: e.target.value })}
                  required
                  className="bg-background border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-xs font-bold uppercase tracking-widest ml-1">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formState.register.password}
                  onChange={(e) => dispatchForm({ type: 'UPDATE_REGISTER', field: 'password', value: e.target.value })}
                  required
                  minLength={8}
                  className="bg-background border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-xs font-bold uppercase tracking-widest ml-1">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="+351 9XX XXX XXX"
                  value={formState.register.telefone}
                  onChange={(e) => dispatchForm({ type: 'UPDATE_REGISTER', field: 'telefone', value: e.target.value })}
                  className="bg-background border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50 text-foreground"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setRegisterModalOpen(false)} className="flex-1 bg-transparent border-outline-variant/20 text-foreground">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold">
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