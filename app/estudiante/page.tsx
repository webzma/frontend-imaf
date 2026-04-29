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
  ArrowRight,
} from "lucide-react";

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: string;
  instructor?: { id: number; name: string } | null;
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
  activo: "bg-emerald-100 text-emerald-800",
  inactivo: "bg-amber-100 text-amber-800",
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

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-125 h-75 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-4 md:px-8 py-10 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <LayoutDashboardIcon />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Dashboard
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-12 w-64" />
          ) : (
            <h1 className="font-serif font-light text-[2.8rem] tight-tracking leading-[1.08] text-on-surface">
              Bienvenido, {firstName}
            </h1>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Estado */}
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-5">
            <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/50 font-medium mb-3">
              Estado
            </p>
            {loading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full font-sans text-sm font-semibold ${
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

          {/* Cédula */}
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-5">
            <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/50 font-medium mb-3">
              Cédula
            </p>
            {loading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground/60" />
                <span className="font-mono text-sm text-on-surface">
                  {perfil?.cedula ?? "—"}
                </span>
              </div>
            )}
          </div>

          {/* Inscripción */}
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-5">
            <p className="font-sans text-[10px] tracking-[0.18em] uppercase text-on-surface/50 font-medium mb-3">
              Inscripción
            </p>
            {loading ? (
              <Skeleton className="h-6 w-36" />
            ) : (
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-muted-foreground/60" />
                <span className="font-sans text-sm text-on-surface">
                  {perfil
                    ? new Date(perfil.fecha_inscripcion).toLocaleDateString(
                        "es-VE",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "—"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mi Curso */}
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden">
            <div className="h-1 gradient-primary" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary/70" />
                  <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                    Mi Curso
                  </h3>
                </div>
                <Link
                  href="/estudiante/curso"
                  className="flex items-center gap-1 font-sans text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Ver detalle <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : perfil?.curso ? (
                <div>
                  <h4 className="font-serif font-light text-2xl text-on-surface mb-1">
                    {perfil.curso.nombre}
                  </h4>
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-on-primary-container bg-primary-container px-2 py-0.5 rounded-sm">
                    <Hash className="w-2.5 h-2.5" />
                    {perfil.curso.codigo}
                  </span>
                  {perfil.curso.descripcion && (
                    <p className="font-sans text-sm text-muted-foreground mt-3 line-clamp-2">
                      {perfil.curso.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-5 pt-4 mt-4 border-t border-outline-variant/30">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span className="font-sans">
                        {perfil.curso.instructor?.name || "Sin asignar"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-container/60 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-on-primary-container" />
                  </div>
                  <p className="font-sans text-sm text-muted-foreground text-center">
                    No estás inscrito en ningún curso actualmente.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mi Perfil */}
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary/70" />
                <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                  Mi Perfil
                </h3>
              </div>
              <Link
                href="/estudiante/perfil"
                className="flex items-center gap-1 font-sans text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Editar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-44" />
              </div>
            ) : perfil ? (
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="font-sans text-xl font-bold text-on-primary-container">
                    {getInitials(perfil.nombre)}
                  </span>
                </div>
                <div>
                  <h4 className="font-serif font-light text-xl text-on-surface">
                    {perfil.nombre}
                  </h4>
                  <p className="font-sans text-sm text-muted-foreground">
                    {perfil.user.email}
                  </p>
                </div>
                <div className="w-full pt-3 border-t border-outline-variant/30 space-y-2 text-left">
                  {perfil.telefono && (
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-muted-foreground">
                        Teléfono
                      </span>
                      <span className="font-sans text-xs text-on-surface">
                        {perfil.telefono}
                      </span>
                    </div>
                  )}
                  {perfil.genero && (
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-muted-foreground">
                        Género
                      </span>
                      <span className="font-sans text-xs text-on-surface capitalize">
                        {perfil.genero}
                      </span>
                    </div>
                  )}
                  {perfil.fecha_nacimiento && (
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-muted-foreground">
                        Nacimiento
                      </span>
                      <span className="font-sans text-xs text-on-surface">
                        {new Date(perfil.fecha_nacimiento).toLocaleDateString(
                          "es-VE",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function LayoutDashboardIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary/70"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
