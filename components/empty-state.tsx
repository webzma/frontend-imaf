import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  /** Qué pasa, en una frase corta. */
  title: string;
  /** Por qué está vacío y qué puede hacer la persona. */
  description?: string;
  /** Acción para salir del vacío: crear el primer registro, limpiar filtros… */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Estado vacío con las tres piezas que necesita para ser útil: un ancla visual,
 * una explicación y una salida. Una frase suelta centrada deja a la persona sin
 * saber si la lista está vacía, si falló algo o si sus filtros no coinciden.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-container-high">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="font-sans text-sm font-semibold text-on-surface">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm font-sans text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
