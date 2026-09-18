/**
 * Cliente HTTP único de la plataforma.
 *
 * Antes cada pantalla repetía su propia copia de `getCookie` y
 * `getAuthHeaders` — 28 y 18 copias respectivamente — y cada una decidía por
 * su cuenta cómo leer un error del backend. El resultado era que un token
 * expirado no producía ningún aviso: la lista se quedaba vacía o aparecía
 * "Error al conectar con el servidor", que es falso.
 *
 * Aquí viven las tres decisiones que antes estaban dispersas: de dónde sale la
 * URL base, cómo viaja el token y qué significa cada código de error.
 */
import { clearSession, getToken } from "@/lib/session";

/** Error de la API con el detalle suficiente para pintarlo en un formulario. */
export class ApiError extends Error {
  readonly status: number;
  /** Errores por campo de Laravel (`{ email: ["ya está en uso"] }`). */
  readonly errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }

  /** Todos los mensajes de validación en una línea, para el bloque de error. */
  get detalle(): string {
    if (!this.errors) return this.message;
    const mensajes = Object.values(this.errors).flat();
    return mensajes.length > 0 ? mensajes.join(", ") : this.message;
  }
}

/** Error de red: no hubo respuesta, así que no hay código HTTP que interpretar. */
export class NetworkError extends Error {
  constructor() {
    super("No se pudo conectar con el servidor. Revisa tu conexión.");
    this.name = "NetworkError";
  }
}

const BASE = process.env.API_URL ?? "";

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Serializa parámetros omitiendo los vacíos. Un filtro en "todos" no debe
 * viajar como `estado=todos`: debe no viajar.
 */
export function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Une la URL base con una ruta relativa (`"api/admin/cursos"`).
 *
 * Normaliza la barra del medio en vez de darla por supuesta: el código
 * anterior interpolaba `${process.env.API_URL}api/...`, así que una variable
 * sin barra final producía `https://servidorapi/login` y todas las peticiones
 * fallaban por una configuración que nadie ve al leer el código.
 */
export function apiUrl(path: string, params?: QueryParams): string {
  const base = BASE.endsWith("/") ? BASE.slice(0, -1) : BASE;
  const clean = path.startsWith("/") ? path.slice(1) : path;
  return `${base}/${clean}${buildQuery(params)}`;
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(extra as Record<string, string> | undefined),
  };
}

/**
 * Una sesión caducada no es un error de pantalla: es el fin de la sesión. Se
 * limpia la cookie y se manda al login en vez de dejar la vista en un estado
 * vacío que el usuario interpreta como "no hay datos".
 */
function handleUnauthorized() {
  if (typeof window === "undefined") return;
  clearSession();
  const actual = window.location.pathname;
  if (actual !== "/login") {
    window.location.href = `/login?redirect=${encodeURIComponent(actual)}`;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Cuerpo en objeto; se serializa a JSON. Usa `rawBody` para FormData. */
  body?: unknown;
  rawBody?: BodyInit;
  params?: QueryParams;
  /** Desactiva la redirección automática al login en un 401. */
  skipAuthRedirect?: boolean;
}

/**
 * Petición autenticada contra la API. Devuelve el JSON ya tipado o lanza
 * `ApiError` / `NetworkError`.
 */
export async function apiFetch<T>(
  path: string,
  { body, rawBody, params, skipAuthRedirect, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const esFormData = rawBody instanceof FormData;

  let res: Response;
  try {
    res = await fetch(apiUrl(path, params), {
      ...init,
      // FormData pone su propio Content-Type con el boundary; fijarlo a mano
      // rompe la subida de archivos.
      headers: esFormData
        ? {
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/json",
            ...(init.headers as Record<string, string> | undefined),
          }
        : authHeaders(init.headers),
      body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new NetworkError();
  }

  if (res.status === 401) {
    if (!skipAuthRedirect) handleUnauthorized();
    throw new ApiError("Tu sesión expiró. Vuelve a iniciar sesión.", 401);
  }

  if (res.status === 204) return undefined as T;

  const texto = await res.text();
  let cuerpo: unknown = null;
  if (texto) {
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      cuerpo = null;
    }
  }

  if (!res.ok) {
    const record = (cuerpo ?? {}) as Record<string, unknown>;
    const errors =
      record.errors && typeof record.errors === "object"
        ? (record.errors as Record<string, string[]>)
        : undefined;
    const mensaje =
      typeof record.message === "string" && record.message
        ? record.message
        : mensajePorEstado(res.status);
    throw new ApiError(mensaje, res.status, errors);
  }

  return cuerpo as T;
}

function mensajePorEstado(status: number): string {
  switch (status) {
    case 403:
      return "No tienes permiso para realizar esta acción.";
    case 404:
      return "No se encontró el recurso solicitado.";
    case 422:
      return "Revisa los datos del formulario.";
    case 429:
      return "Demasiadas peticiones. Espera un momento.";
    default:
      return status >= 500
        ? "El servidor tuvo un problema. Intenta de nuevo."
        : `Error ${status}`;
  }
}

/** Mensaje presentable para cualquier error capturado. */
export function mensajeDeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.detalle;
  if (error instanceof NetworkError) return error.message;
  return fallback;
}

/**
 * Lista completa sin paginar, para poblar un `<Select>`.
 *
 * El backend pagina por defecto a 10 registros, así que los desplegables de
 * cursos e instructores solo ofrecían las diez primeras opciones y no había
 * forma de asignar el curso número once.
 */
export async function fetchAll<T>(
  path: string,
  params?: QueryParams,
): Promise<T[]> {
  const body = await apiFetch<unknown>(path, {
    params: { per_page: 100, ...params },
  });
  if (Array.isArray(body)) return body as T[];
  const record = (body ?? {}) as Record<string, unknown>;
  return Array.isArray(record.data) ? (record.data as T[]) : [];
}
