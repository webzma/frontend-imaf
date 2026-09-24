"use client";

import * as React from "react";
import { Popover } from "radix-ui";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { LOCALE } from "@/lib/format";
import { motivoDiaNoHabilDate, parsearFechaLocal } from "@/lib/dias-habiles";

/**
 * Selector de fecha que solo deja elegir días hábiles.
 *
 * El `<input type="date">` nativo no puede desactivar días concretos, así que
 * sábados, domingos y feriados se podían elegir y el error llegaba después.
 * Aquí esos días aparecen tachados y no se pueden pulsar.
 */

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

function aIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function mismoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface FechaHabilPickerProps {
  /** Fecha "YYYY-MM-DD" o cadena vacía. */
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Fecha mínima "YYYY-MM-DD" (por ejemplo, la de inicio para la de fin). */
  min?: string;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  className?: string;
}

export function FechaHabilPicker({
  value,
  onChange,
  onBlur,
  min,
  id,
  placeholder = "Selecciona una fecha",
  invalid,
  className,
}: FechaHabilPickerProps) {
  const seleccionada = value ? parsearFechaLocal(value) : null;
  const minima = min ? parsearFechaLocal(min) : null;
  const [abierto, setAbierto] = React.useState(false);
  const [mes, setMes] = React.useState(() => {
    const base = seleccionada ?? minima ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // Al abrir, el calendario va al mes de la fecha elegida (o de la mínima).
  const abrir = (open: boolean) => {
    if (open) {
      const base = seleccionada ?? minima ?? new Date();
      setMes(new Date(base.getFullYear(), base.getMonth(), 1));
    } else {
      onBlur?.();
    }
    setAbierto(open);
  };

  const hoy = new Date();
  // La semana empieza en lunes: getDay() 1 → columna 0.
  const desfase = (mes.getDay() + 6) % 7;
  const diasEnMes = new Date(
    mes.getFullYear(),
    mes.getMonth() + 1,
    0,
  ).getDate();
  const celdas: (Date | null)[] = [
    ...Array.from({ length: desfase }, () => null),
    ...Array.from(
      { length: diasEnMes },
      (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1),
    ),
  ];

  const tituloMes = mes.toLocaleDateString(LOCALE, {
    month: "long",
    year: "numeric",
  });

  const cambiarMes = (delta: number) =>
    setMes((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <Popover.Root open={abierto} onOpenChange={abrir}>
      <div className={cn("relative", className)}>
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            data-invalid={invalid || undefined}
            className="flex h-10 w-full items-center gap-2 pr-8 rounded-sm border-0 border-b-2 border-b-outline-variant bg-surface-variant px-3 py-1.5 text-left font-sans text-sm text-on-surface outline-none transition-[background-color,border-color,color] focus-visible:border-b-primary focus-visible:bg-surface-container-lowest focus-visible:ring-2 focus-visible:ring-ring/30 data-invalid:border-b-danger data-invalid:bg-danger-container/40"
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <span
              className={cn(
                "truncate",
                !seleccionada && "text-muted-foreground",
              )}
            >
              {seleccionada
                ? seleccionada.toLocaleDateString(LOCALE, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : placeholder}
            </span>
          </button>
        </Popover.Trigger>
        {value && (
          <button
            type="button"
            aria-label="Quitar fecha"
            onClick={() => onChange("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-surface-container hover:text-on-surface"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[288px] max-w-[calc(100vw-32px)] rounded-sm border border-outline-variant bg-surface-container-lowest p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => cambiarMes(-1)}
              className="rounded-sm p-1.5 text-on-surface hover:bg-surface-container"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-sans text-sm font-semibold capitalize text-on-surface">
              {tituloMes}
            </span>
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => cambiarMes(1)}
              className="rounded-sm p-1.5 text-on-surface hover:bg-surface-container"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center" role="grid">
            {DIAS_SEMANA.map((d, i) => (
              <span
                key={i}
                className="py-1 font-sans text-[11px] font-semibold text-muted-foreground"
              >
                {d}
              </span>
            ))}
            {celdas.map((dia, i) => {
              if (!dia) return <span key={`vacio-${i}`} />;

              const motivo =
                minima && dia < minima
                  ? "Anterior a la fecha de inicio"
                  : motivoDiaNoHabilDate(dia);
              const activo = seleccionada && mismoDia(dia, seleccionada);
              const esHoy = mismoDia(dia, hoy);

              return (
                <button
                  key={i}
                  type="button"
                  disabled={!!motivo}
                  title={motivo ?? undefined}
                  aria-label={`${dia.toLocaleDateString(LOCALE, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}${motivo ? ` — ${motivo}` : ""}`}
                  aria-pressed={activo || undefined}
                  onClick={() => {
                    onChange(aIso(dia));
                    abrir(false);
                  }}
                  className={cn(
                    "h-9 rounded-sm font-sans text-sm tabular-nums transition-colors",
                    motivo
                      ? "cursor-not-allowed text-muted-foreground/50 line-through"
                      : "text-on-surface hover:bg-primary-container/60",
                    esHoy &&
                      !activo &&
                      "font-semibold ring-1 ring-inset ring-outline-variant",
                    activo &&
                      "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  {dia.getDate()}
                </button>
              );
            })}
          </div>

          <p className="mt-2 font-sans text-[11px] text-muted-foreground">
            Sábados, domingos y feriados no están disponibles.
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
