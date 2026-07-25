export const THEME_STORAGE_KEY = "theme";

/**
 * Se inyecta en <head> y corre antes del primer paint, de modo que la clase
 * `dark` ya está en <html> cuando el navegador pinta. Sin esto hay un flash de
 * tema claro en cada carga, y las páginas donde no monta el sidebar (landing,
 * login, register) se quedarían siempre en claro.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function getStoredTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage puede no estar disponible (modo privado); el tema sigue aplicado.
  }
}
