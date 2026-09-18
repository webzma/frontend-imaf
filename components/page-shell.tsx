import { cn } from "@/lib/utils";

/**
 * Caja de una página del panel.
 *
 * Las veintidós pantallas repetían el mismo par de divs con el mismo ancho
 * máximo y el mismo relleno. Cuando una se desviaba, su contenido dejaba de
 * alinear con el de las demás al navegar.
 */
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-full bg-surface">
      <div className={cn("mx-auto max-w-8xl px-4 py-10 md:px-10", className)}>
        {children}
      </div>
    </div>
  );
}
