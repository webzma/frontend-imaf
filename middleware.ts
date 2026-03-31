import { NextRequest, NextResponse } from "next/server";

// Routes accessible only when NOT authenticated
const AUTH_ROUTES = ["/login", "/register"];

// Protected routes and the roles allowed to access them
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/profesor": ["admin", "profesor"],
  "/estudiante": ["admin", "estudiante"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("role")?.value ?? null;
  const isAuthenticated = !!role;

  // --- Root route: redirect authenticated users to their dashboard ---
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getDashboard(role!), request.url));
    }
    return NextResponse.next();
  }

  // --- Auth routes: redirect to dashboard if already logged in ---
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getDashboard(role!), request.url));
    }

    return NextResponse.next();
  }

  // --- Not authenticated → always go to login ---
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // --- Authenticated: check role for protected routes ---
  const matchedBase = Object.keys(PROTECTED_ROUTES).find((base) =>
    pathname.startsWith(base),
  );

  if (matchedBase) {
    const allowed = PROTECTED_ROUTES[matchedBase];
    if (!allowed.includes(role!)) {
      return NextResponse.redirect(new URL(getDashboard(role!), request.url));
    }
  }

  return NextResponse.next();
}

function getDashboard(role: string): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "profesor":
      return "/profesor";
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
