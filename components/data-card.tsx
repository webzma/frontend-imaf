import { cn } from "@/lib/utils";

/**
 * Equivalente móvil de una fila de tabla. Por debajo de `md` las tablas de 6
 * columnas obligaban a desplazarse en horizontal para leer un solo registro;
 * aquí cada registro es una tarjeta autocontenida y la página solo hace scroll
 * vertical.
 */
export function DataCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "border-b border-outline-variant px-4 py-4 last:border-b-0",
        className,
      )}
    >
      {children}
    </li>
  );
}

/** Cabecera: identidad del registro a la izquierda, estado a la derecha. */
export function DataCardHeader({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">{children}</div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}

/** Par etiqueta/valor. La etiqueta sustituye al `<th>` que ya no está. */
export function DataCardField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 font-sans text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right font-sans text-sm text-on-surface">
        {children}
      </dd>
    </div>
  );
}

export function DataCardFields({ children }: { children: React.ReactNode }) {
  return (
    <dl className="mt-3 space-y-1.5 border-t border-outline-variant pt-3">
      {children}
    </dl>
  );
}

/** Acciones del registro, alineadas al final. */
export function DataCardActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-center justify-end gap-2">{children}</div>
  );
}
