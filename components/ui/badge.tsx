import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import {
  Ban,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  MinusCircle,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // min-h en vez de h fija y sin overflow-hidden: las etiquetas largas en
  // español ("Pendiente de aprobación") se recortaban.
  "group/badge inline-flex min-h-5 w-fit shrink-0 items-center justify-center gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-danger [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground [a]:hover:bg-primary-hover",
        secondary:
          "bg-secondary-container text-on-secondary-container [a]:hover:bg-secondary-container/80",
        destructive:
          "bg-danger-container text-on-danger-container [a]:hover:bg-danger-container/70",
        outline:
          "border-outline-variant text-on-surface [a]:hover:bg-surface-container",
        ghost:
          "text-muted-foreground hover:bg-surface-container hover:text-on-surface",
        link: "text-primary underline-offset-4 hover:underline",
        neutral: "bg-surface-container-high text-on-surface",

        // ── Estados ──
        // Cuatro significados semánticos (success / warning / danger / info) y
        // un icono propio por estado. El color nunca es el único canal: dos
        // estados que comparten familia cromática se distinguen por el icono.
        activo: "bg-success-container text-on-success-container",
        inactivo: "bg-surface-container-high text-muted-foreground",
        graduado: "bg-primary-container text-on-primary-container",
        pendiente: "bg-warning-container text-on-warning-container",
        aprobado: "bg-success-container text-on-success-container",
        rechazado: "bg-danger-container text-on-danger-container",
        programada: "bg-info-container text-on-info-container",
        realizada: "bg-success-container text-on-success-container",
        cancelada: "bg-danger-container text-on-danger-container",
        reprobado: "bg-danger-container text-on-danger-container",

        // ── Titulaciones (una escala, no un estado) ──
        licenciatura: "bg-surface-container-high text-on-surface",
        maestria: "bg-info-container text-on-info-container",
        doctorado: "bg-primary-container text-on-primary-container",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** Cada estado lleva su propio icono para no depender solo del color (WCAG 1.4.1). */
const statusIcons: Partial<
  Record<string, React.ComponentType<{ className?: string }>>
> = {
  activo: CheckCircle2,
  inactivo: MinusCircle,
  graduado: GraduationCap,
  pendiente: Clock,
  aprobado: CheckCircle2,
  rechazado: XCircle,
  programada: CalendarClock,
  realizada: CheckCheck,
  cancelada: Ban,
  reprobado: XCircle,
};

function Badge({
  className,
  variant = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";
  const StatusIcon = variant ? statusIcons[variant] : undefined;

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {StatusIcon && !asChild ? (
        <>
          <StatusIcon aria-hidden="true" />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Badge, badgeVariants };
