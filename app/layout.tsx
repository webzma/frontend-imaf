import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import Providers from "./providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { ThemeHandler } from "@/components/theme-handler";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IMAF",
  description:
    "IMAF — Formación para el trabajo en modalidad presencial. Inscríbete en línea y asiste a clases en nuestra sede.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("font-sans", cormorantGaramond.variable, manrope.variable)}
    >
      <head>
        {/* Aplica el tema antes del primer paint: sin flash de tema claro. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <NextTopLoader
          color="var(--primary)"
          shadow={false}
          showSpinner={false}
          height={2}
        />
        <Toaster richColors position="bottom-right" />
        <ThemeHandler />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
