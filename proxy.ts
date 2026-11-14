import { NextRequest, NextResponse } from "next/server";
import {
  HOST_TOKEN_COOKIE,
  LEGACY_TOKEN_COOKIE,
  ROLE_COOKIE,
  isSecureRequest,
  tokenCookieName,
} from "@/lib/auth-cookie";

// Routes accessible only when NOT authenticated
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// Protected routes and the roles allowed to access them
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/instructor": ["admin", "profesor"],
  "/estudiante": ["admin", "estudiante"],
};

/**
 * Pregunta al backend a quién pertenece el token.
 *
 * El rol no puede salir de la cookie `role`: el usuario la edita desde la
 * consola del navegador y entraría a `/admin`. La API rechazaría sus peticiones,
 * pero la interfaz de administración se renderizaría igual. La única fuente
 * fiable es el propio backend, que resuelve el token opaco de Sanctum.
 *
 * Devuelve `null` si el token es inválido, expiró o la API no responde: ante la
 * duda se cierra la sesión en lugar de dejar pasar.
 */
async function resolveRole(token: string): Promise<string | null> {
  const base = (process.env.BACKEND_URL ?? process.env.API_URL ?? "").replace(
    /\/+$/,
    "",
  );
  if (!base) return null;

  try {
    const res = await fetch(`${base}/api/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const body = await res.json();
    return typeof body?.role === "string" ? body.role : null;
  } catch {
    return null;
  }
}

/** Borra las cookies de sesión respetando los atributos con los que se crearon. */
function borrarSesion(response: NextResponse, secure: boolean): void {
  const base = { path: "/", maxAge: 0, sameSite: "strict" as const };
  response.cookies.set(HOST_TOKEN_COOKIE, "", {
    ...base,
    secure: true,
    httpOnly: true,
  });
  response.cookies.set(LEGACY_TOKEN_COOKIE, "", {
    ...base,
    secure,
    httpOnly: true,
  });
  response.cookies.set(ROLE_COOKIE, "", { ...base, secure });
}

/** Manda al login y borra una sesión que ya no sirve. */
function logout(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url));
  borrarSesion(response, isSecureRequest(request.url, request.headers));
  return response;
}

/**
 * Redirige al panel del rol, dejando la cookie `role` al día.
 *
 * La cookie sigue existiendo porque las pantallas la usan para decidir qué
 * menú pintar, pero aquí ya se escribe con el valor que confirmó el backend.
 */
function toDashboard(request: NextRequest, role: string): NextResponse {
  const response = NextResponse.redirect(
    new URL(getDashboard(role), request.url),
  );
  response.cookies.set(ROLE_COOKIE, role, {
    path: "/",
    sameSite: "strict",
    secure: isSecureRequest(request.url, request.headers),
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secure = isSecureRequest(request.url, request.headers);
  const token =
    request.cookies.get(tokenCookieName(secure))?.value ??
    request.cookies.get(LEGACY_TOKEN_COOKIE)?.value ??
    null;

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const matchedBase = Object.keys(PROTECTED_ROUTES).find((base) =>
    pathname.startsWith(base),
  );

  // --- Sin token: solo pasan la raíz y las pantallas de autenticación ---
  if (!token) {
    if (pathname === "/" || isAuthRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // --- Con token: se valida contra el backend antes de decidir nada ---
  const role = await resolveRole(token);

  if (!role) {
    // El token ya no sirve. En las pantallas de autenticación se limpia la
    // sesión y se deja seguir, para no dejar al usuario dando vueltas entre
    // `/login` y su panel.
    if (pathname === "/" || isAuthRoute) {
      const response = NextResponse.next();
      borrarSesion(response, secure);
      return response;
    }
    return logout(request);
  }

  // --- Autenticado: la raíz y el login llevan a su panel ---
  if (pathname === "/" || isAuthRoute) {
    return toDashboard(request, role);
  }

  // --- Autenticado: se comprueba el rol contra la ruta protegida ---
  if (matchedBase && !PROTECTED_ROUTES[matchedBase].includes(role)) {
    return toDashboard(request, role);
  }

  // Si la cookie `role` quedó desfasada (o la editaron), se corrige.
  if (request.cookies.get(ROLE_COOKIE)?.value !== role) {
    const response = NextResponse.next();
    response.cookies.set(ROLE_COOKIE, role, {
      path: "/",
      sameSite: "strict",
      secure,
    });
    return response;
  }

  return NextResponse.next();
}

function getDashboard(role: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "profesor":
      return "/instructor";
    default:
      return "/estudiante";
  }
}

export const config = {
  /*
   * Match all routes except:
   * - _next/static  (static files)
   * - _next/image   (image optimization)
   * - favicon.ico
   * - public files (images, etc.)
   * - archivos de la PWA: el navegador los pide sin importar si hay sesión, y
   *   rechaza un service worker que responde con una redirección al login
   */
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|sw\\.js$|manifest\\.webmanifest$|offline\\.html$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
