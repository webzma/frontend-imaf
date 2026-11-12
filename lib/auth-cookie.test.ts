import { describe, expect, it } from "vitest";
import {
  HOST_TOKEN_COOKIE,
  LEGACY_TOKEN_COOKIE,
  isSecureRequest,
  readCookie,
  serializeCookie,
  tokenCookieName,
} from "./auth-cookie";

describe("auth-cookie", () => {
  it("detecta HTTPS directo y a través de x-forwarded-proto", () => {
    expect(isSecureRequest("https://app.test", new Headers())).toBe(true);
    expect(
      isSecureRequest(
        "http://app.test",
        new Headers({ "x-forwarded-proto": "https" }),
      ),
    ).toBe(true);
    expect(isSecureRequest("http://app.test", new Headers())).toBe(false);
  });

  it("usa __Host- solo cuando la petición es segura", () => {
    expect(tokenCookieName(true)).toBe(HOST_TOKEN_COOKIE);
    expect(tokenCookieName(false)).toBe(LEGACY_TOKEN_COOKIE);
  });

  it("lee y decodifica una cookie concreta", () => {
    expect(readCookie("a=1; __Host-token=abc%20123", HOST_TOKEN_COOKIE)).toBe(
      "abc 123",
    );
    expect(readCookie(null, HOST_TOKEN_COOKIE)).toBeNull();
  });

  it("serializa HttpOnly, SameSite y Secure", () => {
    const cookie = serializeCookie("__Host-token", "tok", 60, true, true);

    expect(cookie).toContain("__Host-token=tok");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=60");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });

  it("al borrar añade Expires además de Max-Age=0", () => {
    const cookie = serializeCookie("token", "", 0, true, false);

    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("Expires=Thu, 01 Jan 1970");
  });
});
