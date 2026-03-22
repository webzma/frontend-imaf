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
  Star,
  TrendingUp,
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
  creditos: number;
  estado: "activo" | "inactivo";
  estudiantes?: Estudiante[];
}

interface Profesor {
  id: number;
  user?: { name: string };
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
      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${containerClass} mb-4`}>
        <Icon className={`w-5 h-5 ${iconClass}`} />
      </div>
      <p className="font-sans text-4xl font-light tight-tracking text-on-surface tabular-nums mb-1">
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

function ChartCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
      <div className="mb-5">
        <h2 className="font-serif font-light text-xl tight-tracking text-on-surface">{title}</h2>
        {description && (
          <p className="font-sans text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Custom Pie Label ── */

const RADIAN = Math.PI / 180;
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      className="font-sans text-xs font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* ── Page ── */

export default function ReportesPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = getAuthHeaders();
    Promise.all([
      fetch(`${process.env.API_URL}api/admin/cursos`, { headers }).then((r) => r.json()),
      fetch(`${process.env.API_URL}api/admin/estudiantes`, { headers }).then((r) => r.json()),
      fetch(`${process.env.API_URL}api/admin/profesores`, { headers }).then((r) => r.json()),
    ])
      .then(([c, e, p]) => {
        setCursos(Array.isArray(c) ? c : []);
        setEstudiantes(Array.isArray(e) ? e : []);
        setProfesores(Array.isArray(p) ? p : []);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived metrics ── */

  const totalEstudiantes = estudiantes.length;
  const totalCursos = cursos.length;
  const totalProfesores = profesores.length;
  const avgCreditos = totalCursos
    ? (cursos.reduce((s, c) => s + c.creditos, 0) / totalCursos).toFixed(1)
    : "—";

  // Students per course (top 8 by count)
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

  // Course status distribution
  const estadoCursos = useMemo(() => {
    const activos = cursos.filter((c) => c.estado === "activo").length;
    const inactivos = cursos.filter((c) => c.estado === "inactivo").length;
    return [
      { name: "Activos", value: activos },
      { name: "Inactivos", value: inactivos },
    ].filter((d) => d.value > 0);
  }, [cursos]);

  // Student status distribution
  const estadoEstudiantes = useMemo(() => {
    const counts: Record<string, number> = {};
    estudiantes.forEach((e) => {
      const estado = e.estado || "desconocido";
      counts[estado] = (counts[estado] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [estudiantes]);

  // Credits distribution
  const creditosDistribucion = useMemo(() => {
    const counts: Record<number, number> = {};
    cursos.forEach((c) => {
      counts[c.creditos] = (counts[c.creditos] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([creditos, cursos]) => ({ creditos: `${creditos} cr.`, cursos }))
      .sort((a, b) => parseInt(a.creditos) - parseInt(b.creditos));
  }, [cursos]);

  const barConfig = {
    estudiantes: { label: "Estudiantes", color: "var(--color-chart-1)" },
  } satisfies ChartConfig;

  const creditosConfig = {
    cursos: { label: "Cursos", color: "var(--color-chart-2)" },
  } satisfies ChartConfig;

  const PIE_COLORS_STATUS = ["oklch(0.52 0.14 8)", "oklch(0.90 0.06 8)"];
  const PIE_COLORS_ESTADO = [
    "oklch(0.52 0.14 8)",
    "oklch(0.46 0.07 350)",
    "oklch(0.54 0.09 350)",
    "oklch(0.38 0.022 8)",
  ];

  return (
    <div className="relative min-h-full bg-surface">
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-10 py-10 max-w-8xl">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="size-10 text-primary/70" />
            <span className="font-sans text-sm tracking-[0.22em] uppercase text-primary/70 font-semibold">
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

        {/* Stat Cards */}
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
            label="Profesores"
            value={loading ? "—" : totalProfesores}
            icon={GraduationCap}
            containerClass="bg-primary-container/70"
            iconClass="text-on-primary-container"
          />
          <StatCard
            label="Créditos promedio"
            value={loading ? "—" : avgCreditos}
            icon={Star}
            containerClass="bg-secondary-container/70"
            iconClass="text-on-secondary-container"
            sub="por curso"
          />
        </div>

        {loading ? (
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
                <p className="font-sans text-sm text-muted-foreground text-center py-10">Sin datos</p>
              ) : (
                <ChartContainer config={barConfig} className="h-[260px] w-full">
                  <BarChart data={estudiantesPorCurso} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.45 0.10 8 / 0.12)" />
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
                          formatter={(value, name, props) => (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-on-surface">{props.payload.fullName}</span>
                              <span className="text-muted-foreground">{value} estudiante{Number(value) !== 1 ? "s" : ""}</span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Bar dataKey="estudiantes" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
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
                <p className="font-sans text-sm text-muted-foreground text-center py-10">Sin datos</p>
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
                          <Cell key={i} fill={PIE_COLORS_STATUS[i % PIE_COLORS_STATUS.length]} />
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
                        wrapperStyle={{ fontFamily: "var(--font-sans)", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            {/* Bar: Credits distribution */}
            <ChartCard
              title="Distribución de créditos"
              description="Cantidad de cursos según sus créditos asignados"
            >
              {creditosDistribucion.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground text-center py-10">Sin datos</p>
              ) : (
                <ChartContainer config={creditosConfig} className="h-[260px] w-full">
                  <BarChart data={creditosDistribucion} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.45 0.10 8 / 0.12)" />
                    <XAxis
                      dataKey="creditos"
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
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="cursos" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </ChartCard>

            {/* Pie: Student status */}
            <ChartCard
              title="Estado de estudiantes"
              description="Distribución de estudiantes por su estado actual"
            >
              {estadoEstudiantes.length === 0 ? (
                <p className="font-sans text-sm text-muted-foreground text-center py-10">Sin datos</p>
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
                          <Cell key={i} fill={PIE_COLORS_ESTADO[i % PIE_COLORS_ESTADO.length]} />
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
                        wrapperStyle={{ fontFamily: "var(--font-sans)", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

          </div>
        )}

        {/* Footer note */}
        {!loading && (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground/50">
            <TrendingUp className="w-3 h-3" />
            <span className="font-sans text-[10px] tracking-[0.15em] uppercase">
              Datos en tiempo real
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
