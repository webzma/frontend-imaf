"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Campo de formulario con su etiqueta y su error.
 *
 * El `id` se genera aquí y se inyecta en el control, de modo que la etiqueta
 * queda asociada de verdad (pulsarla enfoca el campo) y el mensaje de error se
 * anuncia con él vía `aria-describedby`. Escrito a mano en cada pantalla, ese
 * enlace se olvidaba la mitad de las veces.
 */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  /** Aclaración corta junto a la etiqueta ("Opcional", formato esperado…). */
  hint?: string;
  error?: string;
  children: React.ReactElement;
  className?: string;
}) {
  const id = React.useId();
  const errorId = `${id}-error`;

  const control = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        {
          id,
          "aria-describedby": error ? errorId : undefined,
          "aria-invalid": error ? true : undefined,
        },
      )
    : children;

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {hint && (
          <span className="ml-1 font-normal text-muted-foreground">
            ({hint})
          </span>
        )}
      </Label>
      {control}
      {error && (
        <p id={errorId} role="alert" className="font-sans text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
