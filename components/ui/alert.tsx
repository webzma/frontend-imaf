import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Bloque de aviso a nivel de página o de formulario.
 *
 * Existe porque los quince bloques de error del panel eran `<div>` con clases
 * de color: visibles para quien mira la pantalla, mudos para un lector de
 * pantalla. Aquí el `role` va dentro del componente, así que un error nuevo
 * nace anunciándose.
 */
const alertVariants = cva(
  "flex items-start gap-3 rounded-lg px-4 py-3 font-sans text-sm",
  {
    variants: {
      variant: {
        danger: "bg-danger-container text-on-danger-container",
        warning: "bg-warning-container text-on-warning-container",
        success: "bg-success-container text-on-success-container",
        info: "bg-info-container text-on-info-container",
      },
    },
    defaultVariants: { variant: "danger" },
  },
);

const ICONOS: Record<string, LucideIcon> = {
  danger: XCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

function Alert({
  className,
  variant = "danger",
  icon: IconProp,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & { icon?: LucideIcon | null }) {
  const Icon =
    IconProp === null ? null : (IconProp ?? ICONOS[variant ?? "danger"]);

  return (
    <div
      data-slot="alert"
      // `alert` interrumpe al lector de pantalla; `status` espera a una pausa.
      // Un error bloquea la tarea, un éxito no.
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="alert-title"
      className={cn("font-semibold", className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("[&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
