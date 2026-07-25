"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Total de elementos, para el texto "1–10 de 240". */
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /**
   * Nombre del elemento listado, en singular y plural. En español el plural no
   * siempre es +"s" ("instructor" → "instructores"), así que se pasan los dos.
   */
  itemLabel?: [singular: string, plural: string];
  className?: string;
}

/**
 * Ventana de páginas: primera, última, actual ±1, con elipsis.
 * Renderizar todas las páginas rompe con listas grandes (240 registros a 10 por
 * página serían 24 botones en una fila).
 */
function buildRange(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("gap");
    out.push(n);
    prev = n;
  }
  return out;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const range = buildRange(page, totalPages);

  const navBtn =
    "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-container hover:text-on-surface disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <nav
      aria-label="Paginación"
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-3 border-t border-outline-variant px-4 py-3 sm:flex-row sm:px-6",
        className,
      )}
    >
      <p className="font-sans text-xs text-muted-foreground" aria-live="polite">
        {from}–{to} de {totalItems}
        {itemLabel ? ` ${totalItems === 1 ? itemLabel[0] : itemLabel[1]}` : ""}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Página anterior"
          className={navBtn}
        >
          <ChevronLeft className="size-4" />
        </button>

        {range.map((n, i) =>
          n === "gap" ? (
            <span
              key={`gap-${i}`}
              aria-hidden="true"
              className="px-1 font-sans text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-label={`Página ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "size-8 rounded-md font-sans text-xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                n === page
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface-container hover:text-on-surface",
              )}
            >
              {n}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Página siguiente"
          className={navBtn}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}
