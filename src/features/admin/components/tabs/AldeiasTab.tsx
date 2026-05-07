"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  Building2
} from "lucide-react";
import { Aldeia } from "../types";

interface AldeiasTabProps {
  aldeias: Aldeia[];
  setSelectedAldeia: (aldeia: Aldeia | null) => void;
  setAldeiaModalOpen: (open: boolean) => void;
  requestDelete: (type: string, id: string) => void;
}

export function AldeiasTab({
  aldeias,
  setSelectedAldeia,
  setAldeiaModalOpen,
  requestDelete,
}: AldeiasTabProps) {
  const [aldeiaSearch, setAldeiaSearch] = useState("");
  const [aldeiaPage, setAldeiaPage] = useState(1);

  const filteredAldeias = useMemo(() => {
    const searchLower = aldeiaSearch.toLowerCase();
    return aldeias.filter(al => {
      if (!searchLower) return true;
      return (
        al.nome?.toLowerCase().includes(searchLower) ||
        al.tipoOrganizacao?.toLowerCase().includes(searchLower) ||
        al.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [aldeias, aldeiaSearch]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Gestão de Aldeias/Organizações</h2>
        <Button
          onClick={() => {
            setSelectedAldeia(null);
            setAldeiaModalOpen(true);
          }}
          size="sm"
          className="bg-primary"
        >
          <Plus className="h-4 w-4 mr-1" /> Nova Aldeia
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="flex-1 max-w-md">
          <Label htmlFor="aldeiaSearch" className="sr-only">
            Pesquisar aldeia
          </Label>
          <Input
            id="aldeiaSearch"
            placeholder="Pesquisar por nome, tipo ou email..."
            value={aldeiaSearch}
            onChange={(e) => {
              setAldeiaSearch(e.target.value);
              setAldeiaPage(1);
            }}
          />
        </div>
      </div>

      {/* Lista */}
      {filteredAldeias.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem organizações</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Crie a primeira organização para começar a gerir aldeias, escolas e associações.
            </p>
            <Button onClick={() => setAldeiaModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nova Organização
            </Button>
          </CardContent>
        </Card>
      ) : (
          <div className="grid gap-4">
            {filteredAldeias
              .slice((aldeiaPage - 1) * 10, aldeiaPage * 10)
              .map((al) => (
                <Card key={al.id} className="hover:bg-accent/5 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div
                      className="flex-1"
                      onClick={() => {
                        setSelectedAldeia(al);
                        setAldeiaModalOpen(true);
                      }}
                    >
                      <h3 className="font-semibold">{al.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {al.tipoOrganizacao} • {al.email}
                      </p>
                    </div>
                    <div
                      className="flex flex-wrap gap-2 items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedAldeia(al);
                          setAldeiaModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => requestDelete("aldeia", al.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
      )}

      {/* Paginação */}
      {filteredAldeias.length > 10 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {(aldeiaPage - 1) * 10 + 1} a {Math.min(aldeiaPage * 10, filteredAldeias.length)} de {filteredAldeias.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={aldeiaPage === 1}
              onClick={() => setAldeiaPage(aldeiaPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={aldeiaPage * 10 >= filteredAldeias.length}
              onClick={() => setAldeiaPage(aldeiaPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
