/* ── Utilidades para listas paginadas del backend ── */

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
 * Pide una página de la API enviando `?page=&per_page=`.
 *
 * El backend responde con la estructura paginada de Laravel
 * (`{ data, total, current_page, last_page, per_page, ... }`). Si algún
 * endpoint aún devuelve un arreglo plano (sin paginar), se corta aquí mismo
 * para que la UI siga funcionando con las mismas props de paginación.
 */
export async function fetchPage<T>(
  url: string,
  page: number,
  headers?: HeadersInit,
  pageSize = PAGE_SIZE,
): Promise<PageResult<T>> {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${sep}page=${page}&per_page=${pageSize}`, {
    headers,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const body: unknown = await res.json();

  // Respuesta plana: el endpoint no pagina; cortamos localmente.
  if (Array.isArray(body)) {
    return {
      items: body.slice((page - 1) * pageSize, page * pageSize),
      total: body.length,
      page,
      totalPages: Math.max(1, Math.ceil(body.length / pageSize)),
    };
  }

  // Respuesta de Laravel `paginate()`.
  const record = body as {
    data?: T[];
    total?: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
  };
  const items = record.data ?? [];
  const total = record.total ?? items.length;  return {
    items,
    total,
    page: record.current_page ?? page,
    totalPages:
      record.last_page ?? Math.max(1, Math.ceil(total / pageSize)),
  };
}
