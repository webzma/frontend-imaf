import type { Metadata } from "next";
import { SITE_NAME, siteUrl } from "@/lib/seo";

const title = "Crear cuenta e inscribirme en cursos | IMAF";
const description =
  "Regístrate en IMAF e inscríbete en cursos presenciales en Independencia, Yaracuy. Inscripción en línea, pago a tu ritmo y certificación oficial.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/register" },
  openGraph: {
    type: "website",
    locale: "es_VE",
    siteName: SITE_NAME,
    title,
    description,
    url: siteUrl("/register"),
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export default function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
