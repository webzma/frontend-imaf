import { cn } from "@/lib/utils";

/**
 * Primitivas para fichas de solo lectura. Antes, los datos completos de un
 * estudiante o instructor solo se veían abriendo el formulario de edición, lo
 * que obligaba a entrar en modo escritura para una simple consulta.
 */

export function DetailSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <h3 className="font-sans text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {title}
      </h3>
      <dl className="divide-y divide-outline-variant">{children}</dl>
    </section>
  );
}

export function DetailField({
  label,
  children,
  /** Texto cuando no hay dato. Se muestra en gris para distinguirlo de un valor. */
  empty = "No especificado",
}: {
  label: string;
  children?: React.ReactNode;
  empty?: string;
}) {
  const isEmpty =
    children === null ||
    children === undefined ||
    children === "" ||
    children === "—";

  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <dt className="shrink-0 font-sans text-sm text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-right font-sans text-sm",
          isEmpty ? "text-muted-foreground" : "text-on-surface font-medium",
        )}
      >
        {isEmpty ? empty : children}
      </dd>
    </div>
  );
}

/** Cabecera de la ficha: avatar, identidad y estado. */
export function DetailHeader({
  initials,
  name,
  email,
  badge,
}: {
  initials: string;
  name: string;
  email: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-outline-variant pb-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-container">
          <span className="font-sans text-base font-bold text-on-primary-container">
            {initials}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate font-sans text-base font-semibold text-on-surface">
            {name}
          </p>
          <p className="truncate font-sans text-sm text-muted-foreground">
            {email}
          </p>
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}
