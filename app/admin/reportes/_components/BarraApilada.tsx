import { cn } from "@/lib/utils";

export interface Segmento {
  label: string;
  value: number;
  /** Token de color de la paleta categórica: 1, 2 o 3. */
  slot: 1 | 2 | 3;
  /** Texto secundario bajo la etiqueta (p. ej. "4 pagos"). */
  detalle?: string;
}

/**
 * Parte-de-un-todo con tres clases como mucho.
 *
 * Aquí había dos gráficas de tarta con el porcentaje escrito en blanco sobre
 * cada porción y colores `oklch(...)` escritos a mano, fuera de los tokens. Una
 * tarta obliga a comparar ángulos; una barra apilada horizontal se lee de un
 * vistazo, deja sitio a la etiqueta al lado de cada color y cabe en el ancho de
 * un móvil. Los segmentos se separan 2px para que dos colores contiguos no se
 * fundan, y cada uno lleva su etiqueta y su número: el color nunca es el único
 * canal.
 */
export function BarraApilada({
  segmentos,
  formato = (n) => n.toLocaleString("es-VE"),
  vacio = "Sin datos todavía.",
  className,
}: {
  segmentos: Segmento[];
  /** Cómo se escribe cada valor en la leyenda. */
  formato?: (valor: number) => string;
  vacio?: string;
  className?: string;
}) {
  const total = segmentos.reduce((suma, s) => suma + s.value, 0);
  const visibles = segmentos.filter((s) => s.value > 0);

  if (total === 0) {
    return (
      <p className="py-10 text-center font-sans text-sm text-muted-foreground">
        {vacio}
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        aria-hidden="true"
        className="flex h-6 w-full gap-0.5 overflow-hidden rounded-sm"
      >
        {visibles.map((segmento) => (
          <div
            key={segmento.label}
            className="h-full first:rounded-l-sm last:rounded-r-sm"
            style={{
              width: `${(segmento.value / total) * 100}%`,
              backgroundColor: `var(--chart-${segmento.slot})`,
            }}
          />
        ))}
      </div>

      {/* La leyenda es también la tabla: etiqueta, valor y porcentaje. */}
      <ul className="space-y-2">
        {segmentos.map((segmento) => (
          <li
            key={segmento.label}
            className="flex items-center gap-2 font-sans text-sm"
          >
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: `var(--chart-${segmento.slot})` }}
            />
            <span className="flex-1 text-on-surface">
              {segmento.label}
              {segmento.detalle && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {segmento.detalle}
                </span>
              )}
            </span>
            <span className="tabular-nums text-on-surface">
              {formato(segmento.value)}
            </span>
            <span className="w-12 text-right tabular-nums text-muted-foreground">
              {total > 0 ? Math.round((segmento.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
