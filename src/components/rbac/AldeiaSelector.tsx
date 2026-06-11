"use client";
import { apiRequest } from '@/lib/api-client';

import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Aldeia = {
  id: string;
  nome: string;
};

type AldeiaSelectorProps = {
  value: string | null;
  onChange: (value: string | null) => void;
};

export default function AldeiaSelector({ value, onChange }: AldeiaSelectorProps) {
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAldeias() {
      setLoading(true);

      try {
        const response = await apiRequest("/api/aldeias");
        if (!response.ok) {
          throw new Error("Não foi possível carregar as aldeias");
        }

        const data = await response.json();
        setAldeias(data || []);
      } catch (error) {
        console.error(error);
        setAldeias([]);
      } finally {
        setLoading(false);
      }
    }

    loadAldeias();
  }, []);

  return (
    <Select value={value ?? ""} onValueChange={(nextValue) => onChange(nextValue || null)}>
      <SelectTrigger className="w-full sm:w-72 bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
        <SelectValue placeholder={loading ? "A carregar aldeias…" : "Selecionar Aldeia"} />
      </SelectTrigger>

      <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
        {aldeias.length > 0 ? (
          aldeias.map((aldeia) => (
            <SelectItem 
              key={aldeia.id} 
              value={aldeia.id}
              className="text-[var(--text)] focus:bg-[var(--card-alt)] focus:text-[var(--text)]"
            >
              {aldeia.nome}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="none" disabled className="text-[var(--text-muted)]">
            {loading ? "A carregar…" : "Nenhuma aldeia disponível"}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
