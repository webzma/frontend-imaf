"use client";

import { PageHeader } from "@/components/page-header";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  ArrowUpRight,
  Plus,
  AlertTriangle,
} from "lucide-react";

interface StatCard {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  href: string;
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    estudiantes: 0,
    profesores: 0,
    cursos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = getCookie("token");
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    Promise.all([
      fetch(`${process.env.API_URL}api/admin/estudiantes`, { headers }).then(
        (r) => r.json(),
      ),
      fetch(`${process.env.API_URL}api/admin/profesores`, { headers }).then(
        (r) => r.json(),
      ),
      fetch(`${process.env.API_URL}api/admin/cursos`, { headers }).then((r) =>
        r.json(),
      ),
    ])
      .then(([est, prof, cur]) => {
        const estList = Array.isArray(est) ? est : (est.data ?? []);
        const profList = Array.isArray(prof) ? prof : (prof.data ?? []);
        const curList = Array.isArray(cur) ? cur : (cur.data ?? []);
        setCounts({
          estudiantes: estList.length,
          profesores: profList.length,
          cursos: curList.length,
        });
      })
      // Un fallo de red mostraba 0/0/0 como si fuera un dato real.
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const stats: StatCard[] = [
    {
      label: "Estudiantes",
      value: counts.estudiantes,
      sub: "registrados en el sistema",
      icon: Users,
      color: "text-on-primary-container",
      glow: "bg-primary-container",
      href: "/admin/estudiantes",
    },
    {
      label: "Instructores",
      value: counts.profesores,
      sub: "activos en la plataforma",
      icon: GraduationCap,
      color: "text-on-secondary-container",
      glow: "bg-secondary-container",
      href: "/admin/instructores",
    },
    {
      label: "Cursos",
      value: counts.cursos,
      sub: "disponibles actualmente",
      icon: BookOpen,
      color: "text-on-info-container",
      glow: "bg-info-container",
      href: "/admin/cursos",
    },
  ];

  return (
    <div className="min-h-full bg-surface">
      {/* mx-auto: sin él, en monitor ancho todo quedaba pegado al borde. */}
      <div className="mx-auto max-w-8xl px-4 md:px-10 py-10">
        <PageHeader
          icon={TrendingUp}
          eyebrow="Resumen general"
          title="Bienvenido al Panel"
          subtitle="Aquí tienes un resumen del estado actual de la plataforma."
        />

        {error && (
          <div
            role="alert"
            className="mb-8 flex items-start gap-3 rounded-lg bg-danger-container px-4 py-3 text-on-danger-container"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="font-sans text-sm">
              No se pudieron cargar los datos. Revisa tu conexión y vuelve a
              cargar la página.
            </p>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
          {stats.map((s) => (
            // El anillo de foco vive en el <Link>: antes estaba en un div
            // interior, así que las tres tarjetas no tenían foco visible.
            <Link
              key={s.label}
              href={s.href}
              className="group rounded-lg bg-surface-container-low p-6 ambient-shadow transition-[background-color,box-shadow,transform] duration-200 hover:bg-surface-container hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className={`w-10 h-10 rounded-md flex items-center justify-center ${s.glow}`}
                >
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                {/* size-4, no size-10: la flecha competía con el icono principal. */}
                <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              {loading ? (
                <Skeleton className="h-12 w-20 mb-1" />
              ) : (
                <p className="font-sans text-5xl font-light tight-tracking text-on-surface tabular-nums mb-1">
                  {s.value}
                </p>
              )}
              <p className="font-sans text-xs tracking-[0.15em] uppercase text-on-surface font-medium mt-2">
                {s.label}
              </p>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
                {s.sub}
              </p>
            </Link>
          ))}
        </div>

        {/* ── Acceso rápido ── */}
        <div>
          <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-medium mb-4">
            Acceso rápido
          </p>
          {/* Eran tres botones primarios rosa compitiendo entre sí. Ahora hay
              una sola acción primaria y el resto son secundarias. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button asChild className="gap-2 w-full h-11">
              <Link href="/admin/estudiantes">
                <Plus className="w-4 h-4" />
                Registrar estudiante
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 w-full h-11">
              <Link href="/admin/instructores">
                <Plus className="w-4 h-4" />
                Registrar instructor
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 w-full h-11">
              <Link href="/admin/cursos">
                <Plus className="w-4 h-4" />
                Crear curso
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
