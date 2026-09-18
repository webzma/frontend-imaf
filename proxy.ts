import { NextRequest, NextResponse } from "next/server";

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
  const base = (process.env.API_URL ?? "").replace(/\/+$/, "");
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

/** Manda al login y borra una sesión que ya no sirve. */
function logout(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("token");
  response.cookies.delete("role");
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
  response.cookies.set("role", role, {
    path: "/",
    sameSite: "strict",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value ?? null;

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
      response.cookies.delete("token");
      response.cookies.delete("role");
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
  if (request.cookies.get("role")?.value !== role) {
    const response = NextResponse.next();
    response.cookies.set("role", role, {
      path: "/",
      sameSite: "strict",
      secure: request.nextUrl.protocol === "https:",
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
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
