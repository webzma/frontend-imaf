"use client";

import { useEffect, useRef } from "react";
import type { LucideIcon } from "lucide-react";

import CatalogoPage from "@/components/catalogo-page";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CatalogoSpec } from "@/lib/admin-nav";
import { useUrlState } from "@/hooks/use-url-state";

interface CatalogosViewProps {
  catalogos: CatalogoSpec[];
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export default function CatalogosView({
  catalogos,
  eyebrow,
  title,
  subtitle,
  icon: Icon,
}: CatalogosViewProps) {
  const { get, set } = useUrlState();
  const activo = get("tipo", catalogos[0].slug);
  const spec = catalogos.find((c) => c.slug === activo) ?? catalogos[0];
  const listaRef = useRef<HTMLDivElement>(null);

  // En móvil las pestañas se desplazan en horizontal y la activa podía quedar
  // fuera de la vista. Se trae a la vista al cambiar.
  useEffect(() => {
    listaRef.current
      ?.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [spec.slug]);

  return (
    <PageShell>
      <PageHeader
        icon={Icon}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
      />

      {catalogos.length === 1 ? (
        <>
          <p className="mb-6 max-w-2xl font-sans text-sm text-muted-foreground">
            {spec.subtitle}
          </p>
          <CatalogoPage spec={spec} />
        </>
      ) : (
        <Tabs value={spec.slug} onValueChange={(valor) => set("tipo", valor)}>
          <TabsList ref={listaRef}>
            {catalogos.map((catalogo) => (
              <TabsTrigger key={catalogo.slug} value={catalogo.slug}>
                <catalogo.icon aria-hidden="true" />
                {catalogo.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {catalogos.map((catalogo) => (
            <TabsContent key={catalogo.slug} value={catalogo.slug}>
              <p className="mb-6 max-w-2xl font-sans text-sm text-muted-foreground">
                {catalogo.subtitle}
              </p>
              {/* Solo se monta la pestaña visible para no lanzar una petición
                  por cada catálogo al abrir la pantalla. */}
              {catalogo.slug === spec.slug && <CatalogoPage spec={catalogo} />}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </PageShell>
  );
}
