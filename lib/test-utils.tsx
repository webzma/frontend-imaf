import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Renderiza un componente que usa react-query.
 *
 * Las pantallas de perfil invalidan la caché que alimenta el avatar de la barra
 * lateral, así que necesitan un QueryClient aunque no consulten nada ellas
 * mismas. Cada test recibe un cliente nuevo —sin reintentos— para que no se
 * filtre estado entre casos.
 */
export function renderWithQuery(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}
