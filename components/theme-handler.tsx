"use client";

import { usePathname, useServerInsertedHTML } from "next/navigation";
import { useEffect, useRef } from "react";
import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeHandler() {
  const pathname = usePathname();
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
  });

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
