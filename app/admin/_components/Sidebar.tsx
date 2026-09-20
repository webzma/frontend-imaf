"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar } from "@/components/avatar";
import { useTheme } from "@/hooks/use-theme";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { useAdminProfile } from "@/hooks/use-admin-profile";
import { useNotifCount } from "@/hooks/use-notif-count";
import logoImaf from "@/public/logo-imaf.webp";
import logoImafDark from "@/public/logo-imaf-dark.webp";

export default function AppSidebar() {
  const pathname = usePathname();
  const { dark } = useTheme();
  const { toggleSidebar, state, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const unreadCount = useNotifCount();
  const { data: perfil } = useAdminProfile();
  const logo = dark ? logoImafDark : logoImaf;

  const nombre = perfil?.name ?? "Administrador";
  const email = perfil?.email ?? "";

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const handleLinkClick = () => {
    if (isMobile && state === "expanded") {
      // Pequeño retraso para que la navegación arranque antes de cerrar.
      setTimeout(() => toggleSidebar(), 50);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="transition-transform duration-300 ease-in-out md:transition-none"
    >
      <SidebarHeader className="relative border-b border-sidebar-border p-5">
        <div className="flex items-center gap-3">
          <div
            className={`size-8 shrink-0 flex items-center justify-center ambient-shadow transition-transform duration-200 ${collapsed ? "-translate-x-3" : ""}`}
          >
            <Image src={logo} alt="IMAF" width={28} height={28} />
          </div>
          {!collapsed && (
            <div>
              <span className="font-sans font-semibold tracking-tight text-sidebar-foreground">
                IMAF
              </span>
              <p className="-mt-0.5 font-sans text-[10px] tracking-[0.2em] uppercase text-sidebar-foreground/70">
                Admin
              </p>
            </div>
          )}
        </div>

        {isMobile && state === "expanded" && (
          <button
            onClick={toggleSidebar}
            className="absolute top-5 right-5 rounded-sm p-1.5 transition-colors hover:bg-sidebar-accent/50 md:hidden"
            aria-label="Cerrar menú lateral"
          >
            <X className="size-4 text-sidebar-foreground" />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Los grupos salen de `ADMIN_NAV`, y solo los que tienen elementos:
            antes había un grupo "Mi Cuenta" vacío que pintaba su etiqueta
            flotando sobre la nada. */}
        {ADMIN_NAV.filter((grupo) => grupo.items.length > 0).map((grupo) => (
          <SidebarGroup key={grupo.section}>
            <SidebarGroupLabel className="font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-sidebar-foreground/70">
              {grupo.section}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href, item.exact)}
                      tooltip={item.label}
                    >
                      <Link href={item.href} onClick={handleLinkClick}>
                        <item.icon />
                        <span>{item.label}</span>
                        {item.badge && unreadCount > 0 && (
                          <>
                            <span className="ml-auto size-2 rounded-full bg-primary" />
                            <span className="sr-only">
                              {unreadCount} sin leer
                            </span>
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* El pie identifica a quien tiene la sesión abierta y lleva a su cuenta.
          Tema y cierre de sesión viven ahora en el menú de la cabecera, que se
          alcanza también con la barra colapsada. */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={nombre} className="h-auto py-2">
              <Link href="/admin/perfil" onClick={handleLinkClick}>
                <Avatar name={nombre} size={7} tone="sidebar" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-sans text-xs font-semibold text-sidebar-foreground">
                    {nombre}
                  </span>
                  {email && (
                    <span className="truncate font-sans text-[10px] text-sidebar-foreground/70">
                      {email}
                    </span>
                  )}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
