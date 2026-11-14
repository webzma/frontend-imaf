import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const BACKEND = "https://api.test";
const fetchMock = vi.fn();

function contexto(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function setCookies(response: Response): string[] {
  return response.headers.getSetCookie();
}

beforeEach(() => {
  process.env.BACKEND_URL = BACKEND;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BACKEND_URL;
});

describe("BFF", () => {
  it("rechaza rutas con segmentos peligrosos sin llamar al backend", async () => {
    const request = new NextRequest("https://app.test/api/..%2Fsecreto");
    const response = await GET(request, contexto(["..", "secreto"]));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("en login guarda el token en cookie HttpOnly y lo quita del cuerpo", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        token: "tok-123",
        user: { role: "admin", name: "Admin" },
      }),
    );
    const request = new NextRequest("https://app.test/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "admin@imaf.com", password: "clave12345" }),
    });

    const response = await POST(request, contexto(["login"]));
    const cookies = setCookies(response);
    const body = (await response.json()) as Record<string, unknown>;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${BACKEND}/api/login`);
    expect(body.token).toBeUndefined();
    expect((body.user as Record<string, unknown>).role).toBe("admin");

    const tokenCookie = cookies.find((c) => c.startsWith("__Host-token="));
    expect(tokenCookie).toContain("tok-123");
    expect(tokenCookie).toContain("HttpOnly");
    expect(tokenCookie).toContain("Secure");
    expect(tokenCookie).toContain("SameSite=Strict");

    const roleCookie = cookies.find((c) => c.startsWith("role="));
    expect(roleCookie).toContain("admin");
    expect(roleCookie).not.toContain("HttpOnly");
  });

  it("en HTTP local usa la cookie token sin Secure y también HttpOnly", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ token: "tok-local", user: { role: "estudiante" } }),
    );
    const request = new NextRequest("http://app.test/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "a@b.c", password: "clave12345" }),
    });

    const response = await POST(request, contexto(["login"]));
    const cookies = setCookies(response);
    const tokenCookie = cookies.find((c) => c.startsWith("token="));

    expect(tokenCookie).toContain("tok-local");
    expect(tokenCookie).toContain("HttpOnly");
    expect(tokenCookie).not.toContain("Secure");
  });

  it("migra una cookie token antigua a __Host-token en HTTPS", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ role: "admin" }));
    const request = new NextRequest("https://app.test/api/me", {
      headers: { cookie: "token=tok-antiguo" },
    });

    const response = await GET(request, contexto(["me"]));
    const cookies = setCookies(response);

    expect(cookies.some((c) => c.startsWith("__Host-token=tok-antiguo"))).toBe(
      true,
    );
    expect(
      cookies.some((c) => c.startsWith("token=") && c.includes("Max-Age=0")),
    ).toBe(true);
  });

  it("reenvía el token de la cookie HttpOnly y la query al backend", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));
    const request = new NextRequest(
      "https://app.test/api/admin/cursos?page=2&search=ana",
      { headers: { cookie: "__Host-token=tok-123" } },
    );

    const response = await GET(request, contexto(["admin", "cursos"]));
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = init.headers as Headers;

    expect(response.status).toBe(200);
    expect(String(url)).toBe(`${BACKEND}/api/admin/cursos?page=2&search=ana`);
    expect(headers.get("authorization")).toBe("Bearer tok-123");
    expect(headers.get("cookie")).toBeNull();
  });

  it("pide JSON al backend cuando el navegador envía */*", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const request = new NextRequest("https://app.test/api/me", {
      headers: { accept: "*/*" },
    });

    await GET(request, contexto(["me"]));
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect((init.headers as Headers).get("accept")).toBe("application/json");
  });

  it("conserva un Accept específico para descargas", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const request = new NextRequest(
      "https://app.test/api/estudiante/certificado",
      {
        headers: { accept: "application/pdf" },
      },
    );

    await GET(request, contexto(["estudiante", "certificado"]));
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect((init.headers as Headers).get("accept")).toBe("application/pdf");
  });

  it("no reenvía un Authorization controlado por el navegador", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const request = new NextRequest("https://app.test/api/me", {
      headers: {
        authorization: "Bearer token-falso",
        cookie: "__Host-token=tok-real",
      },
    });

    await GET(request, contexto(["me"]));
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect((init.headers as Headers).get("authorization")).toBe(
      "Bearer tok-real",
    );
  });

  it("borra la cookie cuando el backend responde 401", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "No autenticado" }, 401),
    );
    const request = new NextRequest("https://app.test/api/admin/cursos", {
      headers: { cookie: "__Host-token=tok-viejo" },
    });

    const response = await GET(request, contexto(["admin", "cursos"]));
    const cookies = setCookies(response);

    expect(response.status).toBe(401);
    expect(
      cookies.some(
        (c) => c.startsWith("__Host-token=") && c.includes("Max-Age=0"),
      ),
    ).toBe(true);
    expect(
      cookies.some((c) => c.startsWith("role=") && c.includes("Max-Age=0")),
    ).toBe(true);
  });

  it("en logout revoca en el backend y borra las cookies", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const request = new NextRequest("https://app.test/api/logout", {
      method: "POST",
      headers: { cookie: "__Host-token=tok-123" },
    });

    const response = await POST(request, contexto(["logout"]));
    const cookies = setCookies(response);

    expect(response.status).toBe(204);
    expect(cookies.some((c) => c.includes("Max-Age=0"))).toBe(true);
  });
});
