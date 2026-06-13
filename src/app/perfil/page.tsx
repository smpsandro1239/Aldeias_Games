"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User as UserIcon, Mail, Phone, MapPin, Save, Camera, ChevronDown, Search, X, Wallet, Shield, FileText } from "lucide-react";
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock } from 'lucide-react';
import { MFASetupModal } from '@/components/modals/mfa-setup-modal';
import { toast } from "sonner";
import { CarregarSaldoModal } from "@/components/modals/carregar-saldo-modal";
import { LayoutHeader } from "@/components/layout-header";
import { Card, CardContent } from "@/components/ui/card";

interface Aldeia {
  id: string;
  nome: string;
  slug: string;
  tipoOrganizacao: string;
}

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role?: string;
  aldeiaId?: string;
  aldeia?: Aldeia;
  fotoPerfil?: string;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Administrador",
  aldeia_admin: "Administrador da Aldeia",
  vendedor: "Vendedor",
  user: "Jogador",
};

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);
  const [aldeiaSearch, setAldeiaSearch] = useState("");
  const [aldeiaDropdownOpen, setAldeiaDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [carregarSaldoOpen, setCarregarSaldoOpen] = useState(false);
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    role: "",
    aldeiaId: "",
    aldeiaNome: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setFormData({
          nome: userData.nome || "",
          email: userData.email || "",
          telefone: userData.telefone || "",
          role: userData.role || "",
          aldeiaId: userData.aldeiaId || "",
          aldeiaNome: userData.aldeia?.nome || "",
        });
        setAldeiaSearch(userData.aldeia?.nome || "");
        if (userData.fotoPerfil) {
          setProfileImage(userData.fotoPerfil);
        }
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
    fetchAldeias();
    setLoading(false);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter menos de 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAldeiaDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAldeias = async () => {
    try {
      const response = await fetch("/api/aldeias");
      const data = await response.json();
      if (data.data) {
        setAldeias(data.data);
      }
    } catch (error) {
      console.error("Error fetching aldeias:", error);
    }
  };

  const filteredAldeias = aldeias.filter((aldeia) =>
    aldeia.nome.toLowerCase().includes(aldeiaSearch.toLowerCase())
  );

  const handleSelectAldeia = (aldeia: Aldeia) => {
    setFormData({ ...formData, aldeiaId: aldeia.id, aldeiaNome: aldeia.nome });
    setAldeiaSearch(aldeia.nome);
    setAldeiaDropdownOpen(false);
  };

  const handleClearAldeia = () => {
    setFormData({ ...formData, aldeiaId: "", aldeiaNome: "" });
    setAldeiaSearch("");
    setAldeiaDropdownOpen(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    const selectedAldeia = aldeias.find(a => a.id === formData.aldeiaId) || undefined;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/perfil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: formData.nome,
          telefone: formData.telefone,
          aldeiaId: formData.aldeiaId,
          fotoPerfil: profileImage || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedUser: UserProfile = {
          ...user,
          nome: formData.nome,
          telefone: formData.telefone,
          aldeiaId: formData.aldeiaId,
          aldeia: selectedAldeia,
          fotoPerfil: profileImage || undefined,
        };
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success("Perfil atualizado com sucesso!");
      } else {
        toast.error("Erro ao atualizar perfil na API");
      }
    } catch (error) {
      console.error("Erro ao guardar perfil:", error);
      toast.error("Ocorreu um erro ao guardar as alterações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground font-body flex items-center justify-center">
        <div className="animate-pulse text-primary">A carregar...</div>
      </div>
    );
  }

  if (!user) {
    return (
       <div className="min-h-screen bg-background text-foreground font-body flex flex-col items-center justify-center p-4">
         <UserIcon className="w-16 h-16 text-primary mb-4" />
         <p className="text-lg mb-4">Precisas de fazer login para ver o teu perfil</p>
         <button
           onClick={() => router.push("/")}
           className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl"
         >
           Voltar ao Início
         </button>
       </div>
    );
  }

   return (
     <LayoutHeader>
       <div className="min-h-screen bg-background text-foreground font-body">
         <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center justify-between px-4 py-3">
           <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
               <ArrowLeft className="w-5 h-5 text-primary" />
             </button>
             <h1 className="font-serif text-xl tracking-wide text-accent font-bold italic">O Teu Perfil</h1>
            </div>
          </header>

          <CarregarSaldoModal
           open={carregarSaldoOpen} 
           onOpenChange={setCarregarSaldoOpen}
           aldeiaId={formData.aldeiaId}
           aldeiaNome={formData.aldeiaNome}
         />

         <main className="px-4 pt-6 space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <div className="w-24 h-24 rounded-full bg-surface-container-low border-2 border-primary flex items-center justify-center overflow-hidden">
              {profileImage ? (
                 <img src={profileImage} alt="Foto de perfil" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-12 h-12 text-primary" />
               )}
            </div>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center"
             >
               <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Foto de perfil</p>
          {profileImage && (
            <button
              onClick={() => setProfileImage(null)}
              className="text-xs text-destructive mt-1 hover:underline"
            >
              Remover foto
            </button>
          )}
        </div>

        <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10 space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</label>
           <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
             <UserIcon className="w-5 h-5 text-primary" />
             <span className="flex-1 text-foreground font-medium">
               {roleLabels[user?.role || ""] || "Jogador"}
             </span>
           </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Perfil</label>
               <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3 opacity-70">
                 <UserIcon className="w-5 h-5 text-primary" />
                 <span className="flex-1 text-foreground font-medium">
                   {roleLabels[user?.role || ""] || "Jogador"}
                 </span>
               </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
            <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
              <Mail className="w-5 h-5 text-primary" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="flex-1 bg-transparent outline-none text-foreground"
                placeholder="o.teu@email.com"
                disabled
              />
            </div>
            <p className="text-[10px] text-muted-foreground/50">O email não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Telefone</label>
            <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
              <Phone className="w-5 h-5 text-primary" />
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="flex-1 bg-transparent outline-none text-foreground"
                placeholder="912 345 678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Aldeia</label>
            <div ref={dropdownRef} className="relative">
              <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <input
                  type="text"
                  value={aldeiaSearch}
                  onChange={(e) => {
                    setAldeiaSearch(e.target.value);
                    setFormData({ ...formData, aldeiaId: "", aldeiaNome: "" });
                    setAldeiaDropdownOpen(true);
                  }}
                  onFocus={() => setAldeiaDropdownOpen(true)}
                  className="flex-1 bg-transparent outline-none text-foreground"
                  placeholder="Pesquisar aldeia..."
                />
                {aldeiaSearch && (
                  <button
                    onClick={handleClearAldeia}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setAldeiaDropdownOpen(!aldeiaDropdownOpen)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${aldeiaDropdownOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              
              {aldeiaDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-low rounded-xl border border-outline-variant/20 max-h-60 overflow-y-auto z-50 shadow-xl">
                  {filteredAldeias.length > 0 ? (
                    filteredAldeias.map((aldeia) => (
                      <button
                        key={aldeia.id}
                        onClick={() => handleSelectAldeia(aldeia)}
                        className="w-full px-4 py-3 text-left hover:bg-muted/30 flex items-center gap-3 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-foreground font-medium">{aldeia.nome}</p>
                          <p className="text-xs text-muted-foreground/60 capitalize">{aldeia.tipoOrganizacao.replace("_", " ")}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-muted-foreground/60">
                      Nenhuma aldeia encontrada
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.aldeiaId && (
              <p className="text-[10px] text-secondary">Aldeia selecionada</p>
            )}
          </div>
        <Card className="bg-surface-container/50 border-outline-variant/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-accent mb-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Segurança 2FA
              </h3>
              <p className="text-xs text-muted-foreground">
                Proteja a sua conta com autenticação de dois fatores.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMfaSetupOpen(true)}
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              Configurar
            </Button>
          </CardContent>
        </Card>

        <MFASetupModal
          open={mfaSetupOpen}
          onOpenChange={setMfaSetupOpen}
          onSuccess={() => {}}
        />
        </div>

        <Card className="bg-surface-container/50 border-outline-variant/20">
          <CardContent className="p-4">
            <h3 className="font-semibold text-accent mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacidade & Dados
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Exporte os seus dados ou solicite a eliminação da conta conforme RGPD.
            </p>
            <a
              href="/dados-pessoais"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <FileText className="w-4 h-4" />
              Aceder ao Portal de Dados
            </a>
          </CardContent>
        </Card>

        <button
          onClick={() => setCarregarSaldoOpen(true)}
          className="w-full py-4 bg-primary text-foreground font-bold rounded-xl flex items-center justify-center gap-2"
        >
          <Wallet className="w-5 h-5" />
          Carregar Saldo
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            "A guardar..."
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Alterações
            </>
          )}
        </button>
      </main>
      </div>
    </LayoutHeader>
  );
}
