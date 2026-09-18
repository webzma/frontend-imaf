import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * Rastro de navegación real.
 *
 * Antes el `eyebrow` del encabezado imitaba una ruta ("Gestión / Cursos") con
 * texto plano: parecía navegable y no llevaba a ninguna parte.
 */
function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Ruta de navegación" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1.5 overflow-hidden">
        {items.map((item, i) => {
          const ultimo = i === items.length - 1;

          return (
            <li
              key={`${item.label}-${i}`}
              className="flex items-center gap-1.5"
            >
              {i > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3 shrink-0 text-muted-foreground"
                />
              )}
              {item.href && !ultimo ? (
                <Link
                  href={item.href}
                  className="truncate font-sans text-xs text-muted-foreground transition-colors hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={ultimo ? "page" : undefined}
                  className={cn(
                    "truncate font-sans text-xs",
                    ultimo
                      ? "text-on-surface font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumb };
