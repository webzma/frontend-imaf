import { PageShell } from "@/components/page-shell";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lo que se prerenderiza mientras el cliente toma el control.
 *
 * Las pantallas del panel leen sus filtros de la URL, así que Next las corta en
 * el límite de Suspense y sirve este contenido en el HTML. Con `fallback={null}`
 * el hueco quedaba vacío y la hidratación reclamaba una diferencia de texto;
 * además, quien entra con conexión lenta veía una página en blanco en vez de la
 * silueta de lo que está a punto de aparecer.
 */
export function PageFallback() {
  return (
    <PageShell>
      <div className="mb-10 space-y-4 md:mb-12">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-12 w-80 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-sm" />
    </PageShell>
  );
}
