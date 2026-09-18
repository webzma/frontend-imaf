"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { UserMenu } from "./UserMenu";
import { breadcrumbsFromPath } from "@/lib/admin-nav";
import { useNotifCount } from "@/hooks/use-notif-count";

/**
 * Cabecera del panel.
 *
 * Era una barra de 48px con un botón de menú y el texto "IMAF Admin". Ahora
 * lleva lo que hace falta en cualquier pantalla: dónde estoy, buscar, qué hay
 * pendiente y quién soy.
 */
export function AdminHeader() {
  const pathname = usePathname();
  const [buscando, setBuscando] = useState(false);
  const unreadCount = useNotifCount();
  const crumbs = breadcrumbsFromPath(pathname);

  // ⌘K / Ctrl+K desde cualquier punto del panel.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setBuscando((abierto) => !abierto);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-outline-variant bg-surface-container-low/95 px-4 supports-backdrop-filter:backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground transition-colors hover:text-on-surface" />
      <div className="h-4 w-px shrink-0 bg-outline-variant" />

      <Breadcrumb items={crumbs} className="flex-1" />

      <button
        type="button"
        onClick={() => setBuscando(true)}
        className="flex items-center gap-2 rounded-md border border-outline-variant px-2.5 py-1.5 font-sans text-xs text-muted-foreground transition-colors hover:border-primary hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search aria-hidden="true" className="size-3.5" />
        <span className="hidden sm:inline">Buscar</span>
        {/* El atajo se anuncia como texto, no solo como adorno visual. */}
        <kbd className="hidden rounded-sm bg-surface-container px-1.5 py-0.5 font-sans text-[10px] tracking-wide md:inline">
          Ctrl K
        </kbd>
      </button>

      <Link
        href="/admin/notificaciones"
        className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell aria-hidden="true" className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
        )}
        <span className="sr-only">
          Notificaciones
          {unreadCount > 0 ? `: ${unreadCount} sin leer` : ""}
        </span>
      </Link>

      <UserMenu />

      <GlobalSearch open={buscando} onOpenChange={setBuscando} />
    </header>
  );
}
