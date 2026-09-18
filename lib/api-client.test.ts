import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ApiError,
  NetworkError,
  apiFetch,
  apiUrl,
  buildQuery,
  fetchAll,
  mensajeDeError,
} from "@/lib/api-client";

const fetchMock = vi.fn();

function respuesta(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  document.cookie = "token=abc123; path=/";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildQuery", () => {
  it("omite los valores vacíos en vez de enviarlos", () => {
    expect(
      buildQuery({ search: "ana", estado: "", curso: undefined, page: 2 }),
    ).toBe("?search=ana&page=2");
  });

  it("devuelve cadena vacía cuando no queda ningún parámetro", () => {
    expect(buildQuery({ a: "", b: null })).toBe("");
  });
});

describe("apiUrl", () => {
  it("normaliza la barra entre la base y la ruta", () => {
    // La variable de entorno de este proyecto se ha configurado ya sin barra
    // final; interpolarla a pelo producía "servidorapi/login".
    expect(apiUrl("api/login")).toBe("http://localhost:8000/api/login");
    expect(apiUrl("/api/login")).toBe("http://localhost:8000/api/login");
  });
});

describe("apiFetch", () => {
  it("envía el token de sesión en la cabecera", async () => {
    fetchMock.mockReturnValue(respuesta({ ok: true }));
    await apiFetch("api/admin/cursos");

    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer abc123");
    expect(headers.Accept).toBe("application/json");
  });

  it("serializa el cuerpo a JSON", async () => {
    fetchMock.mockReturnValue(respuesta({ id: 1 }));
    await apiFetch("api/admin/cursos", {
      method: "POST",
      body: { nombre: "X" },
    });

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).body).toBe('{"nombre":"X"}');
  });

  it("convierte los errores de validación de Laravel en un mensaje legible", async () => {
    fetchMock.mockReturnValue(
      respuesta(
        { message: "Datos inválidos", errors: { email: ["Ya está en uso"] } },
        422,
      ),
    );

    await expect(
      apiFetch("api/admin/estudiantes", { method: "POST" }),
    ).rejects.toBeInstanceOf(ApiError);

    try {
      await apiFetch("api/admin/estudiantes", { method: "POST" });
    } catch (error) {
      expect((error as ApiError).status).toBe(422);
      expect((error as ApiError).detalle).toBe("Ya está en uso");
    }
  });

  it("da un mensaje propio cuando el backend no manda ninguno", async () => {
    fetchMock.mockReturnValue(respuesta({}, 403));
    await expect(apiFetch("api/admin/pagos")).rejects.toThrow(
      "No tienes permiso para realizar esta acción.",
    );
  });

  it("distingue un fallo de red de un error del servidor", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiFetch("api/admin/cursos")).rejects.toBeInstanceOf(
      NetworkError,
    );
  });

  it("no intenta parsear el cuerpo de un 204", async () => {
    fetchMock.mockReturnValue(respuesta(undefined, 204));
    await expect(
      apiFetch("api/admin/cursos/1", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });

  it("trata el 401 como fin de sesión", async () => {
    fetchMock.mockReturnValue(respuesta({}, 401));

    // `skipAuthRedirect` evita tocar `window.location` en el test; lo que se
    // comprueba es que el error llega con el estado y el mensaje correctos.
    await expect(
      apiFetch("api/admin/cursos", { skipAuthRedirect: true }),
    ).rejects.toThrow("Tu sesión expiró. Vuelve a iniciar sesión.");
  });
});

describe("fetchAll", () => {
  it("pide el catálogo completo, no la primera página", async () => {
    fetchMock.mockReturnValue(respuesta({ data: [{ id: 1 }, { id: 2 }] }));
    const items = await fetchAll<{ id: number }>("api/admin/cursos");

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("per_page=100");
    expect(items).toHaveLength(2);
  });

  it("acepta también un arreglo plano", async () => {
    fetchMock.mockReturnValue(respuesta([{ id: 7 }]));
    await expect(fetchAll("api/admin/titulos")).resolves.toEqual([{ id: 7 }]);
  });

  it("devuelve una lista vacía ante un formato inesperado", async () => {
    fetchMock.mockReturnValue(respuesta({ raro: true }));
    await expect(fetchAll("api/admin/titulos")).resolves.toEqual([]);
  });
});

describe("mensajeDeError", () => {
  it("usa el detalle del ApiError y cae al texto por defecto si no lo es", () => {
    expect(
      mensajeDeError(new ApiError("Fallo", 400, { n: ["Obligatorio"] }), "x"),
    ).toBe("Obligatorio");
    expect(mensajeDeError(new Error("interno"), "No se pudo guardar.")).toBe(
      "No se pudo guardar.",
    );
  });
});
