import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchPage, PAGE_SIZE } from "@/lib/api";

/* ── Helper: simula fetch devolviendo un JSON dado ── */

function stubFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const ITEMS = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

describe("fetchPage", () => {
  it("envía ?page y ?per_page en la petición", async () => {
    const fetchMock = stubFetch(ITEMS);
    await fetchPage("https://api.test/items", 2, {
      Authorization: "Bearer token",
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("page=2");
    expect(url).toContain("per_page=10");
    expect(init?.headers).toBeDefined();
  });

  it("corta localmente cuando el backend responde un arreglo plano", async () => {
    stubFetch(ITEMS);
    const result = await fetchPage("https://api.test/items", 1);
    expect(result.items).toHaveLength(PAGE_SIZE);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.items[0]).toEqual({ id: 1 });

    const page2 = await fetchPage("https://api.test/items", 2);
    expect(page2.items[0]).toEqual({ id: 11 });
  });

  it("corta localmente cuando el backend responde { data: [...] } sin metadatos", async () => {
    stubFetch({ data: ITEMS });
    const result = await fetchPage("https://api.test/items", 1);
    expect(result.items).toHaveLength(PAGE_SIZE);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.items[0]).toEqual({ id: 1 });
  });

  it("respeta la paginación del backend cuando trae metadatos de Laravel", async () => {
    stubFetch({
      data: ITEMS.slice(0, 10),
      total: 25,
      current_page: 1,
      last_page: 3,
      per_page: 10,
    });
    const result = await fetchPage("https://api.test/items", 1);
    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(3);
  });

  it("no corta dos veces cuando el backend ya paginó la página 2", async () => {
    stubFetch({
      data: ITEMS.slice(10, 20),
      total: 25,
      current_page: 2,
      last_page: 3,
      per_page: 10,
    });
    const result = await fetchPage("https://api.test/items", 2);
    expect(result.items).toHaveLength(10);
    expect(result.items[0]).toEqual({ id: 11 });
    expect(result.totalPages).toBe(3);
  });

  it("corta localmente cuando el backend pagina con per_page distinto al pedido", async () => {
    // Laravel paginó con su default (15) ignorando per_page=10.
    stubFetch({
      data: ITEMS.slice(0, 15),
      total: 25,
      current_page: 1,
      last_page: 2,
      per_page: 15,
    });
    const result = await fetchPage("https://api.test/items", 1);
    expect(result.items).toHaveLength(10);
    expect(result.items[0]).toEqual({ id: 1 });
    expect(result.totalPages).toBe(3);
  });

  it("lanza error cuando la respuesta HTTP falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );
    await expect(fetchPage("https://api.test/items", 1)).rejects.toThrow(
      "HTTP 500",
    );
  });

  it("devuelve lista vacía si el formato de respuesta es inesperado", async () => {
    stubFetch({ foo: "bar" });
    const result = await fetchPage("https://api.test/items", 1);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(1);
  });
});
