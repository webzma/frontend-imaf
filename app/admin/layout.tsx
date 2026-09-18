import { Suspense } from "react";

import AppSidebar from "./_components/Sidebar";
import AdminMobileNavbar from "./_components/MobileNavbar";
import { AdminHeader } from "./_components/AdminHeader";
import { PageFallback } from "./_components/PageFallback";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        {/* Con diez enlaces en la barra lateral, llegar al contenido con el
            teclado costaba diez tabulaciones en cada pantalla. */}
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:text-primary-foreground"
        >
          Ir al contenido
        </a>

        <AppSidebar />

        <SidebarInset>
          {/* La cabecera no lee parámetros de la URL, así que no lleva límite
              de Suspense: envolverla dejaba un hueco pendiente en el HTML
              prerenderizado y la hidratación reclamaba un texto distinto. */}
          <AdminHeader />

          <div
            id="contenido-principal"
            tabIndex={-1}
            className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] outline-none md:pb-0"
          >
            {/* Las pantallas leen sus filtros de la URL con `useSearchParams`,
                que exige un límite de Suspense; aquí cubre todo el panel. */}
            <Suspense fallback={<PageFallback />}>{children}</Suspense>
          </div>

          <AdminMobileNavbar />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
