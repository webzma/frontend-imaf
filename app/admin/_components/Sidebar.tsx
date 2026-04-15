"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  LogOut,
  BarChart2,
  Moon,
  Sun,
  CreditCard,
  Bell,
  X,
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
import logoImaf from "@/public/logo-imaf.webp";
import Image from "next/image";

const navItems = [
  {
    section: "General",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    section: "Gestión",
    items: [
      {
        label: "Estudiantes",
        href: "/admin/estudiantes",
        icon: Users,
        exact: false,
      },
      {
        label: "Profesores",
        href: "/admin/profesores",
        icon: GraduationCap,
        exact: false,
      },
      { label: "Cursos", href: "/admin/cursos", icon: BookOpen, exact: false },
      { label: "Pagos", href: "/admin/pagos", icon: CreditCard, exact: false },
      {
        label: "Notificaciones",
        href: "/admin/notificaciones",
        icon: Bell,
        exact: false,
      },
    ],
  },
  {
    section: "Analítica",
    items: [
      {
        label: "Reportes",
        href: "/admin/reportes",
        icon: BarChart2,
        exact: false,
      },
    ],
  },
  {
    section: "Mi Cuenta",
    items: [],
  },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === "collapsed";
  const [dark, setDark] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    // Fetch notifications count
    const fetchNotifications = () => {
      fetch(`${process.env.API_URL}api/admin/notificaciones/count`, {
        headers: {
          Authorization: `Bearer ${getCookie("token")}`,
          Accept: "application/json",
        },
      })
        .then((r) => r.json())
        .then((data) => {
          setUnreadCount(data.unread_count || 0);
        })
        .catch(() => {});
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

    // Listen for notification read events
    const handleNotificationRead = (event: CustomEvent) => {
      setUnreadCount(event.detail.count);
    };

    window.addEventListener(
      "notificationRead",
      handleNotificationRead as EventListener,
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "notificationRead",
        handleNotificationRead as EventListener,
      );
    };
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

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
      router.push("/login");
    }
  };

  const handleLinkClick = (_href: string) => {
    // Close sidebar only on mobile when clicking a link
    if (
      typeof window !== "undefined" &&
      window.innerWidth < 768 &&
      state === "expanded"
    ) {
      // Small delay to ensure navigation starts first
      setTimeout(() => {
        toggleSidebar();
      }, 50);
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className="transition-transform duration-300 ease-in-out md:transition-none"
    >
      {/* Logo */}
      <SidebarHeader className="border-b border-sidebar-border px-5 py-5 relative">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 flex items-center justify-center ambient-shadow shrink-0 transition-transform duration-200 ${collapsed ? "-translate-x-3" : ""}`}
          >
            <Image src={logoImaf} alt="IMAF" width={28} height={28} />
          </div>
          {!collapsed && (
            <div>
              <span className="font-sans font-semibold text-sidebar-foreground tracking-tight">
                IMAF
              </span>
              <p className="font-sans text-[10px] text-sidebar-foreground/60 -mt-0.5 tracking-[0.2em] uppercase">
                Admin
              </p>
            </div>
          )}
        </div>
        {/* Close button for mobile */}
        {typeof window !== "undefined" &&
          window.innerWidth < 768 &&
          state === "expanded" && (
            <button
              onClick={toggleSidebar}
              className="absolute top-5 right-5 p-1.5 rounded-sm hover:bg-sidebar-accent/50 transition-colors md:hidden"
              aria-label="Cerrar sidebar"
            >
              <X className="w-4 h-4 text-sidebar-foreground" />
            </button>
          )}
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.section}>
            <SidebarGroupLabel className="font-sans text-[10px] font-medium tracking-[0.2em] uppercase text-sidebar-foreground/55">
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
                      <Link
                        href={item.href}
                        onClick={() => handleLinkClick(item.href)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                        {item.label === "Notificaciones" && unreadCount > 0 && (
                          <span className="w-2 h-2 bg-pink-500 rounded-full ml-auto" />
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

      {/* Bottom - user + logout */}
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm bg-sidebar-accent/40">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-semibold text-sidebar-foreground truncate">
                Administrador
              </p>
              <p className="font-sans text-[10px] text-sidebar-foreground/40 truncate">
                admin
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
              className="text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
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
