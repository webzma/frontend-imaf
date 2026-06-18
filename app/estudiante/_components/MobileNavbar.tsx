"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LayoutDashboard, BookOpen, GraduationCap, Bell } from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/estudiante",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Cursos",
    href: "/estudiante/cursos",
    icon: BookOpen,
    exact: false,
  },
  {
    label: "Mi Curso",
    href: "/estudiante/curso",
    icon: GraduationCap,
    exact: false,
  },
  {
    label: "Notificaciones",
    href: "/estudiante/notificaciones",
    icon: Bell,
    exact: false,
  },
];

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

export default function MobileNavbar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Fetch notifications count
    const fetchNotifications = () => {
      fetch(`${process.env.API_URL}api/estudiante/notificaciones/count`, {
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

  // Add padding to main content when navbar is visible
  useEffect(() => {
    if (isMobile) {
      document.body.style.paddingBottom = "64px";
    } else {
      document.body.style.paddingBottom = "0px";
    }

    return () => {
      document.body.style.paddingBottom = "0px";
    };
  }, [isMobile]);

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }

    // For non-exact matches, ensure we don't match partial paths
    if (href === "/estudiante/cursos" && pathname === "/estudiante/curso") {
      return false;
    }
    if (href === "/estudiante/curso" && pathname === "/estudiante/cursos") {
      return false;
    }

    return pathname.startsWith(href);
  };

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
              <Icon
                className={`w-5 h-5 transition-all duration-200 ${
                  active ? "scale-110" : ""
                }`}
              />
              {item.label === "Notificaciones" && unreadCount > 0 && (
                <span className="absolute top-2 translate-x-1/2 w-2 h-2 bg-pink-500 rounded-full" />
              )}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
