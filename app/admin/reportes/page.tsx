"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart2,
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

/* ── Types ── */

interface Estudiante {
  id: number;
  estado: string;
  curso_id: number | null;
  user?: { name: string };
}

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  estado: "activo" | "inactivo";
  estudiantes?: Estudiante[];
}

interface Instructor {
  id: number;
  user?: { name: string };
}

interface IngresoItem {
  label: string;
  total: number;
  cantidad: number;
}

interface PagoUsuario {
  user_id: number;
  nombre: string;
  total_pagos: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  total_ingreso: number;
}

interface PagoCurso {
  curso_id: number;
  nombre: string;
  codigo: string;
  precio: number;
  total_pagos: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  total_ingreso: number;
}

interface ResumenReporte {
  total_pagos: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  total_ingresos: number;
}

interface ReporteData {
  ingresos: IngresoItem[];
  pagos_por_usuario: PagoUsuario[];
  pagos_por_curso: PagoCurso[];
  resumen: ResumenReporte;
}

/* ── Helpers ── */

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${getCookie("token")}`,
    Accept: "application/json",
  };
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtLabel(label: string, periodo: string) {
  if (periodo === "mensual") {
    const [y, m] = label.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("es-ES", {
      month: "short",
      year: "2-digit",
    });
  }
  if (periodo === "semanal") return label.replace(/(\d{4})-W(\d+)/, "S$2 '$1");
  return label;
}

/* ── Stat Card ── */

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  containerClass = "bg-primary-container",
  iconClass = "text-on-primary-container",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
  containerClass?: string;
  iconClass?: string;
}) {
  return (
    <div className="bg-surface-container-low rounded-sm p-5 ambient-shadow">
      <div
        className={`w-10 h-10 rounded-md flex items-center justify-center ${containerClass} mb-4`}
      >
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
      <p className="font-sans text-3xl font-light tight-tracking text-on-surface tabular-nums mb-1">
        {value}
      </p>
      <p className="font-sans text-xs tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
        {label}
      </p>
      {sub && (
        <p className="font-sans text-xs text-muted-foreground mt-1">{sub}</p>
      )}
    </div>
  );
}

/* ── Chart Section Wrapper ── */

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
      <div className="mb-5">
        <h2 className="font-serif font-light text-xl tight-tracking text-on-surface">
          {title}
        </h2>
        {description && (
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Custom Pie Label ── */

const RADIAN = Math.PI / 180;
function PieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="font-sans text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* ── Period Tab ── */

const PERIODOS = [
  { key: "semanal", label: "Semanal" },
  { key: "mensual", label: "Mensual" },
  { key: "anual", label: "Anual" },
] as const;

type Periodo = (typeof PERIODOS)[number]["key"];

/* ── Page ── */

export default function ReportesPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReporte, setLoadingReporte] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("mensual");

  /* Base data */
  useEffect(() => {
    const headers = getAuthHeaders();
    Promise.all([
      fetch(`${process.env.API_URL}api/admin/cursos`, { headers }).then((r) =>
        r.json(),
      ),
      fetch(`${process.env.API_URL}api/admin/estudiantes`, { headers }).then(
        (r) => r.json(),
      ),
      fetch(`${process.env.API_URL}api/admin/profesores`, { headers }).then(
        (r) => r.json(),
      ),
    ])
      .then(([c, e, p]) => {
        setCursos(Array.isArray(c) ? c : (c.data ?? []));
        setEstudiantes(Array.isArray(e) ? e : (e.data ?? []));
        setInstructores(Array.isArray(p) ? p : (p.data ?? []));
      })
      .finally(() => setLoading(false));
  }, []);

  /* Reporte data (re-fetches when periodo changes) */
  useEffect(() => {
    fetch(`${process.env.API_URL}api/admin/reportes?periodo=${periodo}`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.json())
      .then((data) => setReporte(data))
      .finally(() => setLoadingReporte(false));
  }, [periodo]);

  /* ── Derived metrics (existing) ── */

  const totalEstudiantes = estudiantes.length;
  const totalCursos = cursos.length;
  const totalInstructores = instructores.length;

  const estudiantesPorCurso = useMemo(() => {
    return cursos
      .map((c) => ({
        nombre: c.codigo,
        fullName: c.nombre,
        estudiantes: c.estudiantes?.length ?? 0,
      }))
      .sort((a, b) => b.estudiantes - a.estudiantes)
      .slice(0, 8);
  }, [cursos]);

  const estadoCursos = useMemo(() => {
    const activos = cursos.filter((c) => c.estado === "activo").length;
    const inactivos = cursos.filter((c) => c.estado === "inactivo").length;
    return [
      { name: "Activos", value: activos },
      { name: "Inactivos", value: inactivos },
    ].filter((d) => d.value > 0);
  }, [cursos]);

  const estadoEstudiantes = useMemo(() => {
    const counts: Record<string, number> = {};
    estudiantes.forEach((e) => {
      const estado = e.estado || "desconocido";
      counts[estado] = (counts[estado] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [estudiantes]);

  /* ── Income chart data ── */
  const ingresosData = useMemo(() => {
    if (!reporte?.ingresos) return [];
    return reporte.ingresos.map((row) => ({
      label: fmtLabel(row.label, periodo),
      total: row.total,
      cantidad: row.cantidad,
    }));
  }, [reporte, periodo]);

  /* ── Payments by course chart data ── */
  const pagosCursoData = useMemo(() => {
    if (!reporte?.pagos_por_curso) return [];
    return reporte.pagos_por_curso.slice(0, 8).map((c) => ({
      nombre: c.codigo,
      fullName: c.nombre,
      ingreso: c.total_ingreso,
      pagos: c.total_pagos,
    }));
  }, [reporte]);

  const barConfig = {
    estudiantes: { label: "Estudiantes", color: "var(--color-chart-1)" },
  } satisfies ChartConfig;

  const ingresosConfig = {
    total: { label: "Ingresos", color: "var(--color-chart-2)" },
  } satisfies ChartConfig;

  const cursosIngresoConfig = {
    ingreso: { label: "Ingreso", color: "var(--color-chart-3)" },
  } satisfies ChartConfig;

  const PIE_COLORS_STATUS = ["oklch(0.52 0.14 8)", "oklch(0.90 0.06 8)"];
  const PIE_COLORS_ESTADO = [
    "oklch(0.52 0.14 8)",
    "oklch(0.46 0.07 350)",
    "oklch(0.54 0.09 350)",
    "oklch(0.38 0.022 8)",
  ];
  const resumen = reporte?.resumen;

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-10 py-10 max-w-8xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="size-6 md:size-10 text-primary/70" />
            <span className="font-sans text-xs md:text-sm tracking-[0.22em] uppercase text-primary/70 font-semibold">
              Analítica / Reportes
            </span>
          </div>
          <h1 className="font-serif font-light text-[3.2rem] tight-tracking leading-[1.08] text-on-surface mb-2">
            Reportes
          </h1>
          <p className="font-sans text-sm text-muted-foreground max-w-md">
            Métricas y estadísticas generales de la plataforma.
          </p>
        </div>

        {/* ── General Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-10">
          <StatCard
            label="Estudiantes"
            value={loading ? "—" : totalEstudiantes}
            icon={Users}
            containerClass="bg-primary-container"
            iconClass="text-on-primary-container"
          />
          <StatCard
            label="Cursos"
            value={loading ? "—" : totalCursos}
            icon={BookOpen}
            containerClass="bg-secondary-container"
            iconClass="text-on-secondary-container"
          />
          <StatCard
            label="Instructores"
            value={loading ? "—" : totalInstructores}
            icon={GraduationCap}
            containerClass="bg-primary-container/70"
            iconClass="text-on-primary-container"
          />
        </div>

        {/* ── Income Section ── */}
        <div className="mb-3 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-serif font-light text-2xl tight-tracking text-on-surface">
              Ingresos
            </h2>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              Pagos aprobados acumulados según el período seleccionado
            </p>
          </div>
          {/* Period tabs */}
          <div className="flex items-center gap-1 bg-surface-container-low rounded-sm p-1 ambient-shadow">
            {PERIODOS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setLoadingReporte(true);
                  setPeriodo(p.key);
                }}
                className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-[3px] transition-colors ${
                  periodo === p.key
                    ? "bg-primary dark:bg-primary-container text-white "
                    : "text-muted-foreground hover:text-on-surface"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Income stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-container-low rounded-sm p-5 ambient-shadow">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/15 mb-4"
            >
              <span className="text-emerald-700 dark:text-emerald-400 font-sans text-sm font-semibold">
                Bs.
              </span>
            </div>
            <p className="font-sans text-3xl font-light tight-tracking text-on-surface tabular-nums mb-1">
              {resumen ? fmt(resumen.total_ingresos) : "—"}
            </p>
            <p className="font-sans text-xs tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
              Total ingresos
            </p>
          </div>
          <StatCard
            label="Pagos aprobados"
            value={resumen?.aprobados ?? "—"}
            icon={CheckCircle}
            containerClass="bg-emerald-100 dark:bg-emerald-500/15"
            iconClass="text-emerald-700 dark:text-emerald-400"
          />
          <StatCard
            label="Pagos pendientes"
            value={resumen?.pendientes ?? "—"}
            icon={Clock}
            containerClass="bg-amber-100 dark:bg-amber-500/15"
            iconClass="text-amber-700 dark:text-amber-400"
          />
          <StatCard
            label="Pagos rechazados"
            value={resumen?.rechazados ?? "—"}
            icon={XCircle}
            containerClass="bg-rose-100 dark:bg-rose-500/15"
            iconClass="text-rose-700 dark:text-rose-400"
          />
        </div>

        {/* Income bar chart */}
        <div className="mb-10">
          <ChartCard
            title={`Ingresos ${periodo === "semanal" ? "semanales" : periodo === "mensual" ? "mensuales" : "anuales"}`}
            description="Suma de pagos aprobados en el período"
          >
            {loadingReporte ? (
              <div className="h-[260px] flex items-center justify-center font-sans text-sm text-muted-foreground">
                Cargando...
              </div>
            ) : ingresosData.length === 0 ? (
              <p className="font-sans text-sm text-muted-foreground text-center py-10">
                Sin datos de ingresos en este período
              </p>
            ) : (
              <ChartContainer
                config={ingresosConfig}
                className="h-[260px] w-full"
              >
                <BarChart
                  data={ingresosData}
                  margin={{ top: 4, right: 8, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="oklch(0.45 0.10 8 / 0.12)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontFamily: "var(--font-sans)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `Bs.S ${v}`}
                    tick={{ fontFamily: "var(--font-sans)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, props) => (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-on-surface">
                              {props.payload?.label as string}
                            </span>
                            <span className="text-emerald-600 font-semibold">
                              {fmt(Number(value))}
                            </span>
                            <span className="text-muted-foreground text-xs">
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
                    fill="var(--color-chart-2)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </ChartCard>
        </div>

        {loading || loadingReporte ? (
          <div className="flex items-center justify-center py-24 font-sans text-sm text-muted-foreground">
            Cargando datos...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar: Students per course */}
            <ChartCard
              title="Estudiantes por curso"
              description="Distribución de alumnos matriculados en cada curso"
            >
              {estudiantesPorCurso.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground text-center py-10">
                  Sin datos
                </p>
              ) : (
                <ChartContainer config={barConfig} className="h-[260px] w-full">
                  <BarChart
                    data={estudiantesPorCurso}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="oklch(0.45 0.10 8 / 0.12)"
                    />
                    <XAxis
                      dataKey="nombre"
                      tick={{ fontFamily: "var(--font-sans)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontFamily: "var(--font-sans)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, props) => (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-on-surface">
                                {props.payload?.fullName as string}
                              </span>
                              <span className="text-muted-foreground">
                                {value} estudiante
                                {Number(value) !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="estudiantes"
                      fill="var(--color-chart-1)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </ChartCard>

            {/* Bar: Income per course */}
            <ChartCard
              title="Ingresos por curso"
              description="Total recaudado por pagos aprobados en cada curso"
            >
              {pagosCursoData.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground text-center py-10">
                  Sin datos
                </p>
              ) : (
                <ChartContainer
                  config={cursosIngresoConfig}
                  className="h-[260px] w-full"
                >
                  <BarChart
                    data={pagosCursoData}
                    margin={{ top: 4, right: 8, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="oklch(0.45 0.10 8 / 0.12)"
                    />
                    <XAxis
                      dataKey="nombre"
                      tick={{ fontFamily: "var(--font-sans)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `Bs.S ${v}`}
                      tick={{ fontFamily: "var(--font-sans)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, props) => (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-on-surface">
                                {props.payload?.fullName as string}
                              </span>
                              <span className="text-emerald-600 font-semibold">
                                {fmt(Number(value))}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {String(props.payload?.pagos ?? "")} pago
                                {Number(props.payload?.pagos) !== 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="ingreso"
                      fill="var(--color-chart-3)"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </ChartCard>

            {/* Pie: Course status */}
            <ChartCard
              title="Estado de cursos"
              description="Proporción de cursos activos e inactivos"
            >
              {estadoCursos.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground text-center py-10">
                  Sin datos
                </p>
              ) : (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadoCursos}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        labelLine={false}
                        label={PieLabel as never}
                      >
                        {estadoCursos.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              PIE_COLORS_STATUS[i % PIE_COLORS_STATUS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value ?? 0, name]}
                        contentStyle={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "none",
                          boxShadow: "0 4px 16px oklch(0.15 0.012 8 / 0.12)",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            {/* Pie: Student status */}
            <ChartCard
              title="Estado de estudiantes"
              description="Distribución de estudiantes por su estado actual"
            >
              {estadoEstudiantes.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground text-center py-10">
                  Sin datos
                </p>
              ) : (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadoEstudiantes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        labelLine={false}
                        label={PieLabel as never}
                      >
                        {estadoEstudiantes.map((_, i) => (
                          <Cell
                            key={i}
                            fill={
                              PIE_COLORS_ESTADO[i % PIE_COLORS_ESTADO.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value ?? 0, name]}
                        contentStyle={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 12,
                          borderRadius: 4,
                          border: "none",
                          boxShadow: "0 4px 16px oklch(0.15 0.012 8 / 0.12)",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>
        )}

        {/* ── Payments by course table ── */}
        {reporte && (reporte.pagos_por_curso?.length ?? 0) > 0 && (
          <div className="mt-6">
            <ChartCard
              title="Pagos por curso"
              description="Detalle de recaudación y estado de pagos en cada curso"
            >
              <div className="overflow-x-auto">
                <table className="w-full font-sans text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/40">
                      <th className="text-left py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Curso
                      </th>
                      <th className="text-right py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Precio
                      </th>
                      <th className="text-right py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Aprobados
                      </th>
                      <th className="text-right py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Pendientes
                      </th>
                      <th className="text-right py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Rechazados
                      </th>
                      <th className="text-right py-2 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Recaudado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reporte.pagos_por_curso ?? []).map((c) => (
                      <tr
                        key={c.curso_id}
                        className="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <span className="font-mono text-xs text-primary/70 mr-2">
                            {c.codigo}
                          </span>
                          <span className="text-on-surface">{c.nombre}</span>
                        </td>
                        <td className="py-3 pr-4 text-right text-muted-foreground tabular-nums">
                          {fmt(c.precio)}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          <span className="text-emerald-600 font-semibold">
                            {c.aprobados}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          <span className="text-amber-600 font-semibold">
                            {c.pendientes}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          <span className="text-rose-600 font-semibold">
                            {c.rechazados}
                          </span>
                        </td>
                        <td className="py-3 text-right tabular-nums font-semibold text-on-surface">
                          {fmt(c.total_ingreso)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan={5}
                        className="pt-3 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold"
                      >
                        Total
                      </td>
                      <td className="pt-3 text-right font-bold text-on-surface tabular-nums">
                        {fmt(
                          (reporte.pagos_por_curso ?? []).reduce(
                            (s, c) => s + c.total_ingreso,
                            0,
                          ),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {/* ── Payments by user table ── */}
        {reporte && (reporte.pagos_por_usuario?.length ?? 0) > 0 && (
          <div className="mt-6">
            <ChartCard
              title="Pagos por usuario"
              description="Historial de pagos y recaudación por cada estudiante"
            >
              <div className="overflow-x-auto">
                <table className="w-full font-sans text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/40">
                      <th className="text-left py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Usuario
                      </th>
                      <th className="text-right py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Total pagos
                      </th>
                      <th className="text-right py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Aprobados
                      </th>
                      <th className="text-right py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Pendientes
                      </th>
                      <th className="text-right py-2 pr-4 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Rechazados
                      </th>
                      <th className="text-right py-2 text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                        Ingreso generado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reporte.pagos_por_usuario ?? []).map((u) => (
                      <tr
                        key={u.user_id}
                        className="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="py-3 pr-4 text-on-surface font-medium">
                          {u.nombre}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums text-muted-foreground">
                          {u.total_pagos}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          <span className="text-emerald-600 font-semibold">
                            {u.aprobados}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          <span className="text-amber-600 font-semibold">
                            {u.pendientes}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          <span className="text-rose-600 font-semibold">
                            {u.rechazados}
                          </span>
                        </td>
                        <td className="py-3 text-right tabular-nums font-semibold text-on-surface">
                          {fmt(u.total_ingreso)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 flex items-center gap-2 text-muted-foreground/50">
          <TrendingUp className="w-3 h-3" />
          <span className="font-sans text-[10px] tracking-[0.15em] uppercase">
            Datos en tiempo real
          </span>
        </div>
      </div>
    </div>
  );
}
