"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Gamepad2, 
  Users, 
  Building2, 
  Trophy, 
  CreditCard, 
  Shield, 
  Moon, 
  Sun,
  Menu,
  X,
  LogOut,
  User,
  Bell
} from "lucide-react";
import { useTheme } from "next-themes";
import { AdminDashboard } from "@/features/admin/admin-dashboard";
import { ClienteDashboard } from "@/features/cliente/cliente-dashboard";
import { VendedorDashboard } from "@/features/vendedor/vendedor-dashboard";

// Tipos
interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
}

interface Aldeia {
  id: string;
  nome: string;
  slug: string;
  tipoOrganizacao: string;
  logoUrl?: string;
}

interface Evento {
  id: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  dataInicio: string;
  dataFim: string;
  estado: string;
  publico: boolean;
  aldeia?: Aldeia;
}

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  descricao?: string;
  preco: number;
  stockAtual: number;
  estado: string;
  evento?: Evento;
  premio?: {
    nome: string;
    imagemUrl?: string;
  };
}

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Estados de autenticação
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de UI
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estados de formulários
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    nome: "", 
    email: "", 
    password: "", 
    telefone: "" 
  });
  
  // Estados de dados
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Verificar token no localStorage
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    setLoading(false);
    
    // Carregar dados públicos
    fetchEventos();
    fetchJogos();
    fetchAldeias();
  }, []);

  // API Calls
  const fetchEventos = async () => {
    try {
      const response = await fetch("/api/eventos?publico=true");
      const data = await response.json();
      if (data.data) {
        setEventos(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  };

  const fetchJogos = async () => {
    try {
      const response = await fetch("/api/jogos?ativos=true");
      const data = await response.json();
      if (data.data) {
        setJogos(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar jogos:", error);
    }
  };

  const fetchAldeias = async () => {
    try {
      const response = await fetch("/api/aldeias");
      const data = await response.json();
      if (data.data) {
        setAldeias(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar aldeias:", error);
    }
  };

  // Handlers de autenticação
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setLoginModalOpen(false);
        setLoginForm({ email: "", password: "" });
        toast.success("Login bem-sucedido!");
      } else {
        toast.error(data.error || "Erro ao fazer login");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...registerForm, role: "user" }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setRegisterModalOpen(false);
        setRegisterForm({ nome: "", email: "", password: "", telefone: "" });
        toast.success("Registo bem-sucedido!");
      } else {
        toast.error(data.error || "Erro ao registar");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout efetuado!");
  };

  // Quick login para testes
  const quickLogin = async (email: string, password: string) => {
    setLoginForm({ email, password });
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setLoginModalOpen(false);
        toast.success(`Bem-vindo, ${data.user.nome}!`);
      }
    } catch (error) {
      toast.error("Erro no quick login");
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a href="/" className="mr-6 flex items-center space-x-2">
              <Gamepad2 className="h-6 w-6" />
              <span className="font-bold">Aldeias Games</span>
            </a>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
            <a href="#eventos" className="transition-colors hover:text-foreground/80">
              Eventos
            </a>
            <a href="#jogos" className="transition-colors hover:text-foreground/80">
              Jogos
            </a>
            <a href="#aldeias" className="transition-colors hover:text-foreground/80">
              Aldeias
            </a>
          </nav>
          
          <div className="flex flex-1 items-center justify-end space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            {user ? (
              <>
                <span className="hidden md:inline text-sm text-muted-foreground">
                  Olá, {user.nome.split(" ")[0]}
                </span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setLoginModalOpen(true)}>
                  Entrar
                </Button>
                <Button onClick={() => setRegisterModalOpen(true)}>
                  Registar
                </Button>
              </>
            )}
            
            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t p-4">
            <nav className="flex flex-col space-y-4">
              <a href="#eventos" onClick={() => setMobileMenuOpen(false)}>
                Eventos
              </a>
              <a href="#jogos" onClick={() => setMobileMenuOpen(false)}>
                Jogos
              </a>
              <a href="#aldeias" onClick={() => setMobileMenuOpen(false)}>
                Aldeias
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {user ? (
          <div className="space-y-8">
            {/* Role-based Dashboard */}
            {(user.role === "super_admin" || user.role === "aldeia_admin") && (
              <AdminDashboard 
                token={token || ""} 
                aldeiaId={user.aldeiaId} 
                userRole={user.role} 
              />
            )}
            {user.role === "vendedor" && (
              <VendedorDashboard token={token || ""} />
            )}
            {user.role === "user" && (
              <ClienteDashboard token={token || ""} />
            )}
          </div>
        ) : (
          <>
            {/* Hero Section - Only shown when not logged in */}
            <section className="py-12 md:py-24 lg:py-32">
              <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
                <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl">
                  Angariação de Fundos
                  <br className="hidden sm:inline" />
                  <span className="text-primary"> Digital e Divertida</span>
                </h1>
                <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
                  Plataforma completa para aldeias, escolas e associações realizarem
                  campanhas de angariação através de jogos tradicionais digitalizados.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" onClick={() => setRegisterModalOpen(true)}>
                    Começar Agora
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => document.getElementById("jogos")?.scrollIntoView()}>
                    Ver Jogos
                  </Button>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section className="py-12">
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <Trophy className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Jogos Tradicionais</CardTitle>
                    <CardDescription>
                      Poio da Vaca, Rifas, Tombolas e Raspadinhas digitais com experiência imersiva.
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CreditCard className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Pagamentos Seguros</CardTitle>
                    <CardDescription>
                      Integração com Stripe e MBWay real para pagamentos rápidos e seguros.
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <Card>
                  <CardHeader>
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Sorteios Auditáveis</CardTitle>
                    <CardDescription>
                      Algoritmos SHA-256 garantem transparência e justiça em todos os sorteios.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Eventos Section */}
      <section id="eventos" className="container py-12">
        <h2 className="text-3xl font-bold mb-6">Eventos em Destaque</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eventos.slice(0, 6).map((evento) => (
            <Card key={evento.id}>
              {evento.imagemUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={evento.imagemUrl}
                    alt={evento.nome}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{evento.nome}</CardTitle>
                <CardDescription>
                  {evento.aldeia?.nome}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {evento.descricao}
                </p>
                <p className="text-sm mt-2">
                  {new Date(evento.dataInicio).toLocaleDateString("pt-PT")} -{" "}
                  {new Date(evento.dataFim).toLocaleDateString("pt-PT")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Jogos Section */}
      <section id="jogos" className="container py-12">
        <h2 className="text-3xl font-bold mb-6">Jogos Disponíveis</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {jogos.slice(0, 8).map((jogo) => (
            <Card key={jogo.id}>
              <CardHeader>
                <CardTitle className="text-lg">{jogo.nome}</CardTitle>
                <CardDescription className="capitalize">
                  {jogo.tipo.replace("_", " ")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {jogo.preco.toFixed(2)}€
                </p>
                {jogo.premio && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Prémio: {jogo.premio.nome}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Stock: {jogo.stockAtual} disponíveis
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Aldeias Section */}
      <section id="aldeias" className="container py-12">
        <h2 className="text-3xl font-bold mb-6">Organizações</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {aldeias.slice(0, 8).map((aldeia) => (
            <Card key={aldeia.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                {aldeia.logoUrl ? (
                  <img
                    src={aldeia.logoUrl}
                    alt={aldeia.nome}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-lg">{aldeia.nome}</CardTitle>
                  <CardDescription className="capitalize">
                    {aldeia.tipoOrganizacao.replace("_", " ")}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Gamepad2 className="h-6 w-6" />
                <span className="font-bold">Aldeias Games</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Plataforma de angariação de fundos para comunidades locais portuguesas.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#eventos">Eventos</a></li>
                <li><a href="#jogos">Jogos</a></li>
                <li><a href="#aldeias">Aldeias</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#">Termos de Serviço</a></li>
                <li><a href="#">Política de Privacidade</a></li>
                <li><a href="#">RGPD</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <p className="text-sm text-muted-foreground">
                suporte@aldeiasgames.pt
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 Aldeias Games. Desenvolvido com ❤️ para Portugal.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Sessão</DialogTitle>
            <DialogDescription>
              Entre com as suas credenciais para aceder à plataforma.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleLogin}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              
              {/* Quick Login para testes */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Quick Login (Testes):</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin("admin@aldeias.pt", "123456")}
                  >
                    Super Admin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin("aldeia@gmail.com", "123456")}
                  >
                    Admin Aldeia
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin("vendedor@gmail.com", "123456")}
                  >
                    Vendedor
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin("smpsandro1239@gmail.com", "123456")}
                  >
                    Jogador
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLoginModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Entrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Conta</DialogTitle>
            <DialogDescription>
              Registe-se para participar nos jogos e campanhas.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRegister}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="O seu nome"
                  value={registerForm.nome}
                  onChange={(e) => setRegisterForm({ ...registerForm, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="+351 9XX XXX XXX"
                  value={registerForm.telefone}
                  onChange={(e) => setRegisterForm({ ...registerForm, telefone: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRegisterModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
