"use client";

import { useSyncExternalStore } from "react";
import { applyTheme } from "@/lib/theme";

/**
 * El tema real vive en la clase `dark` de <html>, que el script de <head> ya
 * dejó puesta antes del primer paint. Lo leemos con useSyncExternalStore en
 * lugar de duplicarlo en un useState + useEffect: así no hay render en cascada
 * ni un instante en el que React y el DOM discrepen.
 */
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): "light" | "dark" {
  return "light";
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    applyTheme(theme === "dark" ? "light" : "dark");
    listeners.forEach((notify) => notify());
  };

  return { dark: theme === "dark", toggle };
}
