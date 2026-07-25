"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import LogoImaf from "@/public/logo-imaf.webp";

const sections = [
  { href: "#beneficios", label: "Beneficios" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#faq", label: "Preguntas frecuentes" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-surface-container-lowest/85 glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-5">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={LogoImaf} alt="" width={30} height={30} />
            <span className="font-serif text-2xl font-semibold text-on-surface">
              IMAF
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {sections.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="text-sm text-muted-foreground hover:text-on-surface transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {s.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover transition-colors font-medium text-sm rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Iniciar sesión
            </Link>
            {/* Una sola etiqueta para esta acción en toda la página. */}
            <Link
              href="/register"
              className="bg-primary text-primary-foreground rounded-md px-5 py-2.5 ambient-shadow hover:bg-primary-hover transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Crear cuenta
            </Link>
            {/* Sin esto, en móvil no había ninguna navegación entre secciones. */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="landing-menu"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              className="md:hidden -mr-1 p-2 rounded-md text-on-surface hover:bg-surface-container transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div id="landing-menu" className="md:hidden pt-4">
            <ul className="flex flex-col border-t border-outline-variant pt-2">
              {sections.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-sm text-muted-foreground hover:text-on-surface transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
