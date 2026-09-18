import { proxy } from "./proxy";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const API = "https://api.test";

/** Construye una petición a `path` con las cookies indicadas. */
function request(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(path, "https://app.test"));
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

/** Simula la respuesta de `GET /api/me`. */
function mockMe(role: string | null, ok = true) {
  return vi.fn().mockResolvedValue({
    ok: ok && role !== null,
    json: async () => (role === null ? {} : { role }),
  } as Response);
}

describe("proxy", () => {
  beforeEach(() => {
    process.env.API_URL = API;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sin token", () => {
    it("deja pasar la landing", async () => {
      const res = await proxy(request("/"));
      expect(res.status).toBe(200);
    });

    it("deja pasar el login", async () => {
      const res = await proxy(request("/login"));
      expect(res.status).toBe(200);
    });

    it("manda al login desde una ruta protegida", async () => {
      const res = await proxy(request("/admin"));
      expect(res.headers.get("location")).toContain("/login");
    });
  });

  describe("el rol se resuelve contra el backend, no contra la cookie", () => {
    it("no deja entrar a /admin con una cookie role falsificada", async () => {
      // El usuario editó `role=admin` a mano, pero su token es de estudiante.
      const fetchMock = mockMe("estudiante");
      vi.stubGlobal("fetch", fetchMock);

      const res = await proxy(
        request("/admin", { token: "t-estudiante", role: "admin" }),
      );

      expect(res.headers.get("location")).toContain("/estudiante");
      expect(fetchMock).toHaveBeenCalledWith(
        `${API}/api/me`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer t-estudiante",
          }),
        }),
      );
    });

    it("corrige la cookie role cuando no coincide con el backend", async () => {
      vi.stubGlobal("fetch", mockMe("estudiante"));

      const res = await proxy(
        request("/estudiante", { token: "t", role: "admin" }),
      );

      expect(res.status).toBe(200);
      expect(res.cookies.get("role")?.value).toBe("estudiante");
    });

    it("deja entrar a /admin cuando el backend confirma el rol", async () => {
      vi.stubGlobal("fetch", mockMe("admin"));

      const res = await proxy(request("/admin", { token: "t", role: "admin" }));

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });

    it("un profesor no entra a /admin", async () => {
      vi.stubGlobal("fetch", mockMe("profesor"));

      const res = await proxy(
        request("/admin", { token: "t", role: "profesor" }),
      );

      expect(res.headers.get("location")).toContain("/instructor");
    });
  });

  describe("token inválido", () => {
    it("cierra la sesión y manda al login", async () => {
      vi.stubGlobal("fetch", mockMe(null, false));

      const res = await proxy(request("/admin", { token: "caducado" }));

      expect(res.headers.get("location")).toContain("/login");
      expect(res.cookies.get("token")?.value).toBe("");
    });

    it("no deja al usuario en un bucle entre /login y su panel", async () => {
      vi.stubGlobal("fetch", mockMe(null, false));

      // Con un token muerto pero cookie `role`, el login debe renderizar.
      const res = await proxy(request("/login", { token: "x", role: "admin" }));

      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
      expect(res.cookies.get("token")?.value).toBe("");
    });

    it("falla cerrado si la API no responde", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      );

      const res = await proxy(request("/admin", { token: "t", role: "admin" }));

      expect(res.headers.get("location")).toContain("/login");
    });
  });

  describe("usuario autenticado", () => {
    it("desde el login va a su panel", async () => {
      vi.stubGlobal("fetch", mockMe("profesor"));

      const res = await proxy(request("/login", { token: "t" }));

      expect(res.headers.get("location")).toContain("/instructor");
    });

    it("desde la raíz va a su panel", async () => {
      vi.stubGlobal("fetch", mockMe("admin"));

      const res = await proxy(request("/", { token: "t" }));

      expect(res.headers.get("location")).toContain("/admin");
    });
  });
});
