import type { Metadata, Viewport } from "next";
import { Georama } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import Providers from "./providers";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { ThemeHandler } from "@/components/theme-handler";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

// Es variable, así que no hace falta declarar pesos.
const georama = Georama({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IMAF",
  description:
    "IMAF — Formación para el trabajo en modalidad presencial. Inscríbete en línea y asiste a clases en nuestra sede.",
  applicationName: "IMAF",
  appleWebApp: {
    capable: true,
    title: "IMAF",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  // Igual que `theme_color` en `app/manifest.ts`.
  themeColor: "#b52569",
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
      className={cn("font-sans", georama.variable)}
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
        <Toaster
          richColors
          position="bottom-right"
          toastOptions={{ className: "font-sans" }}
        />
        <ThemeHandler />
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
