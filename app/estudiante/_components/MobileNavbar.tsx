"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Bell,
} from "lucide-react";

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

export default function MobileNavbar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add padding to main content when navbar is visible
  useEffect(() => {
    if (isMobile) {
      document.body.style.paddingBottom = '64px';
    } else {
      document.body.style.paddingBottom = '0px';
    }
    
    return () => {
      document.body.style.paddingBottom = '0px';
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
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
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
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
