import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // ── Status variants ──
        activo:
          "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
        inactivo:
          "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10",
        graduado:
          "text-primary dark:text-primary bg-primary/10 dark:bg-primary/20",
        pendiente:
          "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10",
        aprobado:
          "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
        rechazado:
          "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
        programada:
          "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10",
        realizada:
          "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
        cancelada:
          "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
        reprobado:
          "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
        licenciatura:
          "text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10",
        maestria:
          "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
        doctorado:
          "text-primary dark:text-primary bg-primary/10 dark:bg-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
