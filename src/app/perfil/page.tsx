"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User as User, Mail, Phone, MapPin, Save, Camera, ChevronDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenuModal } from "@/components/user-menu-modal";

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
  aldeiaId?: string;
  aldeia?: Aldeia;
  fotoPerfil?: string;
}

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

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
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
      <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body flex items-center justify-center">
        <div className="animate-pulse text-[#ff734b]">A carregar...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body flex flex-col items-center justify-center p-4">
        <User className="w-16 h-16 text-[#ff734b] mb-4" />
        <p className="text-lg mb-4">Precisas de fazer login para ver o teu perfil</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-[#ff734b] text-[#110d0c] font-bold rounded-xl"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body pb-32">
      <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-[#2e2928] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#ff734b]" />
          </button>
          <h1 className="font-serif text-xl tracking-wide text-[#ffb5a0] font-bold italic">O Teu Perfil</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setUserMenuOpen(true)}
            className="w-9 h-9 rounded-full bg-[#2e2928] overflow-hidden border border-[#ff734b]/20 flex items-center justify-center hover:bg-[#ff734b]/30 transition-colors"
          >
            <User className="h-4 w-4 text-[#ff734b]" />
          </button>
        </div>
      </header>

      <UserMenuModal open={userMenuOpen} onOpenChange={setUserMenuOpen} />

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
            <div className="w-24 h-24 rounded-full bg-[#2e2928] border-2 border-[#ff734b] flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-[#ff734b]" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#ff734b] rounded-full flex items-center justify-center"
            >
              <Camera className="w-4 h-4 text-[#110d0c]" />
            </button>
          </div>
          <p className="text-sm text-[#e0bfb7] mt-2">Foto de perfil</p>
          {profileImage && (
            <button
              onClick={() => setProfileImage(null)}
              className="text-xs text-red-500 mt-1 hover:underline"
            >
              Remover foto
            </button>
          )}
        </div>

        <div className="bg-[#1f1b19] rounded-2xl p-4 border border-[#58413b]/10 space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-[#e0bfb7] uppercase tracking-wider">Nome</label>
            <div className="flex items-center gap-3 bg-[#2e2928] rounded-xl px-4 py-3">
              <User className="w-5 h-5 text-[#ff734b]" />
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="flex-1 bg-transparent outline-none text-[#eae0de]"
                placeholder="O teu nome"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#e0bfb7] uppercase tracking-wider">Email</label>
            <div className="flex items-center gap-3 bg-[#2e2928] rounded-xl px-4 py-3">
              <Mail className="w-5 h-5 text-[#ff734b]" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="flex-1 bg-transparent outline-none text-[#eae0de]"
                placeholder="o.teu@email.com"
                disabled
              />
            </div>
            <p className="text-[10px] text-[#e0bfb7]/50">O email não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#e0bfb7] uppercase tracking-wider">Telefone</label>
            <div className="flex items-center gap-3 bg-[#2e2928] rounded-xl px-4 py-3">
              <Phone className="w-5 h-5 text-[#ff734b]" />
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="flex-1 bg-transparent outline-none text-[#eae0de]"
                placeholder="912 345 678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[#e0bfb7] uppercase tracking-wider">Aldeia</label>
            <div ref={dropdownRef} className="relative">
              <div className="flex items-center gap-3 bg-[#2e2928] rounded-xl px-4 py-3">
                <MapPin className="w-5 h-5 text-[#ff734b] flex-shrink-0" />
                <input
                  type="text"
                  value={aldeiaSearch}
                  onChange={(e) => {
                    setAldeiaSearch(e.target.value);
                    setFormData({ ...formData, aldeiaId: "", aldeiaNome: "" });
                    setAldeiaDropdownOpen(true);
                  }}
                  onFocus={() => setAldeiaDropdownOpen(true)}
                  className="flex-1 bg-transparent outline-none text-[#eae0de]"
                  placeholder="Pesquisar aldeia..."
                />
                {aldeiaSearch && (
                  <button
                    onClick={handleClearAldeia}
                    className="text-[#e0bfb7] hover:text-[#ff734b]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setAldeiaDropdownOpen(!aldeiaDropdownOpen)}
                  className="text-[#e0bfb7] hover:text-[#ff734b]"
                >
                  <ChevronDown className={`w-5 h-5 transition-transform ${aldeiaDropdownOpen ? "rotate-180" : ""}`} />
                </button>
              </div>
              
              {aldeiaDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#2e2928] rounded-xl border border-[#58413b]/20 max-h-60 overflow-y-auto z-50 shadow-xl">
                  {filteredAldeias.length > 0 ? (
                    filteredAldeias.map((aldeia) => (
                      <button
                        key={aldeia.id}
                        onClick={() => handleSelectAldeia(aldeia)}
                        className="w-full px-4 py-3 text-left hover:bg-[#58413b]/30 flex items-center gap-3 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-[#ff734b] flex-shrink-0" />
                        <div>
                          <p className="text-[#eae0de] font-medium">{aldeia.nome}</p>
                          <p className="text-xs text-[#e0bfb7]/60 capitalize">{aldeia.tipoOrganizacao.replace("_", " ")}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-[#e0bfb7]/60">
                      Nenhuma aldeia encontrada
                    </div>
                  )}
                </div>
              )}
            </div>
            {formData.aldeiaId && (
              <p className="text-[10px] text-[#9cefff]">Aldeia selecionada</p>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-[#ff734b] text-[#110d0c] font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
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

      <BottomNav />
    </div>
  );
}
