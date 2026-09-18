"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  CreditCard,
  GraduationCap,
  Layers,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { StatRow, type Stat } from "@/components/stat-row";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api-client";
import { adminKeys } from "@/lib/query-keys";
import { formatCurrency } from "@/lib/format";

interface Dashboard {
  estudiantes: {
    total: number;
    activos: number;
    inactivos: number;
    graduados: number;
  };
  pagos: {
    total: number;
    pendientes: number;
    aprobados: number;
    rechazados: number;
  };
  cursos: { total: number; activos: number; con_cupo: number };
  profesores: { total: number };
  ingresos_por_curso: {
    id: number;
    nombre: string;
    precio: number;
    estudiantes: number;
    cupos_restantes: number;
  }[];
}

export default function AdminDashboard() {
  /**
   * Un solo endpoint de agregados.
   *
   * Antes esta pantalla pedía tres listas paginadas y contaba la longitud del
   * arreglo recibido, que son diez registros: con trescientos estudiantes en
   * la base, la tarjeta decía "10". `/api/admin/dashboard` ya existía y
   * devuelve los totales reales; simplemente no lo llamaba nadie.
   */
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => apiFetch<Dashboard>("api/admin/dashboard"),
  });

  const stats: Stat[] = [
    {
      label: "Estudiantes",
      value: data?.estudiantes.total ?? 0,
      sub: `${data?.estudiantes.activos ?? 0} activos · ${data?.estudiantes.graduados ?? 0} graduados`,
      icon: Users,
      tone: "primary",
      href: "/admin/estudiantes",
    },
    {
      label: "Instructores",
      value: data?.profesores.total ?? 0,
      sub: "activos en la plataforma",
      icon: GraduationCap,
      tone: "secondary",
      href: "/admin/instructores",
    },
    {
      label: "Cursos",
      value: data?.cursos.total ?? 0,
      sub: `${data?.cursos.activos ?? 0} activos · ${data?.cursos.con_cupo ?? 0} con cupo`,
      icon: BookOpen,
      tone: "info",
      href: "/admin/cursos",
    },
    {
      label: "Pagos",
      value: data?.pagos.total ?? 0,
      sub: `${data?.pagos.aprobados ?? 0} aprobados`,
      icon: CreditCard,
      tone: "success",
      href: "/admin/pagos",
    },
  ];

  const pendientes = data?.pagos.pendientes ?? 0;

  return (
    <PageShell>
      <PageHeader
        icon={TrendingUp}
        eyebrow="Resumen general"
        title="Bienvenido al panel de administrador"
        subtitle="Aquí tienes un resumen del estado actual de la plataforma."
      />

      {error && (
        <ErrorState
          error={error}
          onRetry={refetch}
          fallback="No se pudieron cargar los totales de la plataforma."
          className="mb-8"
        />
      )}

      <StatRow
        stats={stats}
        loading={isLoading}
        columns={4}
        className="mb-10"
      />

      {/* Lo que espera a alguien: se muestra solo cuando hay trabajo pendiente,
          para que su presencia signifique algo. */}
      {pendientes > 0 && (
        <Link
          href="/admin/pagos?estado=pendiente"
          className="mb-10 flex items-center gap-4 rounded-lg bg-warning-container px-5 py-4 text-on-warning-container transition-colors hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <Clock aria-hidden="true" className="size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm font-semibold">
              {pendientes} {pendientes === 1 ? "pago espera" : "pagos esperan"}{" "}
              revisión
            </p>
            <p className="font-sans text-xs opacity-90">
              Hasta que se aprueben, esas personas no pueden entrar a su curso.
            </p>
          </div>
          <span className="shrink-0 font-sans text-xs font-semibold underline underline-offset-2">
            Revisar
          </span>
        </Link>
      )}

      {/* ── Acceso rápido ── */}
      <section className="mb-10">
        <h2 className="mb-4 font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
          Acceso rápido
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button asChild className="h-11 w-full gap-2">
            <Link href="/admin/estudiantes?nuevo=1">
              <Plus className="size-4" />
              Registrar estudiante
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full gap-2">
            <Link href="/admin/instructores?nuevo=1">
              <Plus className="size-4" />
              Registrar instructor
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 w-full gap-2">
            <Link href="/admin/cursos?nuevo=1">
              <Plus className="size-4" />
              Crear curso
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Ocupación de cursos ── */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-muted-foreground">
            Ocupación de cursos activos
          </h2>
          <Button asChild variant="link" className="text-xs">
            <Link href="/admin/catalogos">
              <Layers className="mr-1.5 size-3.5" />
              Catálogos
            </Link>
          </Button>
        </div>

        <div className="overflow-hidden rounded-lg bg-surface-container-low ambient-shadow">
          {isLoading ? (
            <div className="divide-y divide-outline-variant">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="ml-auto h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (data?.ingresos_por_curso.length ?? 0) === 0 ? (
            <p className="px-5 py-8 text-center font-sans text-sm text-muted-foreground">
              No hay cursos activos todavía.
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {data?.ingresos_por_curso.map((curso) => {
                const cupo = curso.estudiantes + curso.cupos_restantes;
                const ocupacion =
                  cupo > 0 ? (curso.estudiantes / cupo) * 100 : 0;

                return (
                  <li key={curso.id}>
                    <Link
                      href={`/admin/cursos/${curso.id}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-sm font-medium text-on-surface">
                          {curso.nombre}
                        </p>
                        <p className="font-sans text-xs text-muted-foreground">
                          {curso.precio > 0
                            ? formatCurrency(Number(curso.precio))
                            : "Gratuito"}
                        </p>
                      </div>

                      {/* La barra es refuerzo; el dato exacto va en texto al
                          lado, que es lo que se lee y lo que se anuncia. */}
                      <div
                        aria-hidden="true"
                        className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-surface-container-high sm:block"
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, ocupacion)}%` }}
                        />
                      </div>

                      <p className="shrink-0 font-sans text-xs tabular-nums text-muted-foreground">
                        {curso.estudiantes}/{cupo}
                      </p>

                      {curso.cupos_restantes === 0 && (
                        <Badge variant="neutral" className="shrink-0">
                          Lleno
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </PageShell>
  );
}
