"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchResourcePage, PAGE_SIZE, type PageResult } from "@/lib/api";
import type { QueryParams } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUrlState } from "@/hooks/use-url-state";

export type SortDirection = "asc" | "desc";

export interface SortState {
  column: string;
  direction: SortDirection;
}

/** Valor que significa "sin filtrar". No viaja al servidor. */
export const TODOS = "todos";

export interface UseResourceListOptions {
  /** Nombre del recurso para la clave de caché (p. ej. "estudiantes"). */
  resource: string;
  /** Ruta de la API (p. ej. "api/admin/estudiantes"). */
  path: string;
  /** Filtros de la UI con su valor por defecto. */
  defaultFilters?: Record<string, string>;
  defaultSort?: SortState;
  pageSize?: number;
  /**
   * Traduce los filtros de la UI a los parámetros que entiende el backend.
   * Por defecto se envían tal cual, omitiendo los que valen `TODOS`.
   */
  mapFilters?: (filters: Record<string, string>) => QueryParams;
  enabled?: boolean;
}

export interface ResourceList<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  /** Texto del input, inmediato. La consulta usa su versión con retardo. */
  search: string;
  setSearch: (value: string) => void;
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  sort: SortState;
  toggleSort: (column: string) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  hasFilters: boolean;
  isLoading: boolean;
  /** Hay una petición en vuelo con datos previos en pantalla. */
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
  /** Parámetros efectivos enviados al servidor (sin `page`/`per_page`). */
  params: QueryParams;
}

/**
 * Lista paginada, filtrada y ordenada por el servidor, con el estado en la URL.
 *
 * Sustituye al bloque de 15-25 `useState` que cada pantalla repetía, y a los
 * `useMemo` que filtraban en memoria los 10 registros de la página cargada —
 * por los que buscar a alguien de la página 4 devolvía "sin resultados".
 */
export function useResourceList<T>({
  resource,
  path,
  defaultFilters = {},
  defaultSort,
  pageSize = PAGE_SIZE,
  mapFilters,
  enabled = true,
}: UseResourceListOptions): ResourceList<T> {
  const { get, set, setMany } = useUrlState();

  // Los filtros por defecto son una constante por pantalla, pero llegan como
  // objeto literal, así que su identidad cambia en cada render. Se compara por
  // contenido para que los `useMemo` de abajo no se recalculen sin motivo.
  const firmaFiltros = JSON.stringify(defaultFilters);

  const filterKeys = useMemo(
    () => Object.keys(defaultFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firmaFiltros],
  );

  const page = Math.max(1, Number(get("page", "1")) || 1);
  const urlSearch = get("q");

  const filters = useMemo(() => {
    const out: Record<string, string> = {};
    for (const key of filterKeys) out[key] = get(key, defaultFilters[key]);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKeys, get, firmaFiltros]);

  const sort: SortState = {
    column: get("sort", defaultSort?.column ?? ""),
    direction: (get("dir", defaultSort?.direction ?? "asc") === "desc"
      ? "desc"
      : "asc") as SortDirection,
  };

  // El input responde al instante; la consulta espera a que se deje de teclear.
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  // Si la URL cambia por fuera (botón atrás, enlace compartido), el input sigue.
  useEffect(() => {
    setSearchInput((actual) => (actual === urlSearch ? actual : urlSearch));
  }, [urlSearch]);

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    // Cambiar la búsqueda vuelve a la página 1: quedarse en la 7 de un
    // resultado de 2 páginas mostraba una tabla vacía.
    setMany({ q: debouncedSearch, page: null });
  }, [debouncedSearch, urlSearch, setMany]);

  const firmaValores = JSON.stringify(filters);

  const params: QueryParams = useMemo(() => {
    const activos = mapFilters
      ? mapFilters(filters)
      : Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== TODOS),
        );

    return {
      ...activos,
      search: urlSearch || undefined,
      sort: sort.column || undefined,
      direction: sort.column ? sort.direction : undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaValores, urlSearch, sort.column, sort.direction, mapFilters]);

  const query = useQuery({
    queryKey: adminKeys.lista(resource, {
      ...params,
      page,
      per_page: pageSize,
    }),
    queryFn: () => fetchResourcePage<T>(path, { page, pageSize, params }),
    // Mantiene la tabla anterior mientras llega la nueva página: sin esto, cada
    // clic en paginación parpadea a esqueleto y la página salta de alto.
    placeholderData: keepPreviousData,
    enabled,
  });

  const data: PageResult<T> = query.data ?? {
    items: [],
    total: 0,
    page,
    totalPages: 1,
  };

  const setFilter = useCallback(
    (key: string, value: string) => setMany({ [key]: value, page: null }),
    [setMany],
  );

  const toggleSort = useCallback(
    (column: string) => {
      const mismaColumna = sort.column === column;
      const direction: SortDirection =
        mismaColumna && sort.direction === "asc" ? "desc" : "asc";
      setMany({ sort: column, dir: direction, page: null });
    },
    [sort.column, sort.direction, setMany],
  );

  const resetFilters = useCallback(() => {
    setSearchInput("");
    setMany({
      q: null,
      page: null,
      ...Object.fromEntries(filterKeys.map((key) => [key, null])),
    });
  }, [filterKeys, setMany]);

  const hasFilters =
    searchInput !== "" ||
    filterKeys.some((key) => filters[key] !== defaultFilters[key]);

  return {
    items: data.items,
    total: data.total,
    page: Math.min(page, Math.max(1, data.totalPages)),
    totalPages: data.totalPages,
    pageSize,
    search: searchInput,
    setSearch: setSearchInput,
    filters,
    setFilter,
    sort,
    toggleSort,
    setPage: (next: number) => set("page", next === 1 ? null : next),
    resetFilters,
    hasFilters,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    params,
  };
}
