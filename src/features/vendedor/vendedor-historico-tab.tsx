"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { VendedorSales } from "./vendedor-types";

interface VendedorHistoricoTabProps {
  vendas: VendedorSales[];
  onVerProva: (participacaoId: string) => void;
}

export function VendedorHistoricoTab({ vendas, onVerProva }: VendedorHistoricoTabProps) {
  return (
    <Card className="bg-card border-outline-variant/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Histórico de Vendas</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Jogo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas?.length ? (
                vendas.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell>{formatDateTime(venda.createdAt)}</TableCell>
                    <TableCell>{venda.jogo?.nome || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {venda.metodoPagamento}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(venda.valor)}
                    </TableCell>
                    <TableCell className="text-right">
                      {venda.tipo === 'participacao' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary"
                          title="Ver Prova"
                          onClick={() => onVerProva(venda.id)}
                        >
                          <Hash className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sem vendas registadas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}