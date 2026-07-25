"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export interface MobileNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Solo activo con coincidencia exacta de ruta (para el índice del rol). */
  exact?: boolean;
  /** Muestra el punto de no leídas sobre este ítem. */
  badge?: boolean;
}

interface MobileNavbarProps {
  items: MobileNavItem[];
  /** Endpoint que devuelve `{ unread_count }`. Si se omite, no hay punto. */
  countUrl?: string;
  countQueryKey?: readonly unknown[];
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

/**
 * Coincidencia por segmento de ruta. `/estudiante/cursos` y `/estudiante/curso`
 * ya no colisionan, así que no hacen falta las exclusiones pareadas a mano que
 * había antes (seis condiciones hardcodeadas por navbar).
 */
function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNavbar({
  items,
  countUrl,
  countQueryKey,
}: MobileNavbarProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: countQueryKey ?? ["mobile-navbar", "count", countUrl],
    enabled: Boolean(countUrl),
    refetchInterval: 30000,
    queryFn: async () => {
      const res = await fetch(countUrl!, {
        headers: {
          Authorization: `Bearer ${getCookie("token")}`,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      return (data.unread_count as number) || 0;
    },
  });

  // Mantiene el contador en sync cuando se lee una notificación en otra vista.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ count: number }>).detail;
      queryClient.setQueryData(
        countQueryKey ?? ["mobile-navbar", "count", countUrl],
        detail.count,
      );
    };
    window.addEventListener("notificationRead", handler);
    return () => window.removeEventListener("notificationRead", handler);
  }, [queryClient, countQueryKey, countUrl]);

  return (
    // La visibilidad la decide CSS, no `window.innerWidth` en un efecto: antes
    // el nav aparecía de golpe tras la hidratación y no reaccionaba al rotar.
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant bg-surface pb-safe md:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          const showBadge = item.badge && unreadCount > 0;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-center transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-on-surface",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {showBadge && (
                    <span className="absolute -right-1.5 -top-0.5 size-2 rounded-full bg-primary" />
                  )}
                </span>
                <span className="text-[11px] leading-tight font-medium">
                  {item.label}
                </span>
                {showBadge && (
                  <span className="sr-only">{unreadCount} sin leer</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
