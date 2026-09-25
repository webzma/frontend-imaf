import { Info, Minus, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Variacion } from "../metricas";

/**
 * Indicador del período: etiqueta, valor, variación frente al período
 * anterior y, debajo, un complemento (sparkline, medidor o acción).
 *
 * La variación lleva icono y signo además del color, y dice contra qué se
 * compara: un "+12%" suelto no dice si es bueno ni respecto de qué.
 */
export function KpiCard({
  label,
  info,
  value,
  variacion,
  mejorSiSube = true,
  comparacion,
  loading,
  children,
  className,
}: {
  label: string;
  info?: string;
  value: React.ReactNode;
  variacion?: Variacion;
  /** Para pendientes o rechazos, subir es malo. */
  mejorSiSube?: boolean;
  comparacion?: string;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-sm bg-surface-container-lowest py-5 shadow-none ring-0 ambient-shadow",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 px-5">
        <div className="flex items-center gap-1.5">
          <p className="font-sans text-xs font-medium text-muted-foreground">
            {label}
          </p>
          {info && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Cómo se calcula: ${label}`}
                  className="rounded-full text-muted-foreground/70 hover:text-on-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-60">{info}</TooltipContent>
            </Tooltip>
          )}
        </div>

        {loading ? (
          <Skeleton className="h-9 w-32" />
        ) : (
          <p className="font-sans text-3xl font-semibold tracking-tight text-on-surface tabular-nums">
            {value}
          </p>
        )}

        {!loading && variacion && (
          <DeltaBadge
            variacion={variacion}
            mejorSiSube={mejorSiSube}
            comparacion={comparacion}
          />
        )}

        {children && <div className="mt-auto pt-1">{children}</div>}
      </CardContent>
    </Card>
  );
}

function DeltaBadge({
  variacion,
  mejorSiSube,
  comparacion,
}: {
  variacion: Variacion;
  mejorSiSube: boolean;
  comparacion?: string;
}) {
  const { pct, direccion } = variacion;
  // Sin base de comparación no hay juicio: se muestra neutro.
  const bueno =
    direccion === "igual" || pct === null
      ? null
      : (direccion === "sube") === mejorSiSube;
  const Icono =
    pct === null
      ? Minus
      : direccion === "sube"
        ? TrendingUp
        : direccion === "baja"
          ? TrendingDown
          : Minus;
  const texto =
    pct === null
      ? "Sin datos del período anterior"
      : `${pct > 0 ? "+" : ""}${pct.toLocaleString("es-VE")}%`;

  return (
    <p className="flex flex-wrap items-center gap-1.5 font-sans text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
          bueno === null && "bg-surface-container-high text-muted-foreground",
          bueno === true && "bg-success-container text-on-success-container",
          bueno === false && "bg-danger-container text-on-danger-container",
        )}
      >
        <Icono aria-hidden="true" className="size-3" />
        {texto}
      </span>
      {pct !== null && comparacion && (
        <span className="text-muted-foreground">{comparacion}</span>
      )}
    </p>
  );
}
