"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface FormPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Mensaje de error del envío. Se anuncia solo: va dentro de un `Alert`. */
  error?: string;
  submitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Formulario largo en un panel lateral.
 *
 * Crear un estudiante son quince campos. Metidos en un modal centrado con
 * `max-h-[90vh] overflow-y-auto`, el usuario hacía scroll dentro de una caja
 * flotante, perdía de vista el botón de guardar y, si fallaba la validación de
 * un campo de arriba, el mensaje aparecía fuera de la vista. Aquí el panel
 * ocupa el alto completo, el pie queda fijo y el error vive arriba del todo,
 * donde se lee antes de volver a intentar.
 */
export function FormPanel({
  open,
  onOpenChange,
  title,
  description,
  error,
  submitting = false,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  onSubmit,
  disabled = false,
  children,
  className,
}: FormPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "w-full gap-0 p-0 sm:max-w-lg data-[side=right]:sm:max-w-lg",
          className,
        )}
      >
        <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
          <SheetHeader className="border-b border-outline-variant px-6 py-5 pr-14">
            <SheetTitle className="font-serif text-2xl font-semibold text-on-surface">
              {title}
            </SheetTitle>
            {description && (
              <SheetDescription className="font-sans">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {error && <Alert variant="danger">{error}</Alert>}
            {children}
          </div>

          {/* Pie fijo: el botón de guardar nunca se va con el scroll. */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-outline-variant bg-surface-container-low px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={submitting || disabled}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/** Agrupa campos relacionados dentro del panel. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h3 className="font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
          {title}
        </h3>
        {description && (
          <p className="mt-1 font-sans text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Rejilla de campos: una columna en móvil, dos a partir de `sm`. */
export function FormGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>
  );
}
