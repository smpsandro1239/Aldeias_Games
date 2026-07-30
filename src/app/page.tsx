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
  aldeiaId: string;
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
      return { ...state, register: { nome: "", email: "", password: "", telefone: "", aldeiaId: "" } };
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
    register: { nome: "", email: "", password: "", telefone: "", aldeiaId: "" }
  });
  const [registerFieldErrors, setRegisterFieldErrors] = useState<Record<string, string>>({});

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
    setRegisterFieldErrors({});
    const result = await register({ ...formState.register, role: DEFAULT_ROLE });
    if (result.success) {
      setRegisterModalOpen(false);
      dispatchForm({ type: 'RESET_REGISTER' });
      setRegisterFieldErrors({});
      router.push(ROLE_PATHS.user);
    } else if (result.fieldErrors) {
      setRegisterFieldErrors(result.fieldErrors as Record<string, string>);
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
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 text-foreground">
          <DialogHeader className="p-4 sm:p-8 pb-3 sm:pb-4">
            <DialogTitle className="font-serif text-xl sm:text-2xl text-center">Entrar</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-xs sm:text-sm">
              Acede à tua conta para jogar e ganhar prémio
            </DialogDescription>
          </DialogHeader>
          {/* Login Form */}
          <form onSubmit={requiresTwoFactor ? handleTotpSubmit : handleLogin} className="px-4 sm:px-8 pb-5 sm:pb-8 space-y-4 sm:space-y-6">
            <div className="space-y-3">
              {!requiresTwoFactor && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest ml-1">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="teu@email.com"
                      value={formState.login.email}
                      onChange={(e) => dispatchForm({ type: 'UPDATE_LOGIN', field: 'email', value: e.target.value })}
                      required
                      className="bg-background border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 focus:ring-2 focus:ring-secondary/50 text-foreground text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest ml-1">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formState.login.password}
                      onChange={(e) => dispatchForm({ type: 'UPDATE_LOGIN', field: 'password', value: e.target.value })}
                      required
                      className="bg-background border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 focus:ring-2 focus:ring-secondary/50 text-foreground text-sm sm:text-base"
                    />
                    <div className="text-right mt-0.5">
                      <a href="/forgot-password" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                        Esqueci-me da password
                      </a>
                    </div>
                  </div>
                </>
              )}

              {requiresTwoFactor && (
                <div className="space-y-1.5">
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
                    className="bg-background border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 focus:ring-2 focus:ring-secondary/50 text-foreground text-center text-lg tracking-[0.5em]"
                  />
                  <p className="text-[10px] text-muted-foreground text-center">
                    Introduza o código de 6 dígitos da sua aplicação autenticadora
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 sm:mt-6 flex-col gap-3 sm:gap-4">
              <div className="flex gap-2 w-full">
                {requiresTwoFactor ? (
                  <Button type="button" variant="outline" onClick={() => { setRequiresTwoFactor(false); setTotpCode(""); }} className="flex-1 bg-transparent border-outline-variant/20 text-foreground h-10 sm:h-11 text-sm">
                    Voltar
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setLoginModalOpen(false)} className="flex-1 bg-transparent border-outline-variant/20 text-foreground h-10 sm:h-11 text-sm">
                    Cancelar
                  </Button>
                )}
                <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold h-10 sm:h-11 text-sm" disabled={isLoggingIn}>
                  <Zap className="h-4 w-4 mr-2" />
                  {isLoggingIn ? 'Entrando...' : requiresTwoFactor ? 'Verificar Código' : 'Entrar'}
                </Button>
              </div>
            </DialogFooter>

            {/* Divider */}
            {!requiresTwoFactor && (
              <>
                <div className="flex items-center my-3 sm:my-6">
                  <div className="w-1 bg-outline-variant/20 flex-1"></div>
                  <span className="px-3 text-[10px] text-muted-foreground">ou continue com</span>
                  <div className="w-1 bg-outline-variant/20 flex-1"></div>
                </div>

            {/* Social Login Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-10 sm:h-11 text-sm"
                onClick={() => { window.location.href = "/api/auth/google"; }}
                disabled={isLoggingIn}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span className="font-medium">{isLoggingIn ? 'Entrando...' : 'Continuar com o Google'}</span>
              </Button>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-3 h-10 sm:h-11 text-sm"
                onClick={() => { window.location.href = "/api/auth/apple"; }}
                disabled={isLoggingIn}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span className="font-medium">{isLoggingIn ? 'Entrando...' : 'Continuar com a Apple'}</span>
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                ou usa o teu e-mail e palavra-passe
              </p>
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
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 text-foreground">
          <DialogHeader className="p-4 sm:p-8 pb-3 sm:pb-4">
            <DialogTitle className="font-serif text-xl sm:text-2xl text-center">Criar Conta</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-xs sm:text-sm">
              Regista-te para participar nos jogos e campanhas
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRegister} className="px-4 sm:px-8 pb-5 sm:pb-8">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-xs font-bold uppercase tracking-widest ml-1">Nome</Label>
                <Input
                  id="nome"
                  placeholder="O teu nome"
                  value={formState.register.nome}
                  onChange={(e) => { dispatchForm({ type: 'UPDATE_REGISTER', field: 'nome', value: e.target.value }); setRegisterFieldErrors(prev => { const next = { ...prev }; delete next.nome; return next; }); }}
                  required
                  className="bg-background border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 focus:ring-2 focus:ring-secondary/50 text-foreground text-sm sm:text-base"
                />
                {registerFieldErrors.nome && <p className="text-xs text-destructive ml-1">{registerFieldErrors.nome}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-email" className="text-xs font-bold uppercase tracking-widest ml-1">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="teu@email.com"
                  value={formState.register.email}
                  onChange={(e) => { dispatchForm({ type: 'UPDATE_REGISTER', field: 'email', value: e.target.value }); setRegisterFieldErrors(prev => { const next = { ...prev }; delete next.email; return next; }); }}
                  required
                  className="bg-background border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 focus:ring-2 focus:ring-secondary/50 text-foreground text-sm sm:text-base"
                />
                {registerFieldErrors.email && <p className="text-xs text-destructive ml-1">{registerFieldErrors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-password" className="text-xs font-bold uppercase tracking-widest ml-1">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Mín. 12 chars, 1 maiúscula, 1 número, 1 especial"
                  value={formState.register.password}
                  onChange={(e) => { dispatchForm({ type: 'UPDATE_REGISTER', field: 'password', value: e.target.value }); setRegisterFieldErrors(prev => { const next = { ...prev }; delete next.password; return next; }); }}
                  required
                  className="bg-background border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 focus:ring-2 focus:ring-secondary/50 text-foreground text-sm sm:text-base"
                />
                {registerFieldErrors.password && <p className="text-xs text-destructive ml-1">{registerFieldErrors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-xs font-bold uppercase tracking-widest ml-1">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="+351 9XX XXX XXX"
                  value={formState.register.telefone}
                  onChange={(e) => { dispatchForm({ type: 'UPDATE_REGISTER', field: 'telefone', value: e.target.value }); setRegisterFieldErrors(prev => { const next = { ...prev }; delete next.telefone; return next; }); }}
                  className="bg-background border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 focus:ring-2 focus:ring-secondary/50 text-foreground text-sm sm:text-base"
                />
                {registerFieldErrors.telefone && <p className="text-xs text-destructive ml-1">{registerFieldErrors.telefone}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-aldeia" className="text-xs font-bold uppercase tracking-widest ml-1">Aldeia *</Label>
                <select
                  id="register-aldeia"
                  value={formState.register.aldeiaId}
                  onChange={(e) => { dispatchForm({ type: 'UPDATE_REGISTER', field: 'aldeiaId', value: e.target.value }); setRegisterFieldErrors(prev => { const next = { ...prev }; delete next.aldeiaId; return next; }); }}
                  required
                  className="w-full bg-background border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 text-foreground text-sm sm:text-base focus:ring-2 focus:ring-secondary/50"
                >
                  <option value="">Selecione a sua aldeia</option>
                  {aldeias.map((aldeia) => (
                    <option key={aldeia.id} value={aldeia.id}>{aldeia.nome}</option>
                  ))}
                </select>
                {registerFieldErrors.aldeiaId && <p className="text-xs text-destructive ml-1">{registerFieldErrors.aldeiaId}</p>}
              </div>
            </div>

            <DialogFooter className="mt-4 sm:mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setRegisterModalOpen(false)} className="flex-1 bg-transparent border-outline-variant/20 text-foreground h-10 sm:h-11 text-sm">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold h-10 sm:h-11 text-sm">
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