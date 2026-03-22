"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Hash,
  Star,
  Users,
  CheckCircle2,
  XCircle,
  Info,
  Mail,
} from "lucide-react";

/* ── Types ── */

interface Profesor {
  id: number;
  cedula: string | null;
  telefono: string | null;
  especialidad: string | null;
  titulo: string | null;
  departamento: string | null;
  user: { id: number; name: string; email: string };
}

interface Estudiante {
  id: number;
  nombre: string;
  cedula: string;
  estado: "activo" | "inactivo" | "graduado";
  user: { name: string; email: string };
}

interface CursoDetalle {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  creditos: number;
  estado: "activo" | "inactivo";
  profesor: Profesor | null;
  estudiantes: Estudiante[];
}

/* ── Helpers ── */

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const estadoStyle: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-800",
  inactivo: "bg-amber-100 text-amber-800",
  graduado: "bg-primary-container text-on-primary-container",
};

/* ── Page ── */

export default function CursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [curso, setCurso] = useState<CursoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [miCursoId, setMiCursoId] = useState<number | null>(null);

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${getCookie("token")}`,
      Accept: "application/json",
    };

    Promise.all([
      fetch(`${process.env.API_URL}api/estudiante/cursos/${id}`, { headers }).then((r) => {
        if (!r.ok) throw new Error("No encontrado");
        return r.json();
      }),
      fetch(`${process.env.API_URL}api/estudiante/perfil`, { headers }).then((r) => r.json()),
    ])
      .then(([cursoData, perfil]) => {
        setCurso(cursoData);
        setMiCursoId(perfil?.curso?.id ?? null);
      })
      .catch(() => toast.error("Error al cargar el curso"))
      .finally(() => setLoading(false));
  }, [id]);

  const esMiCurso = curso?.id === miCursoId;

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-8 py-10 max-w-5xl mx-auto">

        {/* Back */}
        <Link
          href="/estudiante/cursos"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-on-surface transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : curso ? (
          <div className="space-y-6">

            {/* Header card */}
            <div className="bg-surface-container-lowest rounded-sm ambient-shadow overflow-hidden">
              <div className="h-1 gradient-primary" />
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-on-primary-container bg-primary-container px-3 py-1 rounded-sm">
                        <Hash className="w-3 h-3" />{curso.codigo}
                      </span>
                      {esMiCurso && (
                        <span className="inline-flex items-center gap-1 font-sans text-xs font-bold text-white bg-primary px-2.5 py-1 rounded-full uppercase tracking-wide">
                          Mi curso
                        </span>
                      )}
                    </div>
                    <h1 className="font-serif font-light text-4xl tight-tracking text-on-surface leading-tight">
                      {curso.nombre}
                    </h1>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-sm font-semibold shrink-0 ${
                    curso.estado === "activo"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {curso.estado === "activo"
                      ? <><CheckCircle2 className="w-3.5 h-3.5" /> Activo</>
                      : <><XCircle className="w-3.5 h-3.5" /> Inactivo</>}
                  </span>
                </div>

                {curso.descripcion && (
                  <p className="font-sans text-base text-muted-foreground leading-relaxed mb-6">
                    {curso.descripcion}
                  </p>
                )}

                <div className="flex items-center gap-8 pt-6 border-t border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-muted-foreground/60" />
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">Créditos</p>
                      <p className="font-sans text-sm font-semibold text-on-surface">{curso.creditos}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground/60" />
                    <div>
                      <p className="font-sans text-xs text-muted-foreground">Estudiantes</p>
                      <p className="font-sans text-sm font-semibold text-on-surface">{curso.estudiantes.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Profesor */}
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center gap-2 mb-5">
                  <GraduationCap className="w-4 h-4 text-primary/70" />
                  <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                    Profesor
                  </h3>
                </div>
                {curso.profesor ? (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                      <span className="font-sans text-base font-bold text-on-primary-container">
                        {getInitials(curso.profesor.user.name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-light text-xl text-on-surface">
                        {curso.profesor.user.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Mail className="w-3 h-3 text-muted-foreground/60" />
                        <p className="font-sans text-sm text-muted-foreground truncate">
                          {curso.profesor.user.email}
                        </p>
                      </div>
                      {curso.profesor.especialidad && (
                        <p className="font-sans text-xs text-primary/70 mt-2 font-medium">
                          {curso.profesor.especialidad}
                        </p>
                      )}
                      {curso.profesor.titulo && (
                        <p className="font-sans text-xs text-muted-foreground mt-1 capitalize">
                          {curso.profesor.titulo}
                        </p>
                      )}
                      {curso.profesor.departamento && (
                        <p className="font-sans text-xs text-muted-foreground mt-1">
                          Depto. {curso.profesor.departamento}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary-container/60 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-on-primary-container" />
                    </div>
                    <p className="font-sans text-sm text-muted-foreground">Sin profesor asignado</p>
                  </div>
                )}
              </div>

              {/* Estudiantes */}
              <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary/70" />
                    <h3 className="font-sans text-xs tracking-[0.18em] uppercase text-on-surface/55 font-semibold">
                      Estudiantes
                    </h3>
                  </div>
                  <span className="font-sans text-xs text-muted-foreground bg-surface-container px-2 py-0.5 rounded-full">
                    {curso.estudiantes.length}
                  </span>
                </div>

                {curso.estudiantes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary-container/60 flex items-center justify-center">
                      <Users className="w-4 h-4 text-on-primary-container" />
                    </div>
                    <p className="font-sans text-sm text-muted-foreground">Sin estudiantes matriculados</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {curso.estudiantes.map((est) => (
                      <div
                        key={est.id}
                        className="flex items-center gap-3 py-2 border-b border-outline-variant/20 last:border-0"
                      >
                        <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                          <span className="font-sans text-[10px] font-bold text-on-secondary-container">
                            {getInitials(est.nombre)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm text-on-surface truncate">{est.nombre}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full font-sans text-[10px] font-semibold shrink-0 ${estadoStyle[est.estado] ?? "bg-muted text-muted-foreground"}`}>
                          {est.estado.charAt(0).toUpperCase() + est.estado.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-3 bg-secondary-container/40 rounded-sm px-4 py-3 border border-outline-variant/20">
              <Info className="w-4 h-4 text-on-surface/50 shrink-0 mt-0.5" />
              <p className="font-sans text-sm text-muted-foreground">
                Para inscribirte en un curso o solicitar cambios, comunícate con la administración.
              </p>
            </div>

          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-sm ambient-shadow p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container/60 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-on-primary-container" />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-light text-2xl text-on-surface mb-2">
                  Curso no encontrado
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  El curso que buscas no existe o no está disponible.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
