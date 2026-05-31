"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LayoutDashboard, BookOpen, User, Bell } from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/instructor",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Mis Cursos",
    href: "/instructor/mis-cursos",
    icon: BookOpen,
    exact: false,
  },
  {
    label: "Perfil",
    href: "/instructor/perfil",
    icon: User,
  },
  {
    label: "Notificaciones",
    href: "/instructor/notificaciones",
    icon: Bell,
  },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
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

export default function MobileNavbar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotificationCount().then(setUnreadCount);
    const interval = setInterval(() => {
      fetchNotificationCount().then(setUnreadCount);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    document.body.style.paddingBottom = isMobile ? "64px" : "0px";
    return () => {
      document.body.style.paddingBottom = "0px";
    };
  }, [isMobile]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant/30 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                active
                  ? "text-pink-500"
                  : "text-muted-foreground hover:text-on-surface"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${active ? "scale-110" : ""}`}
                />
                {item.label === "Notificaciones" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-2 bg-pink-500 rounded-full border border-surface" />
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
