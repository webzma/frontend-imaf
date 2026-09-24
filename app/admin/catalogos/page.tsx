"use client";

import { useEffect, useRef } from "react";
import { Layers } from "lucide-react";

import CatalogoPage from "@/components/catalogo-page";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATALOGOS } from "@/lib/admin-nav";
import { useUrlState } from "@/hooks/use-url-state";

/**
 * Los cuatro catálogos de instructores en una sola pantalla.
 *
 * Eran cuatro rutas sueltas a las que solo se llegaba desde cuatro botones al
 * final del panel de inicio: no estaban en la barra lateral, así que desde
 * cualquier otra sección no había forma de alcanzarlas. Como las cuatro son la
 * misma pantalla con otro sustantivo, se agrupan en pestañas y la pestaña
 * activa vive en la URL para que el enlace siga siendo compartible.
 */
export default function CatalogosPage() {
  const { get, set } = useUrlState();
  const activo = get("tipo", CATALOGOS[0].slug);
  const spec = CATALOGOS.find((c) => c.slug === activo) ?? CATALOGOS[0];
  const listaRef = useRef<HTMLDivElement>(null);

  // En móvil las pestañas se desplazan en horizontal y la activa podía quedar
  // fuera de la vista (con ?tipo=tipo-contratos no se veía cuál estaba
  // seleccionada). Se trae a la vista al cambiar.
  useEffect(() => {
    listaRef.current
      ?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [spec.slug]);

  return (
    <PageShell>
      <PageHeader
        icon={Layers}
        eyebrow="Configuración / Catálogos"
        title="Catálogos"
        subtitle="Las listas que alimentan los desplegables al registrar instructores. Un cambio aquí se ve de inmediato en esos formularios."
      />

      <Tabs value={spec.slug} onValueChange={(valor) => set("tipo", valor)}>
        <TabsList ref={listaRef}>
          {CATALOGOS.map((catalogo) => (
            <TabsTrigger key={catalogo.slug} value={catalogo.slug}>
              <catalogo.icon aria-hidden="true" />
              {catalogo.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATALOGOS.map((catalogo) => (
          <TabsContent key={catalogo.slug} value={catalogo.slug}>
            <p className="mb-6 max-w-2xl font-sans text-sm text-muted-foreground">
              {catalogo.subtitle}
            </p>
            {/* Solo se monta la pestaña visible: montar las cuatro dispararía
                cuatro peticiones al abrir la pantalla. */}
            {catalogo.slug === spec.slug && <CatalogoPage spec={catalogo} />}
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}
