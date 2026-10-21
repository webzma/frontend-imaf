"use client";

import { ListChecks, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TemaOpcion {
  id: number;
  titulo: string;
  orden: number;
}

/** Valor del selector para "escribir un título libre". */
export const TEMA_OTRO = "otro";

/**
 * Título de una sesión elegido del temario del curso.
 *
 * Cada opción es un tema, en el orden del temario. "Otro título" queda al
 * final para clases que no son un tema (repaso, evaluación final…) y es la
 * única vía cuando el curso todavía no tiene temario.
 */
export function TemaSelect({
  temas,
  temarioId,
  titulo,
  onChange,
  error,
  cargando = false,
  usosPorTema,
  id = "tema-sesion",
}: {
  temas: TemaOpcion[];
  /** Id del tema como texto, `TEMA_OTRO` o "" si no se ha elegido. */
  temarioId: string;
  titulo: string;
  onChange: (valor: { temario_id: string; titulo: string }) => void;
  error?: string;
  cargando?: boolean;
  /** Sesiones ya programadas por tema, para orientar al elegir. */
  usosPorTema?: Record<number, number>;
  id?: string;
}) {
  const ordenados = [...temas].sort((a, b) => a.orden - b.orden);
  const sinTemario = !cargando && ordenados.length === 0;
  const libre = sinTemario || temarioId === TEMA_OTRO;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-sans text-xs font-medium text-on-surface"
      >
        Tema *
      </label>

      {sinTemario ? (
        <p className="flex items-start gap-2 rounded-sm bg-surface-container px-3 py-2 font-sans text-xs text-muted-foreground">
          <ListChecks className="mt-0.5 size-3.5 shrink-0" />
          Este curso aún no tiene temario. Agrega temas en la sección «Temario»
          para elegirlos aquí, o escribe un título.
        </p>
      ) : (
        <Select
          value={temarioId}
          disabled={cargando}
          onValueChange={(v) => {
            if (v === TEMA_OTRO) {
              onChange({ temario_id: TEMA_OTRO, titulo: "" });
              return;
            }
            const tema = ordenados.find((t) => String(t.id) === v);
            onChange({ temario_id: v, titulo: tema?.titulo ?? "" });
          }}
        >
          <SelectTrigger
            id={id}
            aria-invalid={!!error || undefined}
            className="w-full font-sans text-sm"
          >
            {cargando ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                Cargando temario…
              </span>
            ) : (
              <SelectValue placeholder="Selecciona un tema del temario" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectGroup>
              <SelectLabel>Temario del curso</SelectLabel>
              {ordenados.map((t, i) => {
                const usos = usosPorTema?.[t.id] ?? 0;
                return (
                  <SelectItem key={t.id} value={String(t.id)}>
                    <span className="tabular-nums text-muted-foreground">
                      {i + 1}.
                    </span>{" "}
                    {t.titulo}
                    {usos > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        · {usos} {usos === 1 ? "sesión" : "sesiones"}
                      </span>
                    )}
                  </SelectItem>
                );
              })}
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value={TEMA_OTRO}>Otro título (sin tema)</SelectItem>
          </SelectContent>
        </Select>
      )}

      {libre && (
        <Input
          aria-label="Título de la sesión"
          placeholder="Ej: Repaso general, Evaluación final…"
          value={titulo}
          maxLength={255}
          onChange={(e) =>
            onChange({ temario_id: TEMA_OTRO, titulo: e.target.value })
          }
          className="font-sans text-sm"
          autoFocus={!sinTemario}
        />
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

/**
 * Valor inicial al editar: el tema enlazado o, para sesiones antiguas sin
 * enlace, el tema cuyo título coincide; si no, título libre.
 */
export function temaInicial(
  sesion: { temario_id?: number | null; titulo: string },
  temas: TemaOpcion[],
): string {
  if (sesion.temario_id) return String(sesion.temario_id);
  const clave = sesion.titulo.trim().toLowerCase();
  const coincide = temas.find((t) => t.titulo.trim().toLowerCase() === clave);
  return coincide ? String(coincide.id) : TEMA_OTRO;
}
