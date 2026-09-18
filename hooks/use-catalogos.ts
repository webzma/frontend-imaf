"use client";

import { useQueries } from "@tanstack/react-query";
import { fetchAll } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";

export interface CatalogoItem {
  id: number;
  nombre: string;
}

/**
 * Los cuatro catálogos que alimentan el formulario de instructor.
 *
 * Van por `fetchAll`, que pide `per_page=100`: los desplegables consultaban el
 * endpoint sin parámetros y el backend devuelve diez registros por defecto, de
 * modo que la undécima especialidad no existía para el formulario.
 */
export function useCatalogos() {
  const resultados = useQueries({
    queries: [
      "especialidades",
      "departamentos",
      "titulos",
      "tipo-contratos",
    ].map((slug) => ({
      queryKey: adminKeys.opciones(slug),
      queryFn: () => fetchAll<CatalogoItem>(`api/admin/${slug}`),
      staleTime: 5 * 60 * 1000,
    })),
  });

  return {
    especialidades: resultados[0].data ?? [],
    departamentos: resultados[1].data ?? [],
    titulos: resultados[2].data ?? [],
    tipoContratos: resultados[3].data ?? [],
    isLoading: resultados.some((r) => r.isLoading),
  };
}
