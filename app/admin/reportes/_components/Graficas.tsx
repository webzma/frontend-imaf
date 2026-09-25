"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import { etiquetaCorta, etiquetaLarga } from "../metricas";
import type { IngresoItem, Periodo } from "../tipos";

const TICK = { fontFamily: "var(--font-sans)", fontSize: 11 };

/** "Bs. 1,2 mil" en el eje: los importes completos no caben. */
const compacto = new Intl.NumberFormat("es-VE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

interface Fila extends IngresoItem {
  etiqueta: string;
  etiquetaLarga: string;
}

function filas(serie: IngresoItem[], periodo: Periodo): Fila[] {
  return serie.map((f) => ({
    ...f,
    etiqueta: etiquetaCorta(f.label, periodo),
    etiquetaLarga: etiquetaLarga(f.desde, periodo),
  }));
}

/* ── Sparkline del indicador de ingresos ── */

const configSpark = {
  total: { label: "Ingresos", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Tendencia del indicador. Sin ejes ni tooltip: el detalle está en la
 * gráfica grande; aquí solo importa la forma.
 */
export function Sparkline({ serie }: { serie: IngresoItem[] }) {
  if (serie.length < 2) return null;
  return (
    <ChartContainer
      config={configSpark}
      className="aspect-auto h-10 w-full"
      aria-hidden="true"
    >
      <AreaChart data={serie} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id="spark-ingresos" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-total)"
              stopOpacity={0.25}
            />
            <stop
              offset="100%"
              stopColor="var(--color-total)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="total"
          type="monotone"
          stroke="var(--color-total)"
          strokeWidth={2}
          fill="url(#spark-ingresos)"
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/* ── Ingresos por período ── */

const configIngresos = {
  total: { label: "Ingresos", color: "var(--chart-1)" },
} satisfies ChartConfig;

/**
 * Una sola serie, así que no lleva leyenda: el título la nombra. Se rotula
 * solo el máximo y la media va como referencia; el resto, al pasar el ratón.
 */
export function GraficaIngresos({
  serie,
  periodo,
}: {
  serie: IngresoItem[];
  periodo: Periodo;
}) {
  const datos = filas(serie, periodo);
  const maximo = Math.max(...datos.map((d) => d.total), 0);
  const conIngreso = datos.filter((d) => d.total > 0);
  const media =
    conIngreso.length > 0
      ? conIngreso.reduce((s, d) => s + d.total, 0) / datos.length
      : 0;

  return (
    <ChartContainer config={configIngresos} className="aspect-auto h-72 w-full">
      <BarChart data={datos} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--outline-variant)" />
        <XAxis
          dataKey="etiqueta"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={TICK}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tick={TICK}
          tickFormatter={(v: number) => `Bs. ${compacto.format(v)}`}
        />
        <ChartTooltip
          cursor={{ fill: "var(--surface-container)" }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) =>
                String(payload?.[0]?.payload?.etiquetaLarga ?? "")
              }
              formatter={(value, _name, item) => {
                const n = Number(item.payload?.aprobados ?? 0);
                return (
                  <div className="flex w-full flex-col gap-0.5">
                    <span className="font-semibold text-on-surface tabular-nums">
                      {formatCurrency(Number(value))}
                    </span>
                    <span className="text-muted-foreground">
                      {n === 1 ? "1 pago aprobado" : `${n} pagos aprobados`}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        {media > 0 && (
          <ReferenceLine
            y={media}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.6}
            ifOverflow="extendDomain"
            label={{
              value: `Media ${formatCurrency(media)}`,
              position: "insideTopLeft",
              fill: "var(--muted-foreground)",
              fontSize: 10,
            }}
          />
        )}
        <Bar
          dataKey="total"
          fill="var(--color-total)"
          radius={[4, 4, 0, 0]}
          maxBarSize={44}
        >
          <LabelList
            dataKey="total"
            position="top"
            content={({ x, y, width, value }) =>
              maximo > 0 && Number(value) === maximo ? (
                <text
                  x={Number(x) + Number(width) / 2}
                  y={Number(y) - 6}
                  textAnchor="middle"
                  className="fill-on-surface font-sans text-[11px] font-semibold"
                >
                  {`Bs. ${compacto.format(Number(value))}`}
                </text>
              ) : null
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* ── Solicitudes por estado ── */

const configSolicitudes = {
  aprobados: { label: "Aprobados", color: "var(--chart-aprobado)" },
  pendientes: { label: "Pendientes", color: "var(--chart-pendiente)" },
  rechazados: { label: "Rechazados", color: "var(--chart-rechazado)" },
} satisfies ChartConfig;

/**
 * Barras apiladas con los tres estados. Los segmentos se separan con un trazo
 * del color de la superficie (2px): el par ámbar/verde en modo oscuro está en
 * la banda 6–8 de ΔE bajo daltonismo y necesita esa codificación secundaria,
 * además de la leyenda y del tooltip con cifras.
 */
export function GraficaSolicitudes({
  serie,
  periodo,
}: {
  serie: IngresoItem[];
  periodo: Periodo;
}) {
  const datos = filas(serie, periodo);
  const hueco = {
    stroke: "var(--surface-container-lowest)",
    strokeWidth: 2,
  };

  return (
    <ChartContainer
      config={configSolicitudes}
      className="aspect-auto h-72 w-full"
    >
      <BarChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--outline-variant)" />
        <XAxis
          dataKey="etiqueta"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={TICK}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={32}
          tick={TICK}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ fill: "var(--surface-container)" }}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_, payload) =>
                String(payload?.[0]?.payload?.etiquetaLarga ?? "")
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="aprobados"
          stackId="estado"
          fill="var(--color-aprobados)"
          maxBarSize={44}
          {...hueco}
        />
        <Bar
          dataKey="pendientes"
          stackId="estado"
          fill="var(--color-pendientes)"
          maxBarSize={44}
          {...hueco}
        />
        <Bar
          dataKey="rechazados"
          stackId="estado"
          fill="var(--color-rechazados)"
          radius={[4, 4, 0, 0]}
          maxBarSize={44}
          {...hueco}
        />
      </BarChart>
    </ChartContainer>
  );
}
