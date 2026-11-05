"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Sesion } from "./types";
import type { FormatoHorario } from "../_lib/exportar-horario";

interface Props {
  sesiones: Sesion[];
  rangoLabel: string;
  /** Filtros activos, para que el documento diga qué recorte de la agenda es. */
  filtros?: string[];
  disabled?: boolean;
}

export default function ExportarHorarioButton({
  sesiones,
  rangoLabel,
  filtros,
  disabled,
}: Props) {
  const [exportando, setExportando] = useState<FormatoHorario | null>(null);

  const exportar = async (formato: FormatoHorario) => {
    setExportando(formato);
    try {
      const { exportarHorario } = await import("../_lib/exportar-horario");
      await exportarHorario(sesiones, formato, rangoLabel, filtros);
    } catch {
      toast.error("No se pudo generar la exportación.");
    } finally {
      setExportando(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled || exportando !== null || sesiones.length === 0}
        >
          {exportando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exportando ? "Generando…" : "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Formato</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => exportar("csv")}>
          <FileText className="mr-2 size-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportar("pdf")}>
          <FileText className="mr-2 size-4" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportar("excel")}>
          <FileSpreadsheet className="mr-2 size-4" />
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
