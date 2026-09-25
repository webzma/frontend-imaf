"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CircleSlash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { nivelOcupacion, ocupacion, type NivelOcupacion } from "../metricas";
import type { CursoOcupacion } from "../tipos";

const VISIBLES = 6;

/**
 * Un medidor por curso (inscritos sobre cupo). Antes era una gráfica de
 * barras con el número de estudiantes, que no decía si el curso estaba lleno:
 * 12 estudiantes es mucho con cupo 12 y poco con cupo 40.
 */
const INDICADOR: Record<NivelOcupacion, string> = {
  baja: "[&>[data-slot=progress-indicator]]:bg-primary/60",
  media: "[&>[data-slot=progress-indicator]]:bg-primary",
  alta: "[&>[data-slot=progress-indicator]]:bg-warning",
  llena: "[&>[data-slot=progress-indicator]]:bg-danger",
};

export function Ocupacion({ cursos }: { cursos: CursoOcupacion[] }) {
  const [filtro, setFiltro] = useState<"activos" | "todos">("activos");
  const [verTodos, setVerTodos] = useState(false);

  const filas = useMemo(
    () =>
      cursos
        .filter((c) => filtro === "todos" || c.estado === "activo")
        .map((c) => ({ ...c, pct: ocupacion(c.estudiantes, c.limite_cupo) }))
        .sort((a, b) => b.pct - a.pct || b.estudiantes - a.estudiantes),
    [cursos, filtro],
  );

  const mostradas = verTodos ? filas : filas.slice(0, VISIBLES);
  const media =
    filas.length > 0
      ? Math.round(filas.reduce((s, f) => s + f.pct, 0) / filas.length)
      : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          value={filtro}
          onValueChange={(v) => {
            if (v) setFiltro(v as typeof filtro);
            setVerTodos(false);
          }}
          aria-label="Cursos a mostrar"
        >
          <ToggleGroupItem value="activos" className="px-3 text-xs">
            Activos
          </ToggleGroupItem>
          <ToggleGroupItem value="todos" className="px-3 text-xs">
            Todos
          </ToggleGroupItem>
        </ToggleGroup>
        {filas.length > 0 && (
          <p className="font-sans text-xs text-muted-foreground">
            Ocupación media{" "}
            <span className="font-semibold text-on-surface tabular-nums">
              {media}%
            </span>
          </p>
        )}
      </div>

      {filas.length === 0 ? (
        <p className="flex items-center gap-2 py-8 font-sans text-sm text-muted-foreground">
          <CircleSlash className="size-4" />
          {filtro === "activos"
            ? "No hay cursos activos."
            : "Todavía no hay cursos."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {mostradas.map((c) => {
            const nivel = nivelOcupacion(c.pct);
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/cursos/${c.id}`}
                  className="group -mx-2 block rounded-sm px-2 py-1.5 transition-colors hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate font-sans text-sm text-on-surface">
                      {c.nombre}
                      <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                        {c.codigo}
                      </span>
                    </p>
                    <p className="flex shrink-0 items-center gap-2 font-sans text-xs tabular-nums">
                      {nivel === "llena" && (
                        <Badge variant="rechazado" className="text-[10px]">
                          Lleno
                        </Badge>
                      )}
                      {nivel === "alta" && (
                        <Badge variant="pendiente" className="text-[10px]">
                          <AlertTriangle aria-hidden="true" />
                          Casi lleno
                        </Badge>
                      )}
                      <span className="text-muted-foreground">
                        {c.estudiantes}/{c.limite_cupo}
                      </span>
                      <span className="w-10 text-right font-semibold text-on-surface">
                        {c.pct}%
                      </span>
                    </p>
                  </div>
                  <Progress
                    value={Math.min(100, c.pct)}
                    aria-label={`${c.nombre}: ${c.estudiantes} de ${c.limite_cupo} cupos`}
                    className={cn(
                      "h-2 bg-surface-container-high",
                      INDICADOR[nivel],
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {filas.length > VISIBLES && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => setVerTodos((v) => !v)}
        >
          {verTodos ? "Ver menos" : `Ver los ${filas.length} cursos`}
        </Button>
      )}
    </div>
  );
}
