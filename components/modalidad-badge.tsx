import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { MODALIDAD, MODALIDAD_DETALLE } from "@/lib/modalidad";

/** Etiqueta "Presencial" para fichas y tarjetas de curso. */
export function ModalidadBadge({ className }: { className?: string }) {
  return (
    <span
      title={MODALIDAD_DETALLE}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-info-container px-2 py-0.5 font-sans text-[10px] font-semibold text-on-info-container",
        className,
      )}
    >
      <MapPin aria-hidden="true" className="size-3" />
      {MODALIDAD}
    </span>
  );
}
