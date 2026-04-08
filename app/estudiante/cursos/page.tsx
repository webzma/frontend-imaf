"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  GraduationCap,
  Hash,
  Star,
  Search,
  Filter,
  Users,
} from "lucide-react";

/* ── Types ── */

interface Curso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  estado: "activo" | "inactivo";
  profesor?: { id: number; name: string } | null;
  estudiantes?: { id: number }[];
}

/* ── Helpers ── */

function getCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : "";
}

/* ── Card ── */

function CursoCard({
  curso,
  miCursoId,
}: {
  curso: Curso;
  miCursoId: number | null;
}) {
  const esMiCurso = miCursoId === curso.id;
  return (
    <div
      className={`group relative bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 flex flex-col ${esMiCurso ? "ring-2 ring-primary/40" : ""}`}
    >
      <div className="h-1 gradient-primary" />
      {esMiCurso && (
        <div className="absolute top-3 right-3 bg-primary text-white font-sans text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">
          Mi curso
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-on-primary-container bg-primary-container px-2.5 py-1 rounded-sm">
            <Hash className="w-3 h-3" />
            {curso.codigo}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full font-sans text-xs font-semibold ${
              curso.estado === "activo"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400"
                : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400"
            }`}
          >
            {curso.estado === "activo" ? "Activo" : "Inactivo"}
          </span>
        </div>

        <h3 className="font-serif font-light text-2xl tight-tracking text-on-surface mb-1 leading-tight">
          {curso.nombre}
        </h3>

        {curso.profesor && (
          <p className="font-sans text-xs text-primary/70 font-medium mb-2 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            {curso.profesor.name}
          </p>
        )}

        <p className="font-sans text-sm text-muted-foreground line-clamp-2 flex-1 mb-5">
          {curso.descripcion || (
            <span className="italic text-muted-foreground/50">
              Sin descripción
            </span>
          )}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40">
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <Users className="w-3.5 h-3.5" />
            <span className="font-sans text-xs">
              {curso.estudiantes?.length ?? 0}{" "}
              {(curso.estudiantes?.length ?? 0) === 1
                ? "estudiante"
                : "estudiantes"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <BookOpen className="w-3 h-3" />
            <span className="font-sans text-xs">
              {curso.estado === "activo" ? "Disponible" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Card ── */

function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-sm overflow-hidden ambient-shadow flex flex-col">
      <div className="h-1 bg-primary-container" />
      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-sm" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40 mt-auto">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */

export default function EstudianteCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [miCursoId, setMiCursoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${getCookie("token")}`,
      Accept: "application/json",
    };

    Promise.all([
      fetch(`${process.env.API_URL}api/estudiante/cursos`, { headers }).then(
        (r) => r.json(),
      ),
      fetch(`${process.env.API_URL}api/estudiante/perfil`, { headers }).then(
        (r) => r.json(),
      ),
    ])
      .then(([cursosData, perfil]) => {
        setCursos(Array.isArray(cursosData) ? cursosData : []);
        setMiCursoId(perfil?.curso?.id ?? null);
      })
      .catch(() => toast.error("Error al cargar los cursos"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return cursos.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        c.nombre.toLowerCase().includes(q) ||
        c.codigo.toLowerCase().includes(q) ||
        (c.descripcion?.toLowerCase().includes(q) ?? false) ||
        (c.profesor?.name.toLowerCase().includes(q) ?? false);
      const matchEstado = filterEstado === "todos" || c.estado === filterEstado;
      return matchSearch && matchEstado;
    });
  }, [cursos, search, filterEstado]);

  const hasFilters = search !== "" || filterEstado !== "todos";

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute top-0 right-0 w-[480px] h-[280px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-8 py-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-3 h-3 text-primary/70" />
            <span className="font-sans text-[10px] tracking-[0.22em] uppercase text-primary/70 font-medium">
              Plataforma / Cursos
            </span>
          </div>
          <h1 className="font-serif font-light text-[2.8rem] tight-tracking leading-[1.08] text-on-surface mb-2">
            Cursos disponibles
          </h1>
          <p className="font-sans text-sm text-muted-foreground">
            Catálogo de cursos de la plataforma IMAF.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10 max-w-2xl">
          {[
            { label: "Total", value: cursos.length, icon: BookOpen },
            {
              label: "Activos",
              value: cursos.filter((c) => c.estado === "activo").length,
              icon: Star,
            },
            {
              label: "Mi curso",
              value: miCursoId ? 1 : 0,
              icon: GraduationCap,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-low rounded-sm p-4 ambient-shadow"
            >
              <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary-container mb-3">
                <s.icon className="w-4 h-4 text-on-primary-container" />
              </div>
              {loading ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <p className="font-sans text-3xl font-light tight-tracking text-on-surface tabular-nums mb-1">
                  {s.value}
                </p>
              )}
              <p className="font-sans text-[10px] tracking-[0.15em] uppercase text-on-surface/55 font-semibold">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <Input
              placeholder="Buscar por nombre, código o profesor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 font-sans text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="h-10 w-44 font-sans text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterEstado("todos");
                }}
                className="font-sans text-xs text-muted-foreground hover:text-on-surface transition-colors underline underline-offset-2"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {filtered.length > 0 && (
              <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-on-surface/55 font-medium mb-5">
                {filtered.length} curso{filtered.length !== 1 ? "s" : ""}
                {hasFilters
                  ? ` encontrado${filtered.length !== 1 ? "s" : ""}`
                  : ""}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-on-primary-container" />
                  </div>
                  <div className="text-center">
                    <p className="font-serif font-light text-2xl text-on-surface mb-1">
                      {hasFilters
                        ? "Sin resultados"
                        : "No hay cursos disponibles"}
                    </p>
                    <p className="font-sans text-sm text-muted-foreground">
                      {hasFilters
                        ? "Ningún curso coincide con los filtros aplicados."
                        : "No hay cursos registrados en la plataforma aún."}
                    </p>
                  </div>
                </div>
              ) : (
                filtered.map((curso) => (
                  <Link key={curso.id} href={`/estudiante/cursos/${curso.id}`}>
                    <CursoCard curso={curso} miCursoId={miCursoId} />
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
