import { useEffect, useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TODOS, useResourceList } from "@/hooks/use-resource-list";

/* ── Router falso: la URL vive en una variable y se re-renderiza al cambiar ── */

let urlParams = new URLSearchParams();
const replaceMock = vi.fn((url: string) => {
  urlParams = new URLSearchParams(url.split("?")[1] ?? "");
  notificar();
});

let notificar: () => void = () => {};

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/estudiantes",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => urlParams,
}));

const fetchMock = vi.fn();

function respuesta(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  });
}

function Sonda() {
  // El router falso es un sistema externo: la suscripción va en un efecto,
  // no en el cuerpo del render.
  const [, setTic] = useState(0);
  useEffect(() => {
    notificar = () => setTic((n) => n + 1);
    return () => {
      notificar = () => {};
    };
  }, []);

  const lista = useResourceList<{ id: number }>({
    resource: "estudiantes",
    path: "api/admin/estudiantes",
    defaultFilters: { estado: TODOS },
    defaultSort: { column: "nombre", direction: "asc" },
  });

  return (
    <div>
      <input
        aria-label="buscar"
        value={lista.search}
        onChange={(e) => lista.setSearch(e.target.value)}
      />
      <button onClick={() => lista.setFilter("estado", "activo")}>
        filtrar
      </button>
      <button onClick={() => lista.toggleSort("nombre")}>ordenar</button>
      <button onClick={() => lista.setPage(3)}>página 3</button>
      <button onClick={lista.resetFilters}>limpiar</button>
      <p data-testid="total">{lista.total}</p>
      <p data-testid="filtros">{String(lista.hasFilters)}</p>
      <p data-testid="orden">{`${lista.sort.column}:${lista.sort.direction}`}</p>
    </div>
  );
}

function renderSonda() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Sonda />
    </QueryClientProvider>,
  );
}

function ultimaUrl(): string {
  return String(fetchMock.mock.calls.at(-1)?.[0] ?? "");
}

beforeEach(() => {
  urlParams = new URLSearchParams();
  replaceMock.mockClear();
  fetchMock.mockReset();
  fetchMock.mockReturnValue(
    respuesta({
      data: [{ id: 1 }],
      total: 42,
      current_page: 1,
      last_page: 5,
      per_page: 10,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useResourceList", () => {
  it("pide la primera página con el orden por defecto", async () => {
    renderSonda();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = ultimaUrl();
    expect(url).toContain("page=1");
    expect(url).toContain("per_page=10");
    expect(url).toContain("sort=nombre");
    expect(url).toContain("direction=asc");
  });

  it("expone el total del servidor, no el tamaño de la página", async () => {
    renderSonda();
    // La lista trae una fila; el total de la base son 42.
    await waitFor(() =>
      expect(screen.getByTestId("total")).toHaveTextContent("42"),
    );
  });

  it("manda la búsqueda al servidor en vez de filtrar en memoria", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderSonda();

    await user.type(screen.getByLabelText("buscar"), "ana");
    // Con retardo: escribir tres letras no son tres consultas.
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => expect(ultimaUrl()).toContain("search=ana"));
  });

  it("un filtro en 'todos' no viaja como parámetro", async () => {
    renderSonda();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(ultimaUrl()).not.toContain("estado=todos");
  });

  it("guarda filtro, orden y página en la URL", async () => {
    const user = userEvent.setup();
    renderSonda();

    await user.click(screen.getByText("filtrar"));
    expect(urlParams.get("estado")).toBe("activo");

    await user.click(screen.getByText("página 3"));
    expect(urlParams.get("page")).toBe("3");

    await user.click(screen.getByText("ordenar"));
    expect(urlParams.get("sort")).toBe("nombre");
  });

  it("cambiar un filtro devuelve a la página 1", async () => {
    const user = userEvent.setup();
    renderSonda();

    await user.click(screen.getByText("página 3"));
    expect(urlParams.get("page")).toBe("3");

    // Quedarse en la página 7 de un resultado de dos páginas mostraba una
    // tabla vacía sin explicación.
    await user.click(screen.getByText("filtrar"));
    expect(urlParams.get("page")).toBeNull();
  });

  it("alterna la dirección al reordenar por la misma columna", async () => {
    const user = userEvent.setup();
    renderSonda();

    await user.click(screen.getByText("ordenar"));
    await waitFor(() =>
      expect(screen.getByTestId("orden")).toHaveTextContent("nombre:desc"),
    );
  });

  it("limpiar borra todo el estado de la URL", async () => {
    const user = userEvent.setup();
    renderSonda();

    await user.click(screen.getByText("filtrar"));
    await user.click(screen.getByText("página 3"));
    await waitFor(() =>
      expect(screen.getByTestId("filtros")).toHaveTextContent("true"),
    );

    await user.click(screen.getByText("limpiar"));
    expect(urlParams.get("estado")).toBeNull();
    expect(urlParams.get("page")).toBeNull();
    expect(urlParams.get("q")).toBeNull();
  });
});
