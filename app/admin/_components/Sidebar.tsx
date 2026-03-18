"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    section: "General",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    section: "Gestión",
    items: [
      { label: "Estudiantes", href: "/admin/estudiantes", icon: Users, exact: false },
      { label: "Profesores",  href: "/admin/profesores",  icon: GraduationCap, exact: false },
      { label: "Cursos",      href: "/admin/cursos",      icon: BookOpen, exact: false },
    ],
  },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/logout", {
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

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col bg-sidebar border-r border-sidebar-border z-20">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_top_left,oklch(0.64_0.29_316/0.12)_0%,transparent_70%)] pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border relative">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_oklch(0.64_0.29_316/0.5)] flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14M4 19h16M8 7h8M8 11h5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M15 15l2 2 4-4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <span className="font-bold text-sidebar-foreground tracking-tight">
            Edu<span className="text-primary">Flow</span>
          </span>
          <p className="text-[10px] text-sidebar-foreground/40 -mt-0.5 tracking-widest uppercase">
            Admin
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navItems.map((group) => (
          <div key={group.section}>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/35 px-2 mb-1.5">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_oklch(0.64_0.29_316/0.2)]"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-4 h-4 flex-shrink-0 transition-colors",
                          active ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {active && (
                        <ChevronRight className="w-3 h-3 text-primary/60" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom — user + logout */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/50">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              Administrador
            </p>
            <p className="text-[10px] text-sidebar-foreground/40 truncate">
              admin
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
