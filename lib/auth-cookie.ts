export const LEGACY_TOKEN_COOKIE = "token";
export const HOST_TOKEN_COOKIE = "__Host-token";
export const ROLE_COOKIE = "role";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function isSecureRequest(url: string, headers: Headers): boolean {
  const forwarded = headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();

  if (forwarded === "https") return true;

  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function tokenCookieName(secure: boolean): string {
  return secure ? HOST_TOKEN_COOKIE : LEGACY_TOKEN_COOKIE;
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    if (trimmed.slice(0, separator) !== name) continue;

    const raw = trimmed.slice(separator + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return null;
}

export function serializeCookie(
  name: string,
  value: string,
  maxAge: number,
  httpOnly: boolean,
  secure: boolean,
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Strict",
  ];

  if (maxAge === 0) {
    parts.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  }
  if (httpOnly) {
    parts.push("HttpOnly");
  }
  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}
