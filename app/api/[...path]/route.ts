import type { NextRequest } from "next/server";
import {
  HOST_TOKEN_COOKIE,
  LEGACY_TOKEN_COOKIE,
  ROLE_COOKIE,
  SESSION_MAX_AGE,
  isSecureRequest,
  readCookie,
  serializeCookie,
  tokenCookieName,
} from "@/lib/auth-cookie";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const SEGMENTO_SEGURO = /^[A-Za-z0-9._~-]+$/;

const CABECERAS_PETICION = [
  "accept",
  "accept-language",
  "content-type",
  "if-none-match",
  "if-modified-since",
  "range",
] as const;

const CABECERAS_RESPUESTA = [
  "accept-ranges",
  "cache-control",
  "content-disposition",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
  "location",
  "retry-after",
] as const;

function backendBase(): string | null {
  const raw = (process.env.BACKEND_URL ?? "").trim().replace(/\/+$/, "");
  if (!raw) return null;

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? raw : null;
  } catch {
    return null;
  }
}

function esRutaValida(segmentos: string[]): boolean {
  return (
    segmentos.length > 0 &&
    segmentos.every(
      (segmento) =>
        segmento.length > 0 &&
        !segmento.includes("..") &&
        SEGMENTO_SEGURO.test(segmento),
    )
  );
}

function construirDestino(
  request: NextRequest,
  segmentos: string[],
): URL | null {
  const base = backendBase();
  if (!base) return null;

  const url = new URL(
    `${base}/api/${segmentos.map((s) => encodeURIComponent(s)).join("/")}`,
  );
  url.search = request.nextUrl.search;
  return url;
}

function rutaDeSesion(
  segmentos: string[],
): "login" | "register" | "logout" | null {
  if (segmentos.length !== 1) return null;
  const [ruta] = segmentos;
  return ruta === "login" || ruta === "register" || ruta === "logout"
    ? ruta
    : null;
}

function cookiesDeBorrado(secure: boolean): string[] {
  const nombres = new Set([tokenCookieName(secure), LEGACY_TOKEN_COOKIE]);
  return [
    ...[...nombres].map((nombre) =>
      serializeCookie(nombre, "", 0, true, secure),
    ),
    serializeCookie(ROLE_COOKIE, "", 0, false, secure),
  ];
}

function cabecerasDeRespuesta(upstream: Response, cookies: string[]): Headers {
  const headers = new Headers();
  for (const nombre of CABECERAS_RESPUESTA) {
    const valor = upstream.headers.get(nombre);
    if (valor) headers.set(nombre, valor);
  }
  for (const cookie of cookies) {
    headers.append("set-cookie", cookie);
  }
  return headers;
}

function respuestaJson(
  data: unknown,
  status: number,
  cookies: string[] = [],
): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
  });
  for (const cookie of cookies) {
    headers.append("set-cookie", cookie);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function leerJson(texto: string): Record<string, unknown> | null {
  try {
    const valor: unknown = JSON.parse(texto);
    return valor !== null && typeof valor === "object"
      ? (valor as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function manejar(
  request: NextRequest,
  contexto: RouteContext,
): Promise<Response> {
  const { path } = await contexto.params;
  const segmentos = Array.isArray(path) ? path : [];

  if (!esRutaValida(segmentos)) {
    return respuestaJson({ message: "Ruta no válida." }, 400);
  }

  const destino = construirDestino(request, segmentos);
  if (!destino) {
    return respuestaJson(
      { message: "Configuración del servidor incompleta." },
      500,
    );
  }

  const secure = isSecureRequest(request.url, request.headers);
  const nombreToken = tokenCookieName(secure);
  const cookieHeader = request.headers.get("cookie");
  const tokenHost = readCookie(cookieHeader, HOST_TOKEN_COOKIE);
  const tokenLegacy = readCookie(cookieHeader, LEGACY_TOKEN_COOKIE);
  const token = tokenHost ?? tokenLegacy;

  const ruta = rutaDeSesion(segmentos);
  const cookies: string[] = [];

  const headers = new Headers();
  for (const nombre of CABECERAS_PETICION) {
    const valor = request.headers.get(nombre);
    if (valor) headers.set(nombre, valor);
  }
  if (token) headers.set("authorization", `Bearer ${token}`);

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(destino, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    if (ruta === "logout") {
      return new Response(null, {
        status: 204,
        headers: cabecerasDeRespuesta(
          new Response(null),
          cookiesDeBorrado(secure),
        ),
      });
    }
    return respuestaJson(
      { message: "No se pudo conectar con el servidor." },
      502,
    );
  }

  if (ruta === "login" || ruta === "register") {
    if (!upstream.ok) {
      const cuerpo = await upstream.arrayBuffer();
      return new Response(cuerpo, {
        status: upstream.status,
        headers: cabecerasDeRespuesta(upstream, []),
      });
    }

    const texto = await upstream.text();
    const cuerpo = leerJson(texto);
    const nuevoToken = typeof cuerpo?.token === "string" ? cuerpo.token : null;
    const rol =
      cuerpo?.user &&
      typeof cuerpo.user === "object" &&
      typeof (cuerpo.user as Record<string, unknown>).role === "string"
        ? ((cuerpo.user as Record<string, unknown>).role as string)
        : null;

    if (nuevoToken && rol) {
      const setCookies = [
        serializeCookie(nombreToken, nuevoToken, SESSION_MAX_AGE, true, secure),
        serializeCookie(ROLE_COOKIE, rol, SESSION_MAX_AGE, false, secure),
      ];
      if (nombreToken !== LEGACY_TOKEN_COOKIE) {
        setCookies.push(
          serializeCookie(LEGACY_TOKEN_COOKIE, "", 0, true, secure),
        );
      }

      const resto = { ...(cuerpo ?? {}) };
      delete resto.token;
      return respuestaJson(resto, upstream.status, setCookies);
    }

    return new Response(texto, {
      status: upstream.status,
      headers: cabecerasDeRespuesta(upstream, []),
    });
  }

  if (ruta === "logout") {
    return new Response(null, {
      status: 204,
      headers: cabecerasDeRespuesta(upstream, cookiesDeBorrado(secure)),
    });
  }

  if (
    secure &&
    nombreToken === HOST_TOKEN_COOKIE &&
    !tokenHost &&
    tokenLegacy
  ) {
    cookies.push(
      serializeCookie(
        HOST_TOKEN_COOKIE,
        tokenLegacy,
        SESSION_MAX_AGE,
        true,
        true,
      ),
      serializeCookie(LEGACY_TOKEN_COOKIE, "", 0, true, true),
    );
  }

  if (upstream.status === 401) {
    cookies.push(...cookiesDeBorrado(secure));
  }

  const headersRespuesta = cabecerasDeRespuesta(upstream, cookies);

  if (!upstream.body || upstream.status === 204 || upstream.status === 304) {
    return new Response(null, {
      status: upstream.status,
      headers: headersRespuesta,
    });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: headersRespuesta,
  });
}

export function GET(request: NextRequest, contexto: RouteContext) {
  return manejar(request, contexto);
}

export function POST(request: NextRequest, contexto: RouteContext) {
  return manejar(request, contexto);
}

export function PUT(request: NextRequest, contexto: RouteContext) {
  return manejar(request, contexto);
}

export function PATCH(request: NextRequest, contexto: RouteContext) {
  return manejar(request, contexto);
}

export function DELETE(request: NextRequest, contexto: RouteContext) {
  return manejar(request, contexto);
}

export function HEAD(request: NextRequest, contexto: RouteContext) {
  return manejar(request, contexto);
}

export function OPTIONS(request: NextRequest, contexto: RouteContext) {
  return manejar(request, contexto);
}
