import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type AldeiaSelectorProps = {
  value: string | null;
  onChange: (value: string) => void;
};

export default function AldeiaSelector({ value, onChange }: AldeiaSelectorProps) {
  // ⚠️ NOTA:
  // Neste momento estamos a usar aldeias estáticas.
  // Depois posso ligar isto à tua tabela real de aldeias via fetch.
  const aldeias = [
    { id: "aldeia1", nome: "Aldeia 1" },
    { id: "aldeia2", nome: "Aldeia 2" },
    { id: "aldeia3", nome: "Aldeia 3" },
  ];

  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Selecionar Aldeia" />
      </SelectTrigger>

      <SelectContent>
        {aldeias.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
