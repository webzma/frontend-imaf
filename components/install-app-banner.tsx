"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useTheme } from "@/hooks/use-theme";
import LogoImaf from "@/public/logo-imaf.webp";
import LogoImafDark from "@/public/logo-imaf-dark.webp";

export function InstallAppBanner() {
  const pathname = usePathname();
  const { dark } = useTheme();
  const { canInstall, install, dismiss } = useInstallPrompt();
  const logo = dark ? LogoImafDark : LogoImaf;

  if (pathname === "/" || !canInstall) return null;

  return (
    <aside
      aria-label="Instalar la aplicación IMAF"
      className="fixed top-4 right-4 left-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300 sm:top-6 sm:right-6 sm:left-auto sm:w-[22rem]"
    >
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 ambient-shadow">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest">
            <Image
              src={logo}
              alt="IMAF"
              width={40}
              height={67}
              className="h-11 w-auto object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-sans font-semibold text-on-surface">
              Instalar App
            </p>
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
              Accede más fácil a la plataforma IMAF
            </p>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar"
            className="-mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Ahora no
          </Button>
          <Button size="sm" onClick={install} className="px-4">
            <Download />
            Instalar
          </Button>
        </div>
      </div>
    </aside>
  );
}
