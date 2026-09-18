"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { mensajeDeError } from "@/lib/api-client";

/**
 * Fallo de carga con salida.
 *
 * Un `<div>` rojo que dice "Error al conectar con el servidor" deja a la
 * persona sin nada que hacer salvo recargar la página entera. Aquí el error se
 * anuncia (`role="alert"`) y trae el botón de reintentar al lado.
 */
export function ErrorState({
  error,
  onRetry,
  fallback = "No se pudieron cargar los datos.",
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  fallback?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg bg-danger-container px-4 py-3 text-on-danger-container sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p className="font-sans text-sm">{mensajeDeError(error, fallback)}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0 gap-1.5"
        >
          <RotateCw className="size-3.5" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
