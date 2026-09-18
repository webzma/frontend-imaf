/**
 * Manejo de la sesión del lado del cliente.
 *
 * El backend autentica con tokens Bearer de Sanctum, así que el token tiene que
 * viajar en un header y el cliente necesita poder leerlo. Eso impide marcarlo
 * `HttpOnly` mientras las páginas sigan llamando a la API directamente; lo que
 * sí se hace aquí es fijar en un solo lugar el resto de atributos (`Secure`,
 * `SameSite`, expiración) para que no se escriban a mano en cada pantalla.
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
  return getCookie("token");
}

export function getRole(): string {
  return getCookie("role");
}

/** Guarda la sesión tras un login o un registro exitoso. */
export function setSession(token: string, role: string): void {
  if (typeof document === "undefined") return;
  document.cookie = serialize("token", token, SESSION_MAX_AGE);
  document.cookie = serialize("role", role, SESSION_MAX_AGE);
}

/** Borra la sesión local. No revoca el token en el backend; eso lo hace `/logout`. */
export function clearSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = serialize("token", "", 0);
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
