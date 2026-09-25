"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  CalendarRange,
  Download,
  GraduationCap,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatRow } from "@/components/stat-row";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { apiFetch } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { formatCurrency } from "@/lib/format";
import { useUrlState } from "@/hooks/use-url-state";
import { BarraApilada } from "./_components/BarraApilada";
import {
  GraficaIngresos,
  GraficaSolicitudes,
  Sparkline,
} from "./_components/Graficas";
import { KpiCard } from "./_components/KpiCard";
import { Ocupacion } from "./_components/Ocupacion";
import { Panel } from "./_components/Panel";
import { TablasDetalle } from "./_components/TablasDetalle";
import {
  descargarCsv,
  ocupacion,
  rango,
  tasaAprobacion,
  variacion,
} from "./metricas";
import {
  PERIODOS,
  type MetodoPago,
  type Periodo,
  type ReporteData,
} from "./tipos";

const METODO_LABEL: Record<MetodoPago["metodo"], string> = {
  transferencia: "Transferencia",
  pago_movil: "Pago móvil",
  efectivo: "Efectivo",
  sin_especificar: "Sin especificar",
};

/** Orden fijo de colores por método: el color sigue al método, no al puesto. */
const METODO_SLOT: Record<MetodoPago["metodo"], 1 | 2 | 3> = {
  transferencia: 1,
  pago_movil: 2,
  efectivo: 3,
  sin_especificar: 3,
};

export default function ReportesPage() {
  const { get, set } = useUrlState();
  const valor = get("periodo", "mensual");
  const periodo: Periodo = PERIODOS.some((p) => p.key === valor)
    ? (valor as Periodo)
    : "mensual";
  const spec = PERIODOS.find((p) => p.key === periodo)!;

  /**
   * Todo sale de `/api/admin/reportes`, agregado sobre la base completa. Los
   * indicadores de arriba son de la ventana elegida y se comparan con la
   * ventana anterior de igual duración.
   */
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: adminKeys.reportes(periodo),
    queryFn: () =>
      apiFetch<ReporteData>("api/admin/reportes", { params: { periodo } }),
    placeholderData: (previo) => previo,
  });

  const actual = data?.periodo.actual;
  const anterior = data?.periodo.anterior;
  const comparacion = `vs. ${spec.ventana} anteriores`;
  const tasa = actual
    ? tasaAprobacion(actual.aprobados, actual.rechazados)
    : null;
  const tasaPrevia = anterior
    ? tasaAprobacion(anterior.aprobados, anterior.rechazados)
    : null;

  const ocupacionMedia = useMemo(() => {
    const activos = (data?.cursos ?? []).filter((c) => c.estado === "activo");
    if (activos.length === 0) return null;
    return Math.round(
      activos.reduce((s, c) => s + ocupacion(c.estudiantes, c.limite_cupo), 0) /
        activos.length,
    );
  }, [data]);

  const exportar = (que: "serie" | "cursos" | "estudiantes") => {
    if (!data) return;
    if (que === "serie") {
      descargarCsv(`ingresos-${periodo}.csv`, [
        [
          "Período",
          "Desde",
          "Ingresos (Bs.)",
          "Aprobados",
          "Pendientes",
          "Rechazados",
        ],
        ...data.ingresos.map((f) => [
          f.label,
          f.desde,
          f.total,
          f.aprobados,
          f.pendientes,
          f.rechazados,
        ]),
      ]);
    } else if (que === "cursos") {
      descargarCsv("pagos-por-curso.csv", [
        [
          "Curso",
          "Código",
          "Precio",
          "Aprobados",
          "Pendientes",
          "Rechazados",
          "Ingreso",
        ],
        ...data.pagos_por_curso.map((c) => [
          c.nombre,
          c.codigo,
          c.precio,
          c.aprobados,
          c.pendientes,
          c.rechazados,
          c.total_ingreso,
        ]),
      ]);
    } else {
      descargarCsv("pagos-por-estudiante.csv", [
        [
          "Estudiante",
          "Pagos",
          "Aprobados",
          "Pendientes",
          "Rechazados",
          "Ingreso",
        ],
        ...data.pagos_por_usuario.map((u) => [
          u.nombre,
          u.total_pagos,
          u.aprobados,
          u.pendientes,
          u.rechazados,
          u.total_ingreso,
        ]),
      ]);
    }
  };

  const cargando = isLoading;

  return (
    <PageShell>
      <PageHeader
        icon={BarChart2}
        eyebrow="Analítica / Reportes"
        title="Reportes"
        subtitle="Ingresos, pagos y ocupación de toda la plataforma, calculados sobre la base completa."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* El período vive en la URL: un reporte anual se puede compartir. */}
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={periodo}
              onValueChange={(v) =>
                v && set("periodo", v === "mensual" ? null : v)
              }
              aria-label="Período del reporte"
              className="bg-surface-container-lowest"
            >
              {PERIODOS.map((p) => (
                <ToggleGroupItem
                  key={p.key}
                  value={p.key}
                  className="px-3 text-xs font-semibold data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {p.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!data}>
                  <Download data-icon="inline-start" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Descargar CSV</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => exportar("serie")}>
                  Serie de ingresos ({spec.label.toLowerCase()})
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportar("cursos")}>
                  Pagos por curso
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportar("estudiantes")}>
                  Pagos por estudiante
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {error ? (
        <ErrorState
          error={error}
          onRetry={refetch}
          fallback="No se pudieron cargar los reportes."
        />
      ) : (
        <div
          className={`flex flex-col gap-6 transition-opacity ${isFetching && !isLoading ? "opacity-70" : ""}`}
          aria-busy={isFetching}
        >
          {/* ── Indicadores del período ── */}
          <section aria-labelledby="titulo-periodo">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2
                id="titulo-periodo"
                className="font-serif text-2xl font-light tight-tracking text-on-surface"
              >
                Últimos {spec.ventana}
              </h2>
              {data && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-0.5 font-sans text-xs text-muted-foreground">
                  <CalendarRange aria-hidden="true" className="size-3.5" />
                  {rango(data.periodo.desde, data.periodo.hasta)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Ingresos"
                info="Suma del precio del curso de cada pago aprobado, según la fecha en que se reportó el pago."
                loading={cargando}
                value={actual ? formatCurrency(actual.ingresos) : "—"}
                variacion={
                  actual && anterior
                    ? variacion(actual.ingresos, anterior.ingresos)
                    : undefined
                }
                comparacion={comparacion}
              >
                {data && <Sparkline serie={data.ingresos} />}
              </KpiCard>

              <KpiCard
                label="Pagos aprobados"
                info="Solicitudes de inscripción cuyo pago verificó la administración."
                loading={cargando}
                value={actual?.aprobados.toLocaleString("es-VE") ?? "—"}
                variacion={
                  actual && anterior
                    ? variacion(actual.aprobados, anterior.aprobados)
                    : undefined
                }
                comparacion={comparacion}
              >
                {actual && (
                  <p className="font-sans text-xs text-muted-foreground">
                    de {actual.total_pagos.toLocaleString("es-VE")} solicitudes
                    recibidas
                  </p>
                )}
              </KpiCard>

              <KpiCard
                label="Tasa de aprobación"
                info="Aprobados sobre los pagos ya resueltos (aprobados + rechazados). Los pendientes no cuentan."
                loading={cargando}
                value={tasa === null ? "—" : `${tasa}%`}
                variacion={
                  tasa !== null && tasaPrevia !== null
                    ? variacion(tasa, tasaPrevia)
                    : undefined
                }
                comparacion={comparacion}
              >
                {actual && (
                  <div className="flex flex-col gap-1.5">
                    <Progress
                      value={tasa ?? 0}
                      aria-hidden="true"
                      className="h-2 bg-surface-container-high [&>[data-slot=progress-indicator]]:bg-chart-aprobado"
                    />
                    <p className="font-sans text-xs text-muted-foreground">
                      {actual.rechazados} rechazado
                      {actual.rechazados === 1 ? "" : "s"}
                    </p>
                  </div>
                )}
              </KpiCard>

              <KpiCard
                label="Pendientes de revisar"
                info="Pagos reportados en la ventana que todavía no se han aprobado ni rechazado."
                loading={cargando}
                value={actual?.pendientes.toLocaleString("es-VE") ?? "—"}
                className={
                  actual && actual.pendientes > 0
                    ? "ring-1 ring-inset ring-warning/40"
                    : undefined
                }
              >
                {actual && actual.pendientes > 0 ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Link href="/admin/pagos?estado=pendiente">
                      Revisar pagos
                      <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                ) : actual ? (
                  <p className="font-sans text-xs text-muted-foreground">
                    Todo al día.
                  </p>
                ) : null}
              </KpiCard>
            </div>
          </section>

          {/* ── Evolución ── */}
          <Tabs defaultValue="ingresos" className="gap-0">
            <Panel
              title="Evolución"
              description={`Por ${periodo === "semanal" ? "semana" : periodo === "anual" ? "año" : "mes"}, últimos ${spec.ventana}. Pasa el cursor por una barra para ver el detalle.`}
              action={
                <TabsList className="border-b-0">
                  <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
                  <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
                </TabsList>
              }
            >
              {cargando ? (
                <Skeleton className="h-72 w-full" />
              ) : !data ||
                data.ingresos.every(
                  (f) =>
                    f.total === 0 &&
                    f.aprobados + f.pendientes + f.rechazados === 0,
                ) ? (
                <p className="py-16 text-center font-sans text-sm text-muted-foreground">
                  No hubo pagos en los últimos {spec.ventana}.
                </p>
              ) : (
                <>
                  <TabsContent value="ingresos">
                    <GraficaIngresos serie={data.ingresos} periodo={periodo} />
                  </TabsContent>
                  <TabsContent value="solicitudes">
                    <GraficaSolicitudes
                      serie={data.ingresos}
                      periodo={periodo}
                    />
                  </TabsContent>
                </>
              )}
            </Panel>
          </Tabs>

          {/* ── Ocupación y composición ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Panel
              className="lg:col-span-3"
              title="Ocupación de cursos"
              description="Inscritos con el pago aprobado sobre el cupo de cada curso."
            >
              {cargando ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <Ocupacion cursos={data?.cursos ?? []} />
              )}
            </Panel>

            <div className="flex flex-col gap-6 lg:col-span-2">
              <Panel
                title="Métodos de pago"
                description={`Ingresos aprobados por método, últimos ${spec.ventana}.`}
              >
                {cargando ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <BarraApilada
                    formato={formatCurrency}
                    vacio="Sin pagos aprobados en este período."
                    segmentos={(data?.periodo.metodos_pago ?? []).map((m) => ({
                      label: METODO_LABEL[m.metodo],
                      value: m.ingresos,
                      slot: METODO_SLOT[m.metodo],
                      detalle: `${m.cantidad} pago${m.cantidad === 1 ? "" : "s"}`,
                    }))}
                  />
                )}
              </Panel>

              <Panel
                title="Estudiantes"
                description="Estado de la matrícula sobre el total registrado."
              >
                {cargando ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <BarraApilada
                    segmentos={[
                      {
                        label: "Activos",
                        value: data?.estado_estudiantes?.activo ?? 0,
                        slot: 1,
                      },
                      {
                        label: "Graduados",
                        value: data?.estado_estudiantes?.graduado ?? 0,
                        slot: 2,
                      },
                      {
                        label: "Inactivos",
                        value: data?.estado_estudiantes?.inactivo ?? 0,
                        slot: 3,
                      },
                    ]}
                  />
                )}
              </Panel>
            </div>
          </div>

          {/* ── Plataforma (histórico) ── */}
          <section aria-labelledby="titulo-plataforma">
            <div className="mb-3 flex items-center gap-3">
              <h2
                id="titulo-plataforma"
                className="font-serif text-2xl font-light tight-tracking text-on-surface"
              >
                Plataforma
              </h2>
              <Separator className="flex-1" />
              {data && (
                <p className="font-sans text-xs text-muted-foreground">
                  Histórico:{" "}
                  <span className="font-semibold text-on-surface tabular-nums">
                    {formatCurrency(data.resumen.total_ingresos)}
                  </span>{" "}
                  en {data.resumen.aprobados.toLocaleString("es-VE")} pagos
                </p>
              )}
            </div>
            <StatRow
              columns={4}
              loading={cargando}
              className="max-sm:grid-cols-2"
              stats={[
                {
                  label: "Estudiantes",
                  value: data?.totales.estudiantes ?? 0,
                  sub: `${data?.estado_estudiantes?.activo ?? 0} activos`,
                  icon: Users,
                  tone: "primary",
                  href: "/admin/estudiantes",
                },
                {
                  label: "Cursos",
                  value: data?.totales.cursos ?? 0,
                  sub: `${data?.estado_cursos?.activo ?? 0} activos`,
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
                {
                  label: "Ocupación media",
                  value: ocupacionMedia === null ? "—" : `${ocupacionMedia}%`,
                  sub: "de los cursos activos",
                  icon: BarChart2,
                  tone: "success",
                },
              ]}
            />
          </section>

          {/* ── Detalle ── */}
          <Panel
            title="Detalle de pagos"
            description="Histórico por curso y por estudiante: la vista en tabla de todo lo anterior."
          >
            {cargando ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <TablasDetalle
                porCurso={data?.pagos_por_curso ?? []}
                porUsuario={data?.pagos_por_usuario ?? []}
              />
            )}
          </Panel>
        </div>
      )}
    </PageShell>
  );
}
