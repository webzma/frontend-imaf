/* ── Utilidades para listas paginadas del backend ── */

import { apiFetch, buildQuery, type QueryParams } from "@/lib/api-client";

/** Cantidad de registros por página usada en toda la plataforma. */
export const PAGE_SIZE = 10;

export interface PageResult<T> {
  items: T[];
  /** Total de registros (no solo los de la página actual). */
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Normaliza la respuesta de una lista, venga paginada o plana.
 *
 * El backend responde con la estructura paginada de Laravel
 * (`{ data, total, current_page, last_page, per_page, ... }`). Si algún
 * endpoint aún devuelve un arreglo plano (sin paginar), se corta aquí mismo
 * para que la UI siga funcionando con las mismas props de paginación.
 */
export function normalizePage<T>(
  body: unknown,
  page: number,
  pageSize: number,
): PageResult<T> {
  // Respuesta plana: el endpoint no pagina; cortamos localmente.
  if (Array.isArray(body)) {
    return sliceLocal(body as T[], body.length, page, pageSize);
  }

  // Respuesta paginada de Laravel `paginate()`: trae `data` con una sola
  // página y los metadatos `total`, `current_page`, `last_page` y
  // `per_page`. Si faltan los metadatos pero hay `data`, el backend está
  // devolviendo un arreglo envuelto en `{ data: [...] }` sin paginar
  // (API Resource sin `->paginate()`): en ese caso cortamos localmente.
  const record = (body ?? {}) as Record<string, unknown>;
  const data = Array.isArray(record.data) ? (record.data as T[]) : null;
  if (data) {
    const total = typeof record.total === "number" ? record.total : data.length;
    const hasPaginationMeta =
      typeof record.current_page === "number" &&
      typeof record.last_page === "number" &&
      typeof record.per_page === "number";
    const serverPageSize =
      typeof record.per_page === "number" ? record.per_page : pageSize;

    // Solo se confía en la paginación del servidor si devuelve la misma
    // cantidad que pedimos. Si el backend pagina con otro `per_page`
    // (p. ej. ignora el parámetro y usa el default de Laravel), cortamos
    // localmente para garantizar exactamente `pageSize` registros.
    if (
      hasPaginationMeta &&
      data.length <= pageSize &&
      serverPageSize <= pageSize
    ) {
      return {
        items: data,
        total,
        page: record.current_page as number,
        totalPages: record.last_page as number,
      };
    }

    // Sin metadatos (o per_page distinto): `data` trae la lista completa,
    // se corta aquí.
    return sliceLocal(data, total, page, pageSize);
  }

  // Formato inesperado: devolver vacío en vez de romper la UI.
  return { items: [], total: 0, page, totalPages: 1 };
}

/**
 * Pide una página de la API enviando `?page=&per_page=`.
 *
 * Firma heredada, sobre `fetch` crudo. Las pantallas nuevas usan
 * `fetchResourcePage`, que además traduce los errores y cierra la sesión
 * cuando el token caducó.
 */
export async function fetchPage<T>(
  url: string,
  page: number,
  headers?: HeadersInit,
  pageSize = PAGE_SIZE,
  params?: QueryParams,
): Promise<PageResult<T>> {
  const sep = url.includes("?") ? "&" : "?";
  const extra = buildQuery(params).replace(/^\?/, "");
  const res = await fetch(
    `${url}${sep}page=${page}&per_page=${pageSize}${extra ? `&${extra}` : ""}`,
    { headers },
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return normalizePage<T>(await res.json(), page, pageSize);
}

/**
 * Página de un recurso con filtros del servidor.
 *
 * Los filtros viajan como query params: buscar "María" consulta las 300 filas
 * de la base de datos, no las 10 que hay cargadas en memoria.
 */
export async function fetchResourcePage<T>(
  path: string,
  {
    page = 1,
    pageSize = PAGE_SIZE,
    params,
  }: { page?: number; pageSize?: number; params?: QueryParams } = {},
): Promise<PageResult<T>> {
  const body = await apiFetch<unknown>(path, {
    params: { ...params, page, per_page: pageSize },
  });
  return normalizePage<T>(body, page, pageSize);
}

function sliceLocal<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
): PageResult<T> {
  return {
    items: list.slice((page - 1) * pageSize, page * pageSize),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
