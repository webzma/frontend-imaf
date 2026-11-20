const FALLBACK_SITE_URL = "http://localhost:3000";

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return FALLBACK_SITE_URL;

  try {
    return new URL(configured).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const SITE_URL = resolveSiteUrl();

export function siteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export const SITE_NAME = "IMAF";

export const SITE_TITLE =
  "IMAF | Cursos presenciales en Independencia, Yaracuy";

export const SITE_DESCRIPTION =
  "Inscríbete en línea en los cursos presenciales del IMAF en Independencia, Yaracuy. Formación práctica, cupos accesibles y certificación oficial.";

export const ORGANIZATION_NAME =
  "Instituto de la Mujer, Atención a la Familia y Formación para el Trabajo (IMAF)";
