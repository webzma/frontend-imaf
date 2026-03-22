import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: "IMAF",
  description: "Plataforma educativa — Aprende sin límites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans", cormorantGaramond.variable, manrope.variable)}>
      <body className="antialiased">
        <NextTopLoader color="oklch(0.52 0.14 8)" shadow={false} showSpinner={false} height={2} />
        <Toaster richColors position="bottom-right" />
        {children}
      </body>
    </html>
  );
}
