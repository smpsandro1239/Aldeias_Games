"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Aldeia {
  id: string;
  nome: string;
  tipoOrganizacao: string;
}

interface AldeiaWizardModalProps {
  open: boolean;
  onComplete: (aldeiaId: string, aldeiaNome: string) => void;
}

export function AldeiaWizardModal({ open, onComplete }: AldeiaWizardModalProps) {
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAldeias();
    }
  }, [open]);

  const fetchAldeias = async () => {
    try {
      const res = await apiRequest("/api/aldeias");
      if (res.ok) {
        const data = await res.json();
        // Handle both { data: [...] } and [...] response formats
        const aldeiasList = data.data || data;
        setAldeias(aldeiasList || []);
      }
    } catch (error) {
      console.error("Erro ao carregar aldeias:", error);
        toast.error("Não foi possível carregar as aldeias.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedId) return;

    setSaving(true);
    try {
      const savedUserStr = localStorage.getItem("user");
      
      const res = await apiRequest("/api/users/perfil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aldeiaId: selectedId }),
      });

       if (res.ok) {
         const data = await res.json();
         const selectedAldeia = aldeias.find((a) => a.id === selectedId);
         
         // Update user in localStorage
         if (savedUserStr) {
           const savedUser = JSON.parse(savedUserStr);
           savedUser.aldeiaId = selectedId;
           savedUser.aldeia = selectedAldeia;
           localStorage.setItem("user", JSON.stringify(savedUser));
         }
 
         onComplete(selectedId, selectedAldeia?.nome || "");
         
         toast.success(`Bem-vindo a ${selectedAldeia?.nome || "Aldeia"}`);
       } else {
         const errorData = await res.json();
         console.error("Erro ao atualizar perfil:", errorData);
         throw new Error(errorData.error || "Erro ao atualizar perfil");
       }
    } catch (error) {
      console.error("Erro ao guardar aldeia:", error);
      toast.error("Não foi possível guardar a tua seleção.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-surface-container border border-primary/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          <div className="p-6 text-center border-b border-primary/10 bg-background">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-foreground">
              Escolhe a tua <span className="text-primary">Aldeia</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Para ver os jogos disponíveis e apoiar a tua comunidade, seleciona a tua aldeia.
            </p>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : aldeias.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma aldeia encontrada.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aldeias.map((aldeia) => {
                  const isSelected = selectedId === aldeia.id;
                  return (
                    <button
                      key={aldeia.id}
                      onClick={() => setSelectedId(aldeia.id)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center justify-between ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(255,115,75,0.15)]"
                          : "bg-surface-container-low border-transparent hover:bg-[#383231]"
                      }`}
                    >
                      <div>
                        <h3 className={`font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {aldeia.nome}
                        </h3>
                        <p className="text-xs text-muted-foreground/60 mt-1 capitalize">
                          {aldeia.tipoOrganizacao.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-primary/10 bg-background">
            <button
              onClick={handleConfirm}
              disabled={!selectedId || saving}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-[#ff8c6b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  A guardar...
                </>
              ) : (
                "Confirmar Seleção"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
