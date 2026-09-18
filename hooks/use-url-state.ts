"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Estado de pantalla guardado en la barra de direcciones.
 *
 * Los filtros vivían en `useState`, así que recargar, volver atrás o pasarle
 * el enlace a un compañero perdía el contexto: siempre se aterrizaba en la
 * lista sin filtrar. En la URL, "estudiantes activos del curso de repostería,
 * página 3" es una dirección que se puede compartir y a la que el botón atrás
 * del navegador sabe volver.
 */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = useCallback(
    (key: string, fallback = "") => searchParams.get(key) ?? fallback,
    [searchParams],
  );

  /**
   * Escribe varias claves de golpe. Un valor vacío o igual al de por defecto
   * se borra en vez de escribirse: la URL de la vista sin filtros es la ruta
   * limpia, no `?q=&estado=todos&page=1`.
   */
  const setMany = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      const qs = params.toString();
      // `replace` y no `push`: teclear en el buscador no debe dejar una
      // entrada de historial por letra.
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const set = useCallback(
    (key: string, value: string | number | null | undefined) =>
      setMany({ [key]: value }),
    [setMany],
  );

  return { get, set, setMany, searchParams };
}
