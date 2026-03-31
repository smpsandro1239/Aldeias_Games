"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Gamepad2, Users, House, Trophy, CreditCard, Shield, Menu, LogOut, User, Sparkles, Rocket, Zap, ArrowRight, Star, Clock, MapPin, PartyPopper, Ticket, Leaf, Wallet, Compass, Award } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { DashboardStats } from "@/components/dashboard-stats";
import { QuickActions } from "@/components/quick-actions";

const AdminDashboard = dynamic(() => import("@/features/admin/admin-dashboard").then(mod => mod.AdminDashboard), { ssr: false });
const ClienteDashboard = dynamic(() => import("@/features/cliente/cliente-dashboard").then(mod => mod.ClienteDashboard), { ssr: false });
const VendedorDashboard = dynamic(() => import("@/features/vendedor/vendedor-dashboard").then(mod => mod.VendedorDashboard), { ssr: false });

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
  aldeia?: Aldeia;
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
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ 
    nome: "", 
    email: "", 
    password: "", 
    telefone: "" 
  });
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);

  useEffect(() => {
    setMounted(true);
    
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (savedToken && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setToken(savedToken);
      setUser(parsedUser);
      
      if (parsedUser.aldeiaId && !parsedUser.aldeia && (parsedUser.role === "aldeia_admin" || parsedUser.role === "super_admin")) {
        fetch(`/api/aldeias/${parsedUser.aldeiaId}`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.data) {
              const updatedUser = { ...parsedUser, aldeia: data.data };
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          })
          .catch(console.error);
      }
    }
    
    setLoading(false);
    
    Promise.all([fetchEventos(), fetchJogos(), fetchAldeias()]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchEventos = useCallback(async () => {
    try {
      const response = await fetch("/api/eventos?publico=true");
      const data = await response.json();
      if (data.data) {
        setEventos(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
    }
  }, []);

  const fetchJogos = useCallback(async () => {
    try {
      const response = await fetch("/api/jogos?ativos=true");
      const data = await response.json();
      if (data.data) {
        setJogos(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar jogos:", error);
    }
  }, []);

  const fetchAldeias = useCallback(async () => {
    try {
      const response = await fetch("/api/aldeias");
      const data = await response.json();
      if (data.data) {
        setAldeias(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar aldeias:", error);
    }
  }, []);

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
        
        // Redirect based on role
        toast.success(`Bem-vindo, ${data.user.nome}!`);
        
        setTimeout(() => {
          switch (data.user.role) {
            case "super_admin":
              router.push("/superadmindashboard");
              break;
            case "aldeia_admin":
              router.push("/admindashboard");
              break;
            case "vendedor":
              router.push("/vendedordashboard");
              break;
            case "user":
            default:
              router.push("/clientedashboard");
              break;
          }
        }, 100);
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
    setUserMenuOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout efetuado!");
  };

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
        
        setTimeout(() => {
          switch (data.user.role) {
            case "super_admin":
              router.push("/superadmindashboard");
              break;
            case "aldeia_admin":
              router.push("/admindashboard");
              break;
            case "vendedor":
              router.push("/vendedordashboard");
              break;
            case "user":
            default:
              router.push("/clientedashboard");
              break;
          }
        }, 100);
      }
    } catch (error) {
      toast.error("Erro no quick login");
    }
  };

  if (!mounted) return (
    <div className="min-h-screen flex items-center justify-center bg-[#110d0c] text-[#eae0de] font-body selection:bg-[#ff734b]/30 overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff734b]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9cefff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="flex flex-col items-center z-20">
        <House className="text-[#ff734b] text-5xl animate-pulse" />
      </div>
    </div>
  );

  const handleIniciar = () => {
    setHasEntered(true);
    setTimeout(() => {
      setLoginModalOpen(true);
    }, 800);
  };

  if (!hasEntered) return (
    <div 
      className="min-h-screen flex items-center justify-center bg-[#110d0c] text-[#eae0de] font-body selection:bg-[#ff734b]/30 overflow-hidden"
    >
      {/* Grain Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
      
      {/* Background Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff734b]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9cefff]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="flex flex-col items-center z-20">
        <div className="mb-4">
          <House className="text-[#ff734b] text-5xl" style={{ fontWeight: 200 }} />
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#ff734b] tracking-tight italic">
          Aldeias Games
        </h1>
        
        {/* Separator */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#58413b]/30 to-transparent my-6 max-w-lg"></div>
        
        <p className="font-body text-[#e0bfb7] text-sm md:text-base tracking-[0.15em] uppercase font-bold">
          Onde a Tradição, Forja o Presente
        </p>
        
        {/* Digital Loader Animation - Cyan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <div className="relative w-32 h-1 bg-[#393432]/20 rounded-full overflow-hidden">
            <div 
              className="digital-loader absolute inset-0 rounded-full shadow-[0_0_15px_rgba(0,218,243,0.4)]"
              style={{
                height: '2px',
                width: '140px',
                background: 'linear-gradient(90deg, transparent, #00daf3, transparent)',
                animation: 'pulse-cyan 3s infinite ease-in-out',
              }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#e0bfb7]/40 font-bold">
            A Iniciar&nbsp;
          </span>
        </motion.div>

        {/* Iniciar Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8"
        >
          <button 
            onClick={handleIniciar}
            className="relative px-8 py-3 bg-[#ff734b] text-[#110d0c] font-bold rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#ff734b]/20"
          >
            INICIAR
          </button>
        </motion.div>
      </div>

      {/* Editorial Accents */}
      <div className="absolute bottom-12 left-12 hidden md:block border-l border-[#ff734b]/20 pl-4 py-2">
        <p className="text-[10px] text-[#eae0de]/30 uppercase tracking-[0.2em] leading-relaxed">
          Legado Ancestral<br />Tecnologia Digital
        </p>
      </div>
      <div className="absolute top-12 right-12 hidden md:block">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#9cefff] shadow-[0_0_8px_#00daf3]"></div>
          <span className="text-[10px] text-[#eae0de]/50 uppercase tracking-[0.3em] font-bold">Sistema Ativo</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-cyan {
          0%, 100% { transform: scaleX(0); opacity: 0.3; }
          50% { transform: scaleX(1); opacity: 1; }
        }
        .digital-loader {
          animation: pulse-cyan 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#110d0c] text-[#eae0de] font-body selection:bg-[#ff734b]/30 overflow-hidden">
      {/* Grain Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
      
      {/* Background Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff734b]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#9cefff]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="flex flex-col items-center z-20">
        <div className="mb-4">
          <House className="text-[#ff734b] text-5xl" style={{ fontWeight: 200 }} />
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-[#ff734b] tracking-tight italic">
          Aldeias Games
        </h1>
        
        {/* Separator */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#58413b]/30 to-transparent my-6 max-w-lg"></div>
        
        <p className="font-body text-[#e0bfb7] text-sm md:text-base tracking-[0.15em] uppercase font-bold">
          Onde a Tradição, Forja o Presente
        </p>
        
        {/* Loading Element - Cyan Digital Loader */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="relative w-32 h-1 bg-[#393432]/20 rounded-full overflow-hidden">
            <div 
              className="digital-loader absolute inset-0 rounded-full"
              style={{
                height: '2px',
                width: '140px',
                background: 'linear-gradient(90deg, transparent, #00daf3, transparent)',
                animation: 'pulse-cyan 3s infinite ease-in-out',
                boxShadow: '0 0 15px rgba(0,218,243,0.4)',
              }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#e0bfb7]/40 font-bold">
            A Iniciar...
          </span>
        </div>
      </div>

      {/* Editorial Accents */}
      <div className="absolute bottom-12 left-12 hidden md:block border-l border-[#ff734b]/20 pl-4 py-2">
        <p className="text-[10px] text-[#eae0de]/30 uppercase tracking-[0.2em] leading-relaxed">
          Legado Ancestral<br />Tecnologia Digital
        </p>
      </div>
      <div className="absolute top-12 right-12 hidden md:block">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#9cefff] shadow-[0_0_8px_#00daf3]"></div>
          <span className="text-[10px] text-[#eae0de]/50 uppercase tracking-[0.3em] font-bold">Sistema Ativo</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-cyan {
          0%, 100% { transform: scaleX(0); opacity: 0.3; }
          50% { transform: scaleX(1); opacity: 1; }
        }
        .digital-loader {
          animation: pulse-cyan 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );

  const getJogoIcon = (tipo: string) => {
    switch (tipo) {
      case "raspadinha": return <Sparkles className="text-3xl" />;
      case "poio_da_vaca": return <Leaf className="text-3xl" />;
      case "rifa": return <Ticket className="text-3xl" />;
      case "tombola": return <Award className="text-3xl" />;
      default: return <Gamepad2 className="text-3xl" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center gap-4">
            <Menu className="text-[#ff734b] text-2xl cursor-pointer hover:opacity-80 transition-opacity" />
            <h1 className="font-serif text-xl font-bold text-[#ff734b] tracking-tight italic">Aldeias Games</h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex gap-6">
              <button onClick={() => document.getElementById('eventos')?.scrollIntoView({ behavior: 'smooth' })} className="font-label text-xs font-bold tracking-widest uppercase text-[#e0bfb7] hover:text-[#9cefff] transition-colors">Eventos</button>
              <button onClick={() => document.getElementById('aldeias')?.scrollIntoView({ behavior: 'smooth' })} className="font-label text-xs font-bold tracking-widest uppercase text-[#9cefff] transition-colors">Aldeias</button>
              <button onClick={() => window.location.href = '/jogos'} className="font-label text-xs font-bold tracking-widest uppercase text-[#e0bfb7] hover:text-[#9cefff] transition-colors">Competir</button>
            </nav>
            <div className="w-10 h-10 rounded-full bg-[#2e2928] overflow-hidden border-2 border-[#ff734b]/20 relative">
              {user ? (
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
        {user ? (
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions role={user.role} />
            
            {/* Dashboard Stats - apenas para admins */}
            {(user.role === "super_admin" || user.role === "aldeia_admin") && (
              <DashboardStats role={user.role} stats={{}} />
            )}
            
            {/* Dashboard */}
            {(user.role === "super_admin" || user.role === "aldeia_admin") && (
              <AdminDashboard 
                token={token || ""} 
                aldeiaId={user.aldeiaId} 
                userRole={user.role}
                aldeia={user.aldeia}
              />
            )}
            {user.role === "vendedor" && (
              <VendedorDashboard token={token || ""} />
            )}
            {user.role === "user" && (
              <ClienteDashboard token={token || ""} />
            )}
            
            {/* Bottom Navigation */}
            <BottomNav role={user.role} />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-2xl">
                <span className="text-secondary font-label font-bold tracking-widest uppercase text-xs mb-4 block">Portal de Angariação</span>
                <h2 className="font-headline text-5xl md:text-7xl leading-tight">
                  Lança a tua <span className="text-primary italic">Campanha Herança</span>
                </h2>
                <p className="text-on-surface-variant text-lg mt-6 leading-relaxed">
                  Cria um evento de angariação de fundos único que combina tradição local com competição digital.
                </p>
              </div>
              <div className="hidden lg:block w-48 h-48 bg-surface-container-high rounded-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
                <div className="p-6 flex flex-col h-full justify-between">
                  <PartyPopper className="text-secondary text-4xl" />
                  <span className="font-label text-xs font-bold leading-tight uppercase opacity-60">Ready to boost your village?</span>
                </div>
              </div>
            </section>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { icon: House, label: "Aldeias", value: "50+", color: "text-primary" },
                { icon: Users, label: "Jogadores", value: "10K+", color: "text-secondary" },
                { icon: CreditCard, label: "Angariado", value: "€500K+", color: "text-tertiary" },
                { icon: Shield, label: "Transparente", value: "100%", color: "text-primary" },
              ].map((stat, i) => (
                <div key={i} className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-3">
                    <stat.icon className={`${stat.color} text-xl`} />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">{stat.label}</span>
                  </div>
                  <span className="font-headline text-3xl font-bold">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Features Section */}
            <section className="mb-16">
              <h3 className="font-headline text-3xl mb-8 flex items-center gap-4">
                <span className="text-secondary">Porquê escolher-nos?</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Gamepad2, title: "Jogos Imersivos", desc: "Poio da Vaca, Rifas, Tombolas e Raspadinhas com experiência única.", color: "primary", tags: ["High Engagement", "Traditional"] },
                  { icon: Shield, title: "Sorteios Transparentes", desc: "Algoritmos SHA-256 auditáveis garantem justiça absoluta.", color: "secondary", tags: ["Blockchain", "Auditoria"] },
                  { icon: CreditCard, title: "Pagamentos Instant", desc: "Stripe + MBWay integrados para transações rápidas.", color: "tertiary", tags: ["MBWay", "Stripe"] },
                ].map((feature, i) => (
                  <div key={i} className="group bg-surface-container-high rounded-3xl p-6 transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-outline-variant/10 hover:ring-primary/50">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-surface-container-highest rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <feature.icon className={`text-${feature.color} text-3xl`} />
                      </div>
                    </div>
                    <h4 className="font-headline text-2xl mb-2">{feature.title}</h4>
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{feature.desc}</p>
                    <div className="flex gap-2 flex-wrap">
                      {feature.tags.map((tag, j) => (
                        <span key={j} className={`bg-surface-container px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${j === 0 ? `text-${feature.color}` : 'text-on-surface-variant'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Games Section */}
            {jogos.length > 0 && (
              <section className="mb-16" id="eventos">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline text-3xl flex items-center gap-4">
                    <span className="text-secondary">Jogos em Destaque</span>
                  </h3>
                  <Button variant="outline" className="border-outline-variant/20">
                    Ver Todos <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {jogos.slice(0, 4).map((jogo, i) => (
                    <div key={jogo.id} className="group bg-surface-container-high rounded-3xl p-6 transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-outline-variant/10 hover:ring-primary/50">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
                          {getJogoIcon(jogo.tipo)}
                        </div>
                        <Badge variant="secondary" className="bg-secondary/20 text-secondary text-xs capitalize">
                          {jogo.tipo.replace("_", " ")}
                        </Badge>
                      </div>
                      <h4 className="font-headline text-xl mb-2 group-hover:text-primary transition-colors">{jogo.nome}</h4>
                      <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">{jogo.descricao}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                        <div>
                          <span className="font-headline text-2xl font-bold text-primary">{jogo.preco.toFixed(2)}€</span>
                          <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                            <Star className="h-3 w-3 text-tertiary" />
                            {jogo.stockAtual} disponíveis
                          </p>
                        </div>
                        <Button size="sm" className="bg-primary text-primary-foreground">
                          Jogar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Events Section */}
            {eventos.length > 0 && (
              <section className="mb-16">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline text-3xl flex items-center gap-4">
                    <span className="text-primary">Eventos Ativos</span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {eventos.slice(0, 6).map((evento, i) => (
                    <div key={evento.id} className="group bg-surface-container-high rounded-3xl overflow-hidden transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-outline-variant/10 hover:ring-primary/50">
                      {evento.imagemUrl && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img src={evento.imagemUrl} alt={evento.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{evento.aldeia?.nome}</span>
                        </div>
                        <h4 className="font-headline text-xl mb-2 group-hover:text-primary transition-colors">{evento.nome}</h4>
                        <p className="text-on-surface-variant text-sm line-clamp-2 mb-4">{evento.descricao}</p>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(evento.dataInicio).toLocaleDateString("pt-PT")} - {new Date(evento.dataFim).toLocaleDateString("pt-PT")}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Aldeias Section */}
            <section className="mb-16" id="aldeias">
              <h3 className="font-headline text-3xl mb-8 flex items-center gap-4">
                <span className="text-tertiary">Nossas Aldeias</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {aldeias.slice(0, 8).map((aldeia, i) => (
                  <div key={aldeia.id} className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {aldeia.logoUrl ? (
                        <img src={aldeia.logoUrl} alt={aldeia.nome} className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary/30" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <House className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm">{aldeia.nome}</p>
                        <p className="text-xs text-on-surface-variant capitalize">{aldeia.tipoOrganizacao.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA Section */}
            <section className="mb-16">
              <div className="bg-surface-container-high rounded-3xl p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 text-center max-w-2xl mx-auto">
                  <h3 className="font-headline text-4xl mb-4">Pronto para transformar a tua aldeia?</h3>
                  <p className="text-on-surface-variant text-lg mb-8">Junta-te a dezenas de comunidades que já estão a angariar fundos de forma moderna e transparente.</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button onClick={() => setRegisterModalOpen(true)} className="bg-gradient-to-r from-primary to-primary-container text-primary-foreground px-10 py-4 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-3">
                      Criar Conta Grátis
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" onClick={() => setLoginModalOpen(true)} className="px-10 py-4 rounded-xl border-outline-variant/20">
                      Já tenho conta
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/10 py-12 bg-surface">
        <div className="container max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Gamepad2 className="h-8 w-8 text-primary" />
                <span className="font-headline text-xl font-bold">Aldeias Games</span>
              </div>
              <p className="text-sm text-on-surface-variant">A plataforma de angariação de fundos para comunidades locais portuguesas.</p>
            </div>
            <div>
              <h4 className="font-label font-bold uppercase tracking-widest text-xs mb-4">Navegação</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><a href="#" className="hover:text-primary transition-colors">Eventos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Jogos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Aldeias</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-label font-bold uppercase tracking-widest text-xs mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><a href="/termos" className="hover:text-primary transition-colors">Termos de Serviço</a></li>
                <li><a href="/privacidade" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">RGPD</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-label font-bold uppercase tracking-widest text-xs mb-4">Contacto</h4>
              <p className="text-sm text-on-surface-variant">suporte@aldeiasgames.pt</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-outline-variant/10 text-center text-sm text-on-surface-variant">
            © 2024 Aldeias Games. Desenvolvido com ❤️ para Portugal.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav - Apenas para visitantes (não autenticados) */}
      {!user && (
        <div className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-3 bg-surface-container-high/80 backdrop-blur-2xl z-50 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.4)] md:hidden">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 transition-all">
            <Compass className="h-6 w-6" />
            <span className="font-label text-[10px] font-bold tracking-widest uppercase mt-1">Explorar</span>
          </button>
          <button onClick={() => document.getElementById('aldeias')?.scrollIntoView({ behavior: 'smooth' })} className="flex flex-col items-center justify-center text-secondary bg-secondary/10 rounded-2xl px-4 py-2 scale-110 transition-all">
            <House className="h-6 w-6" style={{ fill: 'currentColor' }} />
            <span className="font-label text-[10px] font-bold tracking-widest uppercase mt-1">Aldeias</span>
          </button>
          <button onClick={() => window.location.href = '/jogos'} className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 transition-all">
            <Gamepad2 className="h-6 w-6" />
            <span className="font-label text-[10px] font-bold tracking-widest uppercase mt-1">Competir</span>
          </button>
          <button onClick={() => user ? setUserMenuOpen(!userMenuOpen) : setLoginModalOpen(true)} className="flex flex-col items-center justify-center text-on-surface-variant opacity-70 hover:opacity-100 transition-all">
            <Wallet className="h-6 w-6" />
            <span className="font-label text-[10px] font-bold tracking-widest uppercase mt-1">{user ? 'Ver Saldo' : 'Carteira'}</span>
          </button>
        </div>
      )}

      {/* User Menu Modal */}
      <Dialog open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-headline text-xl">A minha Conta</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-surface-container-high rounded-xl p-4 text-center">
              <p className="text-xs text-on-surface-variant mb-1">O meu Saldo Aldeias</p>
              <p className="font-headline text-3xl text-primary">5,55 €</p>
            </div>
            <button 
              onClick={() => {
                setUserMenuOpen(false);
                router.push('/perfil');
              }}
              className="w-full py-3 text-center text-[#9cefff] hover:bg-[#9cefff]/10 rounded-xl flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" />
              Editar Perfil
            </button>
            <button 
              onClick={handleLogout}
              className="w-full py-3 text-center text-red-500 hover:bg-red-500/10 rounded-xl flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Terminar Sessão
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="font-headline text-2xl text-center">Entrar</DialogTitle>
            <DialogDescription className="text-center text-on-surface-variant">
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
                  className="bg-surface-container-lowest border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50"
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
                  className="bg-surface-container-lowest border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50"
                />
              </div>
              
              <div className="pt-4 border-t border-outline-variant/10">
                <p className="text-sm text-on-surface-variant mb-3">Quick Login:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Admin", email: "admin@aldeias.pt" },
                    { label: "Aldeia", email: "aldeia@gmail.com" },
                    { label: "Vendedor", email: "vendedor@gmail.com" },
                    { label: "Jogador", email: "smpsandro1239@gmail.com" },
                  ].map((u) => (
                    <Button
                      key={u.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickLogin(u.email, "123456")}
                      className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                    >
                      {u.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setLoginModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground">
                <Zap className="h-4 w-4 mr-2" />
                Entrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
        <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="font-headline text-2xl text-center">Criar Conta</DialogTitle>
            <DialogDescription className="text-center text-on-surface-variant">
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
                  className="bg-surface-container-lowest border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50"
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
                  className="bg-surface-container-lowest border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50"
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
                  className="bg-surface-container-lowest border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50"
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
                  className="bg-surface-container-lowest border-none rounded-xl py-4 px-6 focus:ring-2 focus:ring-secondary/50"
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setRegisterModalOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-primary-container text-primary-foreground">
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