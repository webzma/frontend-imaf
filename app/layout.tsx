import type { Metadata, Viewport } from "next";
import { Georama } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import Providers from "./providers";
import { ThemeHandler } from "@/components/theme-handler";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { InstallAppBanner } from "@/components/install-app-banner";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, siteUrl } from "@/lib/seo";

// Es variable, así que no hace falta declarar pesos.
const georama = Georama({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_VE",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: siteUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
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
      <body className="antialiased">
        {/* Aplica el tema antes del primer paint: sin flash de tema claro. */}
        <ThemeHandler />
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
        <ServiceWorkerRegister />
        <InstallAppBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
