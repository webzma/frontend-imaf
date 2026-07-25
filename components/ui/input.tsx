import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // El foco cambia fondo Y engrosa el borde inferior a primary (4.68:1
        // contra el fondo del campo). Antes el estado de foco era un cambio de
        // fondo de 1.03:1 — invisible.
        "h-10 w-full min-w-0 rounded-sm border-0 border-b-2 border-b-outline-variant bg-surface-variant px-3 py-1.5 font-sans text-sm text-on-surface shadow-none transition-[background-color,border-color,color] outline-none placeholder:text-muted-foreground focus-visible:bg-surface-container-lowest focus-visible:border-b-primary focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-danger aria-invalid:bg-danger-container/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
