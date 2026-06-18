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
    ],
  },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

const PROFILE_KEY = ["instructor", "me"] as const;

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

export default function InstructorSidebar() {
  const pathname = usePathname();
  const { push } = useRouter();
  const { toggleSidebar, state } = useSidebar();
  const [dark, setDark] = useState(false);

  const { data: profile } = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: fetchProfile,
  });
  const nombre = profile?.nombre ?? null;
  const email = profile?.email ?? null;

  // Initialize theme from storage / system preference
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

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
    if (
      typeof window !== "undefined" &&
      window.innerWidth < 768 &&
      state === "expanded"
    ) {
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
              <p className="font-sans text-[10px] text-sidebar-foreground/60 -mt-0.5 tracking-[0.2em] uppercase">
                Instructor
              </p>
            </div>
          )}
        </div>
        {typeof window !== "undefined" &&
          window.innerWidth < 768 &&
          state === "expanded" && (
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
                        <Link href={item.href} onClick={handleLinkClick}>
                          <item.icon />
                          <span>{item.label}</span>
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
              <p className="font-sans text-[10px] text-sidebar-foreground/40 truncate">
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
