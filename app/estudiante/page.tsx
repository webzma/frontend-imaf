"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  User,
  Hash,
  GraduationCap,
  CalendarDays,
  ArrowUpRight,
  Sparkles,
  Mail,
  Phone,
  LayoutDashboard,
} from "lucide-react";

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: string;
  instructor?: {
    id: number;
    user?: { name: string } | null;
  } | null;
}

interface EstudiantePerfil {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  fecha_inscripcion: string;
  estado: string;
  user: { id: number; name: string; email: string };
  curso: Curso | null;
}

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

const estadoStyle: Record<string, string> = {
  activo:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  inactivo:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  graduado: "bg-primary-container text-on-primary-container",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const ymd = value.slice(0, 10);
  return new Date(ymd + "T00:00:00").toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function EstudianteDashboard() {
  const [perfil, setPerfil] = useState<EstudiantePerfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.API_URL}api/estudiante/perfil`, {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
        Accept: "application/json",
      },
    })
      .then((r) => r.json())
      .then(setPerfil)
      .catch(() => toast.error("Error al cargar el perfil"))
      .finally(() => setLoading(false));
  }, []);

  const firstName = perfil?.nombre.split(" ")[0] ?? "";
  const today = new Date().toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[520px] h-[320px] rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[380px] h-[260px] rounded-full bg-secondary-container/40 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-8 py-10 md:py-14 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <LayoutDashboard className="size-6 text-primary/80" />
            <span className="font-sans text-[11px] tracking-[0.24em] uppercase text-primary/80 font-semibold">
              Dashboard · {today}
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-14 w-72" />
          ) : (
            <>
              <h1 className="font-serif font-light text-[2.6rem] md:text-[3.2rem] tight-tracking leading-[1.05] text-on-surface mb-2">
                {getGreeting()}, {firstName}
              </h1>
              <p className="font-sans text-sm md:text-base text-muted-foreground max-w-lg">
                Bienvenido a tu espacio académico. Aquí encontrarás el resumen
                de tu actividad y tu curso actual.
              </p>
            </>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-10">
          {/* Estado */}
          <div className="relative bg-surface-container-low rounded-sm p-5 ambient-shadow overflow-hidden group">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors pointer-events-none" />
            <div className="relative">
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-primary-container/80 mb-3">
                <Sparkles className="w-4 h-4 text-on-primary-container" />
              </div>
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/60 font-semibold mb-2">
                Estado
              </p>
              {loading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full font-sans text-xs font-semibold ${
                    estadoStyle[perfil?.estado ?? ""] ??
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {perfil
                    ? perfil.estado.charAt(0).toUpperCase() +
                      perfil.estado.slice(1)
                    : "—"}
                </span>
              )}
            </div>
          </div>

          {/* Cédula */}
          <div className="relative bg-surface-container-low rounded-sm p-5 ambient-shadow overflow-hidden group">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors pointer-events-none" />
            <div className="relative">
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-primary-container/80 mb-3">
                <Hash className="w-4 h-4 text-on-primary-container" />
              </div>
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/60 font-semibold mb-2">
                Cédula
              </p>
              {loading ? (
                <Skeleton className="h-6 w-28" />
              ) : (
                <p className="font-mono text-base text-on-surface tabular-nums">
                  {perfil?.cedula ?? "—"}
                </p>
              )}
            </div>
          </div>

          {/* Inscripción */}
          <div className="relative bg-surface-container-low rounded-sm p-5 ambient-shadow overflow-hidden group">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary/[0.04] group-hover:bg-primary/[0.08] transition-colors pointer-events-none" />
            <div className="relative">
              <div className="w-9 h-9 rounded-md flex items-center justify-center bg-primary-container/80 mb-3">
                <CalendarDays className="w-4 h-4 text-on-primary-container" />
              </div>
              <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/60 font-semibold mb-2">
                Inscripción
              </p>
              {loading ? (
                <Skeleton className="h-6 w-36" />
              ) : (
                <p className="font-sans text-sm text-on-surface font-medium">
                  {perfil ? formatDate(perfil.fecha_inscripcion) : "—"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Mi Curso (featured) */}
          <Link
            href="/estudiante/curso"
            className="lg:col-span-3 group relative block bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="absolute inset-0 gradient-primary opacity-[0.04] group-hover:opacity-[0.08] transition-opacity" />
            <div className="absolute top-0 left-0 right-0 h-[2px] gradient-primary" />
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

            <div className="relative p-6 md:p-7 h-full flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary/80" />
                  <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                    Mi Curso
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-primary group-hover:gap-1.5 transition-all">
                  Ver detalle
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-9 w-3/4" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : perfil?.curso ? (
                <div className="flex-1 flex flex-col">
                  <h4 className="font-serif font-light text-3xl md:text-4xl tight-tracking text-on-surface mb-3 leading-[1.05]">
                    {perfil.curso.nombre}
                  </h4>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-on-primary-container bg-primary-container/70 px-2 py-1 rounded-sm">
                      <Hash className="w-2.5 h-2.5" />
                      {perfil.curso.codigo}
                    </span>
                  </div>
                  {perfil.curso.descripcion && (
                    <p className="font-sans text-sm text-muted-foreground line-clamp-2 mb-5">
                      {perfil.curso.descripcion}
                    </p>
                  )}
                  <div className="mt-auto pt-4 border-t border-outline-variant/30 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5 text-primary/70" />
                    <span className="font-sans text-xs text-muted-foreground">
                      Impartido por{" "}
                      <span className="text-on-surface/80 font-medium">
                        {perfil.curso.instructor?.user?.name || "Sin asignar"}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary-container/60 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-on-primary-container" />
                  </div>
                  <div className="text-center max-w-xs">
                    <p className="font-serif font-light text-xl text-on-surface mb-1">
                      Sin curso asignado
                    </p>
                    <p className="font-sans text-sm text-muted-foreground">
                      No estás inscrito en ningún curso actualmente.
                    </p>
                  </div>
                  <Link
                    href="/estudiante/cursos"
                    className="font-sans text-xs font-medium text-primary hover:underline underline-offset-4 mt-1"
                  >
                    Explorar catálogo →
                  </Link>
                </div>
              )}
            </div>
          </Link>

          {/* Mi Perfil */}
          <Link
            href="/estudiante/perfil"
            className="lg:col-span-2 group bg-surface-container-lowest rounded-sm ambient-shadow p-6 hover:-translate-y-0.5 transition-all duration-300 block"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary/80" />
                <h3 className="font-sans text-[11px] tracking-[0.22em] uppercase text-primary/80 font-semibold">
                  Mi Perfil
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-primary group-hover:gap-1.5 transition-all">
                Editar
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-44" />
              </div>
            ) : perfil ? (
              <div className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full gradient-primary opacity-30 blur-md" />
                  <div className="relative w-16 h-16 rounded-full bg-primary-container flex items-center justify-center ring-2 ring-primary/10">
                    <span className="font-sans text-xl font-bold text-on-primary-container">
                      {getInitials(perfil.nombre)}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-serif font-light text-xl text-on-surface tight-tracking">
                    {perfil.nombre}
                  </h4>
                  <p className="font-sans text-xs text-muted-foreground break-all">
                    {perfil.user.email}
                  </p>
                </div>
                <div className="w-full pt-4 border-t border-outline-variant/30 space-y-2.5 text-left">
                  {perfil.telefono && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        Teléfono
                      </span>
                      <span className="font-sans text-xs text-on-surface tabular-nums">
                        {perfil.telefono}
                      </span>
                    </div>
                  )}
                  {perfil.genero && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold">
                        Género
                      </span>
                      <span className="font-sans text-xs text-on-surface capitalize">
                        {perfil.genero}
                      </span>
                    </div>
                  )}
                  {perfil.fecha_nacimiento && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold">
                        Nacimiento
                      </span>
                      <span className="font-sans text-xs text-on-surface">
                        {formatDate(perfil.fecha_nacimiento)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70 font-semibold flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      Usuario
                    </span>
                    <span className="font-sans text-xs text-on-surface truncate max-w-[140px]">
                      {perfil.user.name}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </Link>
        </div>

        {/* Quick links */}
        {!loading && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/estudiante/cursos"
              className="group flex items-center justify-between gap-3 bg-surface-container-low rounded-sm px-5 py-4 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-on-primary-container" />
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-on-surface">
                    Catálogo de cursos
                  </p>
                  <p className="font-sans text-xs text-muted-foreground">
                    Explora todos los cursos disponibles
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-primary/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/estudiante/notificaciones"
              className="group flex items-center justify-between gap-3 bg-surface-container-low rounded-sm px-5 py-4 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary-container/70 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-on-primary-container" />
                </div>
                <div>
                  <p className="font-sans text-sm font-semibold text-on-surface">
                    Centro de notificaciones
                  </p>
                  <p className="font-sans text-xs text-muted-foreground">
                    Revisa tus avisos recientes
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-primary/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
