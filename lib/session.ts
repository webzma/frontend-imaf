/**
 * Sesión del lado del cliente.
 *
 * El token de Sanctum vive en una cookie `HttpOnly` que escribe el BFF
 * (`app/api/[...path]/route.ts`). El navegador solo conserva `role`, que no es
 * sensible y sirve para pintar la interfaz. Por compatibilidad, `getToken()`
 * sigue existiendo pero siempre devuelve una cadena vacía.
 */

/** Duración de la cookie, alineada con `SANCTUM_TOKEN_EXPIRATION` (7 días). */
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type Role = "admin" | "profesor" | "estudiante";

function isSecureContext(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
}

/**
 * Serializa una cookie de sesión.
 *
 * `SameSite=Strict` porque ninguna navegación entrante legítima necesita la
 * sesión: el usuario siempre llega por la propia app. `Secure` solo se añade
 * bajo HTTPS, ya que un navegador descarta una cookie `Secure` servida por
 * `http://localhost` y eso rompería el desarrollo local.
 */
function serialize(name: string, value: string, maxAge: number): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "path=/",
    "SameSite=Strict",
    `max-age=${maxAge}`,
  ];

  if (isSecureContext()) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

export function getToken(): string {
  return "";
}

export function getRole(): string {
  return getCookie("role");
}

/** Guarda el rol tras un login o un registro exitoso. El token lo guarda el BFF. */
export function setSession(role: string): void {
  if (typeof document === "undefined") return;
  document.cookie = serialize("role", role, SESSION_MAX_AGE);
}

/** Limpia el rol local; el token HttpOnly lo borra el BFF al cerrar sesión. */
export function clearSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = serialize("role", "", 0);
}

/** Ruta del panel que corresponde a cada rol. */
export function dashboardPath(role: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "profesor":
      return "/instructor";
    default:
      return "/estudiante";
  }
}
