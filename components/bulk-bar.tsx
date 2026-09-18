"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Barra de acciones sobre la selección.
 *
 * Aparece dentro de la cabecera de la tabla, en lugar del conteo, para que no
 * empuje la lista hacia abajo al aparecer.
 */
export function BulkBar({
  count,
  label,
  onClear,
  children,
}: {
  count: number;
  /** Singular y plural del elemento seleccionado. */
  label: [string, string];
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p
        aria-live="polite"
        className="font-sans text-xs font-medium text-on-surface"
      >
        {count} {count === 1 ? label[0] : label[1]} seleccionad
        {count === 1 ? "o" : "os"}
      </p>
      <div className="flex items-center gap-2">{children}</div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClear}
        aria-label="Quitar la selección"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
