"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  BookOpen,
  CalendarDays,
  LogOut,
  Moon,
  Sun,
  X,
  Bell,
} from "lucide-react";
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
import { useTheme } from "@/hooks/use-theme";
import logoImaf from "@/public/logo-imaf.webp";
import Image from "next/image";

const navItems = [
  {
    section: "General",
    items: [
      {
        label: "Dashboard",
        href: "/instructor",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    section: "Mi trabajo",
    items: [
      {
        label: "Mis Cursos",
        href: "/instructor/mis-cursos",
        icon: BookOpen,
        exact: false,
      },
      {
        label: "Mi Horario",
        href: "/instructor/horario",
        icon: CalendarDays,
        exact: false,
      },
      {
        label: "Mi Perfil",
        href: "/instructor/perfil",
        icon: User,
        exact: false,
      },
      {
        label: "Notificaciones",
        href: "/instructor/notificaciones",
        icon: Bell,
        exact: false,
      },
    ],
  },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

const PROFILE_KEY = ["instructor", "me"] as const;
const NOTIF_COUNT_KEY = ["instructor", "notificaciones", "count"] as const;

async function fetchProfile(): Promise<{
  nombre: string | null;
  email: string | null;
}> {
  const res = await fetch(`${process.env.API_URL}api/me`, {
    headers: {
      Authorization: `Bearer ${getCookie("token")}`,
      Accept: "application/json",
    },
  });
  const data = await res.json();
  return {
    nombre: data?.name ?? null,
    email: data?.email ?? null,
  };
}

async function fetchNotificationCount(): Promise<number> {
  const res = await fetch(
    `${process.env.API_URL}api/profesor/notificaciones/count`,
    {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
        Accept: "application/json",
      },
    },
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.unread_count || 0;
}

export default function InstructorSidebar() {
  const pathname = usePathname();
  const { push } = useRouter();
  const { toggleSidebar, state, isMobile } = useSidebar();
  const { dark, toggle: toggleDark } = useTheme();

  const { data: profile } = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: fetchProfile,
  });
  const nombre = profile?.nombre ?? null;
  const email = profile?.email ?? null;

  const [unreadCount, setUnreadCount] = useState(0);

  // Use react-query for initial fetch and generic polling
  const { data: initialUnread } = useQuery({
    queryKey: NOTIF_COUNT_KEY,
    queryFn: fetchNotificationCount,
    refetchInterval: 30000, // Background poll every 30s
  });

  useEffect(() => {
    if (typeof initialUnread === "number") {
      setUnreadCount(initialUnread);
    }
  }, [initialUnread]);

  // Listen for custom events to update local state immediately
  useEffect(() => {
    const handleNotificationRead = (e: CustomEvent) => {
      if (e.detail.type === "all") {
        setUnreadCount(0);
      } else if (
        e.detail.type === "single" &&
        typeof e.detail.count === "number"
      ) {
        setUnreadCount(e.detail.count);
      }
    };

    window.addEventListener(
      "notificationRead",
      handleNotificationRead as EventListener,
    );
    return () => {
      window.removeEventListener(
        "notificationRead",
        handleNotificationRead as EventListener,
      );
    };
  }, []);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.API_URL}api/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getCookie("token")}`,
          Accept: "application/json",
        },
      });
    } finally {
      document.cookie = "token=; path=/; max-age=0";
      document.cookie = "role=; path=/; max-age=0";
      push("/login");
    }
  };

  const handleLinkClick = () => {
    if (isMobile && state === "expanded") {
      setTimeout(() => toggleSidebar(), 50);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="transition-transform duration-300 ease-in-out md:transition-none"
    >
      <SidebarHeader className="border-b border-sidebar-border p-5 shrink-0 relative">
        <div className="flex items-center gap-3">
          <div
            className={`size-8 flex items-center justify-center ambient-shadow shrink-0 transition-transform duration-200 ${state === "collapsed" ? "-translate-x-3" : ""}`}
          >
            <Image src={logoImaf} alt="IMAF" width={28} height={28} />
          </div>
          {state !== "collapsed" && (
            <div>
              <span className="font-sans font-semibold text-sidebar-foreground tracking-tight">
                IMAF
              </span>
              <p className="font-sans text-[10px] text-sidebar-foreground/70 -mt-0.5 tracking-[0.2em] uppercase">
                Instructor
              </p>
            </div>
          )}
        </div>
        {isMobile && state === "expanded" && (
          <button
            onClick={toggleSidebar}
            className="absolute top-5 right-5 p-1.5 rounded-sm hover:bg-sidebar-accent/50 transition-colors md:hidden"
            aria-label="Cerrar sidebar"
          >
            <X className="size-4 text-sidebar-foreground" />
          </button>
        )}
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {navItems.map((group) => (
            <SidebarGroup key={group.section}>
              <SidebarGroupLabel className="font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-sidebar-foreground/70">
                {group.section}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href, item.exact)}
                        tooltip={item.label}
                      >
                        <Link href={item.href} onClick={handleLinkClick}>
                          <item.icon />
                          <span>{item.label}</span>
                          {item.label === "Notificaciones" &&
                            unreadCount > 0 && (
                              <span className="size-2 bg-primary rounded-full ml-auto" />
                            )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border shrink-0">
        {state !== "collapsed" && nombre && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm bg-sidebar-accent/40">
            <div className="size-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {getInitials(nombre)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-semibold text-sidebar-foreground truncate">
                {nombre}
              </p>
              <p className="font-sans text-[10px] text-sidebar-foreground/70 truncate">
                {email ?? "instructor"}
              </p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleDark}
              tooltip={dark ? "Modo claro" : "Modo oscuro"}
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {dark ? <Sun /> : <Moon />}
              <span>{dark ? "Modo claro" : "Modo oscuro"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar sesión"
              className="text-sidebar-foreground/50 hover:text-danger hover:bg-danger-container"
            >
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
