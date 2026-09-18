import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Misma gramática de foco que `Input`: fondo que aclara y borde inferior en
 * `primary`. Antes las descripciones largas usaban `<textarea>` crudo, que no
 * heredaba ni el estado de foco ni el de error.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-20 w-full min-w-0 resize-y rounded-sm border-0 border-b-2 border-b-outline-variant bg-surface-variant px-3 py-2 font-sans text-sm text-on-surface shadow-none transition-[background-color,border-color,color] outline-none placeholder:text-muted-foreground focus-visible:bg-surface-container-lowest focus-visible:border-b-primary focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-danger aria-invalid:bg-danger-container/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
