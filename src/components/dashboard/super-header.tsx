import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { Plus } from "lucide-react";

interface SuperHeaderProps {
  onNovaAldeia: () => void;
}

export function SuperHeader({ onNovaAldeia }: SuperHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-accent">Painel Global</h1>
          <p className="text-sm text-muted-foreground">Gestão de todas as aldeias</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button size="sm" onClick={onNovaAldeia}>
            <Plus className="h-4 w-4 mr-1" /> Aldeia
          </Button>
        </div>
      </div>
    </div>
  );
}
