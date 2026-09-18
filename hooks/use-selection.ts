"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Selección de filas para acciones sobre varias a la vez.
 *
 * La selección se limpia sola cuando cambia la página o el filtro: mantenerla
 * significaría aplicar una acción a registros que ya no están en pantalla.
 */
export function useSelection<T>(
  rows: T[],
  getId: (row: T) => number,
  /** Cambiar esta firma (página, filtros) vacía la selección. */
  resetKey: string,
) {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [firma, setFirma] = useState(resetKey);

  if (firma !== resetKey) {
    setFirma(resetKey);
    if (ids.size > 0) setIds(new Set());
  }

  const toggle = useCallback(
    (row: T) =>
      setIds((actual) => {
        const siguiente = new Set(actual);
        const id = getId(row);
        if (siguiente.has(id)) siguiente.delete(id);
        else siguiente.add(id);
        return siguiente;
      }),
    [getId],
  );

  const toggleAll = useCallback(() => {
    setIds((actual) =>
      actual.size === rows.length
        ? new Set()
        : new Set(rows.map((row) => getId(row))),
    );
  }, [rows, getId]);

  const clear = useCallback(() => setIds(new Set()), []);

  const allState: boolean | "indeterminate" = useMemo(() => {
    if (rows.length === 0 || ids.size === 0) return false;
    return ids.size === rows.length ? true : "indeterminate";
  }, [rows.length, ids.size]);

  return {
    ids,
    count: ids.size,
    list: useMemo(() => [...ids], [ids]),
    isSelected: useCallback((row: T) => ids.has(getId(row)), [ids, getId]),
    toggle,
    toggleAll,
    clear,
    allState,
  };
}
