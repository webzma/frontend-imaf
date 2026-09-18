"use client";

import * as React from "react";
import { Loader2, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterSpec {
  /** Clave del filtro, la misma que en `defaultFilters` del hook. */
  key: string;
  /** Etiqueta accesible del desplegable. */
  label: string;
  options: FilterOption[];
}

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  /** Etiqueta accesible del buscador (no hay `<label>` visible). */
  searchLabel: string;
  filters?: FilterSpec[];
  values?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
  hasFilters?: boolean;
  /** Indicador discreto de consulta en vuelo. */
  busy?: boolean;
  className?: string;
}

/**
 * Buscador y filtros de una lista.
 *
 * Los cinco listados del panel repetían este bloque con anchos distintos
 * (`w-42`, `w-44`, `w-48`), de modo que los desplegables no alineaban entre
 * pantallas. Aquí los filtros se declaran como datos y el ancho lo decide la
 * rejilla, no cada llamada.
 */
export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  searchLabel,
  filters = [],
  values = {},
  onFilterChange,
  onReset,
  hasFilters = false,
  busy = false,
  className,
}: ListToolbarProps) {
  const searchId = React.useId();

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center",
        className,
      )}
    >
      <div className="relative w-full md:max-w-xs">
        <label htmlFor={searchId} className="sr-only">
          {searchLabel}
        </label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={searchId}
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
        {busy && (
          <Loader2
            aria-hidden="true"
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        )}
      </div>

      {filters.map((filtro) => (
        <Select
          key={filtro.key}
          value={values[filtro.key] ?? filtro.options[0]?.value}
          onValueChange={(value) => onFilterChange?.(filtro.key, value)}
        >
          <SelectTrigger
            aria-label={filtro.label}
            className="h-10 w-full font-sans text-sm md:w-48"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filtro.options.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {hasFilters && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 self-start rounded-sm font-sans text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden="true" className="size-3" />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
