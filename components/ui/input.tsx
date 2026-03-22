import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-sm border-0 border-b border-b-outline-variant bg-surface-variant px-3 py-1.5 font-sans text-sm text-on-surface shadow-none transition-[background-color,border-color,color] outline-none placeholder:text-muted-foreground/50 focus-visible:bg-surface-container-high focus-visible:border-b-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-b-destructive aria-invalid:bg-destructive/5",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
