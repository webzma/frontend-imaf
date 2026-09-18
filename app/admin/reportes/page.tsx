"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart2,
  BookOpen,
  CheckCircle,
  Clock,
  GraduationCap,
  Users,
  XCircle,
} from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { StatRow } from "@/components/stat-row";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScroll,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { LOCALE, formatCurrency } from "@/lib/format";
import { useUrlState } from "@/hooks/use-url-state";
import { BarraApilada } from "./_components/BarraApilada";
import { ChartCard } from "./_components/ChartCard";
import { PERIODOS, type Periodo, type ReporteData } from "./tipos";

function etiquetaPeriodo(label: string, periodo: Periodo) {
  if (periodo === "mensual") {
    const [anio, mes] = label.split("-");
    return new Date(Number(anio), Number(mes) - 1).toLocaleDateString(LOCALE, {
      month: "short",
      year: "2-digit",
    });
  }
  if (periodo === "semanal") return label.replace(/(\d{4})-W(\d+)/, "S$2 '$1");
  return label;
}

const ESTADO_ESTUDIANTE_LABEL: Record<string, string> = {
  activo: "Activos",
  inactivo: "Inactivos",
  graduado: "Graduados",
};

export default function ReportesPage() {
  const { get, set } = useUrlState();
  const periodo = (get("periodo", "mensual") as Periodo) ?? "mensual";

  /**
   * Todo sale de `/api/admin/reportes`.
   *
   * Los totales, la ocupación por curso y el reparto por estado se calculaban
   * en el navegador sobre la primera página de cada listado — diez registros —
   * así que esta pantalla publicaba cifras que no eran ciertas. Ahora los
   * agrega la base de datos.
   */
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminKeys.reportes(periodo),
    queryFn: () =>
      apiFetch<ReporteData>("api/admin/reportes", { params: { periodo } }),
  });

  const ingresos = useMemo(
    () =>
      (data?.ingresos ?? []).map((fila) => ({
        ...fila,
        etiqueta: etiquetaPeriodo(fila.label, periodo),
      })),
    [data, periodo],
  );

  const ocupacion = useMemo(
    () =>
      (data?.cursos ?? [])
        .filter((curso) => curso.estudiantes > 0)
        .slice(0, 8)
        .map((curso) => ({
          codigo: curso.codigo,
          nombre: curso.nombre,
          estudiantes: curso.estudiantes,
        })),
    [data],
  );

  const configIngresos = {
    total: { label: "Ingreso", color: "var(--color-chart-1)" },
  } satisfies ChartConfig;

  const configOcupacion = {
    estudiantes: { label: "Estudiantes", color: "var(--color-chart-2)" },
  } satisfies ChartConfig;

  const resumen = data?.resumen;
  const cursosActivos = data?.estado_cursos?.activo ?? 0;
  const totalCursos = data?.totales.cursos ?? 0;

  return (
    <PageShell>
      <PageHeader
        icon={BarChart2}
        eyebrow="Analítica / Reportes"
        title="Reportes"
        subtitle="Métricas de toda la plataforma, calculadas sobre la base completa."
      />

      {error ? (
        <ErrorState
          error={error}
          onRetry={refetch}
          fallback="No se pudieron cargar los reportes."
        />
      ) : (
        <>
          <StatRow
            className="mb-10"
            columns={3}
            loading={isLoading}
            stats={[
              {
                label: "Estudiantes",
                value: data?.totales.estudiantes ?? 0,
                icon: Users,
                tone: "primary",
                href: "/admin/estudiantes",
              },
              {
                label: "Cursos",
                value: totalCursos,
                sub: `${cursosActivos} activos`,
                icon: BookOpen,
                tone: "info",
                href: "/admin/cursos",
              },
              {
                label: "Instructores",
                value: data?.totales.instructores ?? 0,
                icon: GraduationCap,
                tone: "secondary",
                href: "/admin/instructores",
              },
            ]}
          />

          {/* ── Ingresos ── */}
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-light tight-tracking text-on-surface">
                Ingresos
              </h2>
              <p className="mt-0.5 font-sans text-xs text-muted-foreground">
                Suma de los pagos aprobados en el período seleccionado.
              </p>
            </div>

            {/* El período vive en la URL: un reporte anual se puede compartir. */}
            <div
              role="group"
              aria-label="Período del reporte"
              className="flex items-center gap-1 rounded-sm bg-surface-container-low p-1 ambient-shadow"
            >
              {PERIODOS.map((opcion) => (
                <button
                  key={opcion.key}
                  type="button"
                  aria-pressed={periodo === opcion.key}
                  onClick={() =>
                    set("periodo", opcion.key === "mensual" ? null : opcion.key)
                  }
                  className={`rounded-[3px] px-3 py-1.5 font-sans text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    periodo === opcion.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-on-surface"
                  }`}
                >
                  {opcion.label}
                </button>
              ))}
            </div>
          </div>

          <StatRow
            className="mb-6"
            columns={4}
            loading={isLoading}
            stats={[
              {
                label: "Total ingresos",
                value: resumen ? formatCurrency(resumen.total_ingresos) : "—",
                icon: BarChart2,
                tone: "success",
              },
              {
                label: "Aprobados",
                value: resumen?.aprobados ?? 0,
                icon: CheckCircle,
                tone: "success",
              },
              {
                label: "Pendientes",
                value: resumen?.pendientes ?? 0,
                icon: Clock,
                tone: "warning",
                href: "/admin/pagos?estado=pendiente",
              },
              {
                label: "Rechazados",
                value: resumen?.rechazados ?? 0,
                icon: XCircle,
                tone: "danger",
              },
            ]}
          />

          <ChartCard
            className="mb-6"
            title={`Ingresos por período`}
            description="Una sola serie, así que el color solo la distingue del fondo; el valor exacto aparece al pasar por encima."
          >
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : ingresos.length === 0 ? (
              <p className="py-10 text-center font-sans text-sm text-muted-foreground">
                Todavía no hay pagos aprobados en este período.
              </p>
            ) : (
              <ChartContainer
                config={configIngresos}
                className="h-[260px] w-full"
              >
                <BarChart
                  data={ingresos}
                  margin={{ top: 4, right: 8, left: 10 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="var(--color-outline-variant)"
                  />
                  <XAxis
                    dataKey="etiqueta"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontFamily: "var(--font-sans)", fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Bs. ${v}`}
                    tick={{ fontFamily: "var(--font-sans)", fontSize: 11 }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, props) => (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-on-surface">
                              {String(props.payload?.etiqueta ?? "")}
                            </span>
                            <span className="font-semibold text-on-surface">
                              {formatCurrency(Number(value))}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {String(props.payload?.cantidad ?? "")} pago
                              {Number(props.payload?.cantidad) !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="total"
                    fill="var(--color-chart-1)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </ChartCard>

          {/* ── Ocupación y reparto ── */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard
              title="Estudiantes por curso"
              description="Los ocho cursos con más matrícula."
            >
              {isLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : ocupacion.length === 0 ? (
                <p className="py-10 text-center font-sans text-sm text-muted-foreground">
                  Ningún curso tiene estudiantes matriculados.
                </p>
              ) : (
                // Barras horizontales: los nombres de curso son largos y en
                // vertical se recortaban o giraban 45°.
                <ChartContainer
                  config={configOcupacion}
                  className="h-[280px] w-full"
                >
                  <ResponsiveContainer>
                    <BarChart
                      data={ocupacion}
                      layout="vertical"
                      margin={{ top: 4, right: 32, left: 4 }}
                    >
                      <CartesianGrid
                        horizontal={false}
                        strokeDasharray="3 3"
                        stroke="var(--color-outline-variant)"
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="codigo"
                        width={80}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontFamily: "var(--font-sans)", fontSize: 11 }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, _name, props) => (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-on-surface">
                                  {String(props.payload?.nombre ?? "")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {Number(value)} estudiante
                                  {Number(value) !== 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Bar
                        dataKey="estudiantes"
                        fill="var(--color-chart-2)"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={22}
                      >
                        {/* Etiqueta directa: el valor exacto sin depender del hover. */}
                        <LabelList
                          dataKey="estudiantes"
                          position="right"
                          className="fill-muted-foreground"
                          fontSize={11}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </ChartCard>

            <ChartCard
              title="Reparto de estudiantes"
              description="Estado de la matrícula sobre el total registrado."
            >
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <BarraApilada
                  segmentos={[
                    {
                      label: ESTADO_ESTUDIANTE_LABEL.activo,
                      value: data?.estado_estudiantes?.activo ?? 0,
                      slot: 1,
                    },
                    {
                      label: ESTADO_ESTUDIANTE_LABEL.graduado,
                      value: data?.estado_estudiantes?.graduado ?? 0,
                      slot: 2,
                    },
                    {
                      label: ESTADO_ESTUDIANTE_LABEL.inactivo,
                      value: data?.estado_estudiantes?.inactivo ?? 0,
                      slot: 3,
                    },
                  ]}
                />
              )}

              <div className="mt-8 border-t border-outline-variant pt-6">
                <h3 className="mb-3 font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                  Cursos
                </h3>
                {/* Dos clases no son una gráfica: son un número con contexto. */}
                <p className="font-sans text-sm text-on-surface">
                  <span className="font-serif text-3xl font-light tabular-nums">
                    {cursosActivos}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    de {totalCursos} {totalCursos === 1 ? "curso" : "cursos"}{" "}
                    {totalCursos === 1 ? "está activo" : "están activos"}
                  </span>
                </p>
              </div>
            </ChartCard>
          </div>

          {/* ── Tablas: la vista de datos de las gráficas de arriba ── */}
          <TablaPagosCurso data={data} loading={isLoading} />
          <TablaPagosUsuario data={data} loading={isLoading} />
        </>
      )}
    </PageShell>
  );
}

function TablaPagosCurso({
  data,
  loading,
}: {
  data?: ReporteData;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="mb-6 h-48 w-full rounded-sm" />;
  if (!data?.pagos_por_curso?.length) return null;

  return (
    <ChartCard
      className="mb-6"
      title="Pagos por curso"
      description="Recaudación y estado de los pagos de cada curso."
    >
      <TableScroll>
        <Table className="table-sticky-first [--table-sticky-bg:var(--surface-container-lowest)]">
          <TableCaption>
            Cursos con su precio, pagos aprobados, pendientes, rechazados e
            ingreso total.
          </TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-0 py-2 pr-4">Curso</TableHead>
              <TableHead className="px-0 py-2 pr-4 text-right">
                Precio
              </TableHead>
              <TableHead className="px-0 py-2 pr-4 text-right">
                Aprobados
              </TableHead>
              <TableHead className="px-0 py-2 pr-4 text-right">
                Pendientes
              </TableHead>
              <TableHead className="px-0 py-2 pr-4 text-right">
                Rechazados
              </TableHead>
              <TableHead className="px-0 py-2 text-right">Ingreso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.pagos_por_curso.map((fila) => (
              <TableRow key={fila.curso_id}>
                <TableCell className="px-0 py-2.5 pr-4">
                  <span className="font-medium">{fila.nombre}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {fila.codigo}
                  </span>
                </TableCell>
                <TableCell className="px-0 py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                  {formatCurrency(fila.precio)}
                </TableCell>
                <TableCell className="px-0 py-2.5 pr-4 text-right tabular-nums">
                  {fila.aprobados}
                </TableCell>
                <TableCell className="px-0 py-2.5 pr-4 text-right tabular-nums">
                  {fila.pendientes}
                </TableCell>
                <TableCell className="px-0 py-2.5 pr-4 text-right tabular-nums">
                  {fila.rechazados}
                </TableCell>
                <TableCell className="px-0 py-2.5 text-right font-semibold tabular-nums">
                  {formatCurrency(fila.total_ingreso)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScroll>
    </ChartCard>
  );
}

function TablaPagosUsuario({
  data,
  loading,
}: {
  data?: ReporteData;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-48 w-full rounded-sm" />;
  if (!data?.pagos_por_usuario?.length) return null;

  return (
    <ChartCard
      title="Pagos por estudiante"
      description="Quién ha pagado, cuánto y en qué estado quedó."
    >
      <TableScroll>
        <Table className="table-sticky-first [--table-sticky-bg:var(--surface-container-lowest)]">
          <TableCaption>
            Estudiantes con su número de pagos por estado y el ingreso aportado.
          </TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-0 py-2 pr-4">Estudiante</TableHead>
              <TableHead className="px-0 py-2 pr-4 text-right">Pagos</TableHead>
              <TableHead className="px-0 py-2 pr-4 text-right">
                Aprobados
              </TableHead>
              <TableHead className="px-0 py-2 pr-4 text-right">
                Pendientes
              </TableHead>
              <TableHead className="px-0 py-2 text-right">Ingreso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.pagos_por_usuario.slice(0, 20).map((fila) => (
              <TableRow key={fila.user_id}>
                <TableCell className="px-0 py-2.5 pr-4 font-medium">
                  {fila.nombre}
                </TableCell>
                <TableCell className="px-0 py-2.5 pr-4 text-right tabular-nums">
                  {fila.total_pagos}
                </TableCell>
                <TableCell className="px-0 py-2.5 pr-4 text-right tabular-nums">
                  {fila.aprobados}
                </TableCell>
                <TableCell className="px-0 py-2.5 pr-4 text-right tabular-nums">
                  {fila.pendientes}
                </TableCell>
                <TableCell className="px-0 py-2.5 text-right font-semibold tabular-nums">
                  {formatCurrency(fila.total_ingreso)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScroll>
    </ChartCard>
  );
}
