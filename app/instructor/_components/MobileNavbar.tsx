"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LayoutDashboard, BookOpen, User } from "lucide-react";

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
    exact: false,
  },
];

export default function MobileNavbar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

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

  const isActive = (href: string, exact: boolean) =>
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
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                active
                  ? "text-pink-500"
                  : "text-muted-foreground hover:text-on-surface"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-all duration-200 ${active ? "scale-110" : ""}`}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
