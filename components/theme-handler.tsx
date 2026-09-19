"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      document.documentElement.classList.remove("dark");
    } else {
      // Re-aplicar el tema guardado al navegar fuera de la landing
      try {
        const t = localStorage.getItem(THEME_STORAGE_KEY);
        const d = t
          ? t === "dark"
          : window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", d);
      } catch {
        // En caso de error (ej. modo incógnito), por defecto a claro o sistema
      }
    }
  }, [pathname]);

  return null;
}
