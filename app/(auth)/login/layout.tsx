import type { Metadata } from "next";
import { SITE_NAME, siteUrl } from "@/lib/seo";

const title = "Iniciar sesión | IMAF – Plataforma de cursos";
const description =
  "Inicia sesión en IMAF para gestionar tus cursos presenciales en Independencia, Yaracuy, consultar tu horario y descargar tu certificado.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/login" },
  openGraph: {
    type: "website",
    locale: "es_VE",
    siteName: SITE_NAME,
    title,
    description,
    url: siteUrl("/login"),
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
