"use client";

import { useEffect, useState } from "react";

/**
 * Retrasa la propagación de un valor que cambia con cada pulsación.
 *
 * El buscador consulta al servidor: sin esto, escribir "Rosangela" dispara
 * nueve peticiones y las respuestas pueden llegar desordenadas.
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
