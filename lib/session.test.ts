import { clearSession, dashboardPath, getToken, setSession } from "./session";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/** Sustituye `document.cookie` por un espía que guarda lo que se le escribe. */
function capturarCookies() {
  const escritas: string[] = [];
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => escritas.join("; "),
    set: (value: string) => {
      escritas.push(value);
    },
  });
  return escritas;
}

function enProtocolo(protocolo: "http:" | "https:") {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, protocol: protocolo },
  });
}

describe("session", () => {
  let escritas: string[];

  beforeEach(() => {
    escritas = capturarCookies();
  });

  afterEach(() => {
    // @ts-expect-error se restaura la propiedad nativa de jsdom
    delete document.cookie;
  });

  it("marca las cookies como Secure bajo HTTPS", () => {
    enProtocolo("https:");
    setSession("tok", "admin");

    expect(escritas).toHaveLength(2);
    for (const cookie of escritas) {
      expect(cookie).toContain("Secure");
      expect(cookie).toContain("SameSite=Strict");
      expect(cookie).toContain("path=/");
    }
  });

  it("omite Secure en http para no romper el desarrollo local", () => {
    enProtocolo("http:");
    setSession("tok", "admin");

    for (const cookie of escritas) {
      expect(cookie).not.toContain("Secure");
      expect(cookie).toContain("SameSite=Strict");
    }
  });

  it("le pone caducidad a la sesión en vez de dejarla de sesión de navegador", () => {
    enProtocolo("https:");
    setSession("tok", "admin");

    for (const cookie of escritas) {
      expect(cookie).toMatch(/max-age=\d+/);
      expect(cookie).not.toMatch(/max-age=0\b/);
    }
  });

  it("clearSession vence las dos cookies", () => {
    enProtocolo("https:");
    clearSession();

    expect(escritas).toHaveLength(2);
    expect(escritas.some((c) => c.startsWith("token="))).toBe(true);
    expect(escritas.some((c) => c.startsWith("role="))).toBe(true);
    for (const cookie of escritas) {
      expect(cookie).toContain("max-age=0");
    }
  });

  it("lee de vuelta el token que escribió", () => {
    enProtocolo("https:");
    setSession("abc123", "profesor");

    expect(getToken()).toBe("abc123");
  });

  it("mapea cada rol a su panel", () => {
    expect(dashboardPath("admin")).toBe("/admin");
    expect(dashboardPath("profesor")).toBe("/instructor");
    expect(dashboardPath("estudiante")).toBe("/estudiante");
    expect(dashboardPath("desconocido")).toBe("/estudiante");
  });
});
